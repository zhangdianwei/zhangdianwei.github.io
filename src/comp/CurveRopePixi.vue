<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import * as PIXI from 'pixi.js';

const canvasWrap = ref(null);
const DEG2RAD = Math.PI / 180;

const state = reactive({
  curveType: 'bezier',
  samplingMode: 'uniform-param',
  uniformSegments: 24,
  fixedStep: 20,
  errorThreshold: 2.5,
  ropeWidth: 36,
  uvMode: 'segment',
  uvRepeat: 4,
  uvScrollSpeed: 0.18,
  showControlPoints: true,
  showSamplePoints: true,
  showWireframe: true,
  showNormals: false,
  showTexture: true,
  currentStep: 4
});

const curveParams = reactive({
  sineAmplitude: 110,
  sineCycles: 2.2,
  sinePhase: 0,
  parabolaA: 0.8,
  parabolaB: -0.2,
  parabolaC: -0.15,
  parabolaScale: 220,
  ellipseRadiusX: 300,
  ellipseRadiusY: 160,
  ellipseStartDeg: -160,
  ellipseEndDeg: 40,
  spiralA: 10,
  spiralTurns: 3.1,
  spiralStartDeg: -90
});

const defaultControlPoints = () => ([
  { x: 80, y: 360 },
  { x: 240, y: 120 },
  { x: 500, y: 520 },
  { x: 760, y: 240 }
]);
const controlPoints = reactive(defaultControlPoints());

const runtime = reactive({
  pointCount: 0,
  triangleCount: 0,
  approxError: 0,
  fps: 0
});

let app = null;
let ropeTexture = null;
let layers = null;
let ropeMesh = null;
let controlHandles = [];
let draggingIndex = -1;
let uvOffset = 0;
let autoPlayTimer = null;
let resizeObserver = null;
let currentSamples = [];
let currentStrip = null;
let lastErrorComputeAt = 0;

const curveDescription = computed(() => {
  if (state.curveType === 'bezier') return '贝塞尔曲线：支持拖拽 4 个控制点。';
  if (state.curveType === 'sine') return '正弦曲线：由振幅、周期与相位控制。';
  if (state.curveType === 'parabola') return '抛物线：由 a、b、c 以及纵向缩放控制。';
  if (state.curveType === 'ellipse') return '椭圆弧线：由半径与起止角定义。';
  return '阿基米德螺旋线：半径随角度线性增加。';
});

const strategyDescription = computed(() => {
  if (state.samplingMode === 'uniform-param') {
    return '参数均匀分段：实现简单，曲率大的地方可能点更稀疏。';
  }
  if (state.samplingMode === 'fixed-step') {
    return '固定步长分段：按长度取点，视觉密度更均匀。';
  }
  return '误差限制分段：按误差自适应细分，兼顾精度和点数。';
});

const stepLabel = computed(() => `步骤 ${state.currentStep} / 4`);

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function bezierPoint(t, p) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const a = mt2 * mt;
  const b = 3 * mt2 * t;
  const c = 3 * mt * t2;
  const d = t2 * t;
  return {
    x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x,
    y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y,
    t
  };
}

function getBoundsMeta() {
  const width = app?.screen.width || 900;
  const height = app?.screen.height || 560;
  const padX = clamp(width * 0.1, 60, 120);
  const padY = clamp(height * 0.1, 45, 90);
  return {
    width,
    height,
    left: padX,
    right: width - padX,
    top: padY,
    bottom: height - padY,
    cx: width * 0.5,
    cy: height * 0.5
  };
}

function evalCurveAt(t) {
  const tt = clamp(t, 0, 1);
  const b = getBoundsMeta();
  if (state.curveType === 'bezier') {
    return bezierPoint(tt, controlPoints);
  }
  if (state.curveType === 'sine') {
    const x = lerp(b.left, b.right, tt);
    const phase = curveParams.sinePhase * DEG2RAD;
    const y = b.cy + curveParams.sineAmplitude * Math.sin(tt * curveParams.sineCycles * Math.PI * 2 + phase);
    return { x, y, t: tt };
  }
  if (state.curveType === 'parabola') {
    const nx = lerp(-1, 1, tt);
    const ny = curveParams.parabolaA * nx * nx + curveParams.parabolaB * nx + curveParams.parabolaC;
    const x = lerp(b.left, b.right, tt);
    const y = b.cy - ny * curveParams.parabolaScale;
    return { x, y, t: tt };
  }
  if (state.curveType === 'ellipse') {
    const start = curveParams.ellipseStartDeg * DEG2RAD;
    const end = curveParams.ellipseEndDeg * DEG2RAD;
    const theta = lerp(start, end, tt);
    const x = b.cx + curveParams.ellipseRadiusX * Math.cos(theta);
    const y = b.cy + curveParams.ellipseRadiusY * Math.sin(theta);
    return { x, y, t: tt };
  }
  const turns = Math.max(0.25, curveParams.spiralTurns);
  const theta = lerp(curveParams.spiralStartDeg * DEG2RAD, (curveParams.spiralStartDeg + 360 * turns) * DEG2RAD, tt);
  const r = curveParams.spiralA * theta;
  const x = b.cx + r * Math.cos(theta);
  const y = b.cy + r * Math.sin(theta);
  return { x, y, t: tt };
}

function dist(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

function lengthToT(totalLength, lookup) {
  if (lookup.length === 0) return 0;
  if (totalLength <= 0) return 0;
  const max = lookup[lookup.length - 1].len;
  if (totalLength >= max) return 1;
  for (let i = 1; i < lookup.length; i++) {
    if (lookup[i].len >= totalLength) {
      const prev = lookup[i - 1];
      const next = lookup[i];
      const delta = next.len - prev.len || 1;
      const ratio = (totalLength - prev.len) / delta;
      return prev.t + (next.t - prev.t) * ratio;
    }
  }
  return 1;
}

function buildArcLengthLookup(steps = 240) {
  const table = [{ t: 0, len: 0 }];
  let acc = 0;
  let prev = evalCurveAt(0);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const cur = evalCurveAt(t);
    acc += dist(prev, cur);
    table.push({ t, len: acc });
    prev = cur;
  }
  return table;
}

function sampleUniformParam(segs) {
  const out = [];
  const safe = Math.max(2, Math.floor(segs));
  for (let i = 0; i <= safe; i++) {
    out.push(evalCurveAt(i / safe));
  }
  return out;
}

function sampleFixedStep(step) {
  const lookup = buildArcLengthLookup(440);
  const total = lookup[lookup.length - 1].len;
  const safeStep = Math.max(6, step);
  const count = Math.max(2, Math.ceil(total / safeStep));
  const out = [];
  for (let i = 0; i <= count; i++) {
    const target = (i / count) * total;
    out.push(evalCurveAt(lengthToT(target, lookup)));
  }
  return out;
}

function pointLineDistance(p, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const wx = p.x - a.x;
  const wy = p.y - a.y;
  const c1 = vx * wx + vy * wy;
  const c2 = vx * vx + vy * vy;
  const ratio = c2 === 0 ? 0 : Math.max(0, Math.min(1, c1 / c2));
  const projX = a.x + vx * ratio;
  const projY = a.y + vy * ratio;
  return Math.hypot(p.x - projX, p.y - projY);
}

function sampleByError(threshold) {
  const points = [evalCurveAt(0)];
  const maxDepth = 12;
  const safeThreshold = Math.max(0.5, threshold);

  function subdivide(t0, t1, a, b, depth) {
    const tm = (t0 + t1) * 0.5;
    const m = evalCurveAt(tm);
    const err = pointLineDistance(m, a, b);
    if (err <= safeThreshold || depth >= maxDepth) {
      points.push(b);
      return;
    }
    subdivide(t0, tm, a, m, depth + 1);
    subdivide(tm, t1, m, b, depth + 1);
  }

  subdivide(0, 1, evalCurveAt(0), evalCurveAt(1), 0);
  return points;
}

function sampleCurve() {
  if (state.samplingMode === 'uniform-param') return sampleUniformParam(state.uniformSegments);
  if (state.samplingMode === 'fixed-step') return sampleFixedStep(state.fixedStep);
  return sampleByError(state.errorThreshold);
}

function buildStripGeometry(samples, width, uvMode, uvRepeat, uvShift = 0) {
  const n = samples.length;
  if (n < 2) return null;
  const halfW = width * 0.5;
  const vertices = [];
  const uvs = [];
  const indices = [];
  const leftPts = [];
  const rightPts = [];
  const lengths = [0];

  for (let i = 1; i < n; i++) lengths.push(lengths[i - 1] + dist(samples[i - 1], samples[i]));
  const totalLen = Math.max(1, lengths[lengths.length - 1]);

  for (let i = 0; i < n; i++) {
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(n - 1, i + 1)];
    let tx = next.x - prev.x;
    let ty = next.y - prev.y;
    const tLen = Math.hypot(tx, ty) || 1;
    tx /= tLen;
    ty /= tLen;
    const nx = -ty;
    const ny = tx;
    const l = { x: samples[i].x + nx * halfW, y: samples[i].y + ny * halfW };
    const r = { x: samples[i].x - nx * halfW, y: samples[i].y - ny * halfW };
    leftPts.push(l);
    rightPts.push(r);
    vertices.push(l.x, l.y, r.x, r.y);
    const uBase = uvMode === 'segment' ? (i / (n - 1)) * uvRepeat : (lengths[i] / totalLen) * uvRepeat;
    const u = uBase + uvShift;
    uvs.push(u, 0, u, 1);
  }

  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, c, b, d);
  }
  return {
    vertices: new Float32Array(vertices),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
    leftPts,
    rightPts
  };
}

function pointToSegmentDistance(point, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const ab2 = abx * abx + aby * aby || 1;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  const x = a.x + abx * t;
  const y = a.y + aby * t;
  return Math.hypot(point.x - x, point.y - y);
}

function estimateApproxError(samples) {
  if (samples.length < 2) return 0;
  let maxErr = 0;
  const dense = 180;
  for (let i = 0; i <= dense; i++) {
    const pt = evalCurveAt(i / dense);
    let best = Infinity;
    for (let j = 0; j < samples.length - 1; j++) {
      const d = pointToSegmentDistance(pt, samples[j], samples[j + 1]);
      if (d < best) best = d;
    }
    if (best > maxErr) maxErr = best;
  }
  return maxErr;
}

function createRopeTexture(renderer) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;
  const gradient = ctx.createLinearGradient(0, 0, 0, c.height);
  gradient.addColorStop(0, '#f0d7a2');
  gradient.addColorStop(0.55, '#c7a267');
  gradient.addColorStop(1, '#8d6436');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, c.width, c.height);

  for (let x = -128; x < c.width + 128; x += 28) {
    ctx.strokeStyle = 'rgba(60, 37, 17, 0.4)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x, 2);
    ctx.lineTo(x + 46, c.height - 2);
    ctx.stroke();
  }
  for (let x = 0; x < c.width + 128; x += 28) {
    ctx.strokeStyle = 'rgba(255, 245, 220, 0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, c.height - 4);
    ctx.lineTo(x + 35, 4);
    ctx.stroke();
  }
  const texture = PIXI.Texture.from(c);
  texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
  texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
  if (renderer) renderer.texture.bind(texture.baseTexture);
  return texture;
}

function drawCurveAndHelpers(samples, strip) {
  layers.curve.clear();
  layers.samples.clear();
  layers.wire.clear();
  layers.normals.clear();
  layers.guides.clear();

  const denseCount = 180;
  layers.curve.lineStyle(2.5, 0x5cc8ff, 0.9);
  const first = evalCurveAt(0);
  layers.curve.moveTo(first.x, first.y);
  for (let i = 1; i <= denseCount; i++) {
    const p = evalCurveAt(i / denseCount);
    layers.curve.lineTo(p.x, p.y);
  }

  if (state.currentStep >= 2 && state.showSamplePoints) {
    for (let i = 0; i < samples.length; i++) {
      layers.samples.beginFill(0xffffff, 0.95);
      layers.samples.drawCircle(samples[i].x, samples[i].y, 3);
      layers.samples.endFill();
    }
  }

  if (!strip) return;
  const drawMeshPart = state.currentStep >= 3;
  if (drawMeshPart && state.showWireframe) {
    layers.wire.lineStyle(1.2, 0xffffff, 0.55);
    for (let i = 0; i < strip.leftPts.length; i++) {
      const l = strip.leftPts[i];
      const r = strip.rightPts[i];
      if (i === 0) {
        layers.wire.moveTo(l.x, l.y);
        layers.wire.moveTo(r.x, r.y);
      } else {
        const prevL = strip.leftPts[i - 1];
        const prevR = strip.rightPts[i - 1];
        layers.wire.moveTo(prevL.x, prevL.y);
        layers.wire.lineTo(l.x, l.y);
        layers.wire.moveTo(prevR.x, prevR.y);
        layers.wire.lineTo(r.x, r.y);
      }
      layers.wire.moveTo(l.x, l.y);
      layers.wire.lineTo(r.x, r.y);
    }
  }

  if (drawMeshPart && state.showNormals) {
    layers.normals.lineStyle(1, 0x66ff66, 0.7);
    const half = state.ropeWidth * 0.5;
    for (let i = 0; i < samples.length; i++) {
      const prev = samples[Math.max(0, i - 1)];
      const next = samples[Math.min(samples.length - 1, i + 1)];
      let tx = next.x - prev.x;
      let ty = next.y - prev.y;
      const len = Math.hypot(tx, ty) || 1;
      tx /= len;
      ty /= len;
      const nx = -ty;
      const ny = tx;
      layers.normals.moveTo(samples[i].x, samples[i].y);
      layers.normals.lineTo(samples[i].x + nx * half, samples[i].y + ny * half);
    }
  }
}

function clearControlHandles() {
  if (!layers?.controls) return;
  while (layers.controls.children.length) {
    layers.controls.removeChildAt(0).destroy();
  }
  controlHandles = [];
  draggingIndex = -1;
}

function updateControlHandles() {
  if (!layers.controls || !layers.guides) return;
  if (!state.showControlPoints || state.curveType !== 'bezier') {
    layers.guides.clear();
    if (controlHandles.length > 0) clearControlHandles();
    return;
  }

  if (controlHandles.length !== controlPoints.length) {
    clearControlHandles();
  }
  layers.guides.lineStyle(1.5, 0xffd27f, 0.5);
  layers.guides.moveTo(controlPoints[0].x, controlPoints[0].y);
  layers.guides.lineTo(controlPoints[1].x, controlPoints[1].y);
  layers.guides.lineTo(controlPoints[2].x, controlPoints[2].y);
  layers.guides.lineTo(controlPoints[3].x, controlPoints[3].y);

  if (controlHandles.length === 0) {
    for (let i = 0; i < controlPoints.length; i++) {
      const g = new PIXI.Graphics();
      g.beginFill(i === 0 || i === 3 ? 0xff8a3d : 0xffdf77, 1);
      g.lineStyle(2, 0x111111, 0.9);
      g.drawCircle(0, 0, 8);
      g.endFill();
      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointerdown', (e) => {
        draggingIndex = i;
        const p = e.data.global;
        g._dragOffsetX = p.x - g.x;
        g._dragOffsetY = p.y - g.y;
      });
      layers.controls.addChild(g);
      controlHandles.push(g);
    }
  }

  for (let i = 0; i < controlPoints.length; i++) {
    const g = controlHandles[i];
    if (!g) continue;
    g.x = controlPoints[i].x;
    g.y = controlPoints[i].y;
  }
}

function rebuildMesh(samples) {
  currentStrip = buildStripGeometry(samples, state.ropeWidth, state.uvMode, state.uvRepeat, uvOffset);
  if (ropeMesh) {
    layers.mesh.removeChild(ropeMesh);
    ropeMesh.destroy({ children: true, texture: false, baseTexture: false });
    ropeMesh = null;
  }
  if (!currentStrip) return;
  const geometry = new PIXI.MeshGeometry(currentStrip.vertices, currentStrip.uvs, currentStrip.indices);
  const material = new PIXI.MeshMaterial(ropeTexture, {
    alpha: state.showTexture && state.currentStep >= 4 ? 1 : 0.32
  });
  ropeMesh = new PIXI.Mesh(geometry, material);
  ropeMesh.roundPixels = true;
  layers.mesh.addChild(ropeMesh);
}

function renderAll(opts = {}) {
  if (!app) return;
  const { fast = false } = opts;
  const samples = sampleCurve();
  currentSamples = samples;
  rebuildMesh(samples);
  drawCurveAndHelpers(samples, currentStrip);
  updateControlHandles();
  runtime.pointCount = samples.length;
  runtime.triangleCount = Math.max(0, (samples.length - 1) * 2);
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const shouldUpdateError = !fast || now - lastErrorComputeAt > 120;
  if (shouldUpdateError) {
    runtime.approxError = estimateApproxError(samples);
    lastErrorComputeAt = now;
  }
}

function resetCurveParams(curveType) {
  if (curveType === 'bezier') {
    const cp = defaultControlPoints();
    for (let i = 0; i < controlPoints.length; i++) {
      controlPoints[i].x = cp[i].x;
      controlPoints[i].y = cp[i].y;
    }
    return;
  }
  if (curveType === 'sine') {
    curveParams.sineAmplitude = 110;
    curveParams.sineCycles = 2.2;
    curveParams.sinePhase = 0;
    return;
  }
  if (curveType === 'parabola') {
    curveParams.parabolaA = 0.8;
    curveParams.parabolaB = -0.2;
    curveParams.parabolaC = -0.15;
    curveParams.parabolaScale = 220;
    return;
  }
  if (curveType === 'ellipse') {
    curveParams.ellipseRadiusX = 300;
    curveParams.ellipseRadiusY = 160;
    curveParams.ellipseStartDeg = -160;
    curveParams.ellipseEndDeg = 40;
    return;
  }
  curveParams.spiralA = 10;
  curveParams.spiralTurns = 3.1;
  curveParams.spiralStartDeg = -90;
}

function resetParams() {
  state.curveType = 'bezier';
  state.samplingMode = 'uniform-param';
  state.uniformSegments = 24;
  state.fixedStep = 20;
  state.errorThreshold = 2.5;
  state.ropeWidth = 36;
  state.uvMode = 'segment';
  state.uvRepeat = 4;
  state.uvScrollSpeed = 0.18;
  state.showControlPoints = true;
  state.showSamplePoints = true;
  state.showWireframe = true;
  state.showNormals = false;
  state.showTexture = true;
  state.currentStep = 4;
  resetCurveParams('bezier');
  resetCurveParams('sine');
  resetCurveParams('parabola');
  resetCurveParams('ellipse');
  resetCurveParams('spiral');
  uvOffset = 0;
  renderAll();
}

function playSteps() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
  state.currentStep = 1;
  autoPlayTimer = setInterval(() => {
    state.currentStep += 1;
    if (state.currentStep > 4) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
      state.currentStep = 4;
    }
    renderAll();
  }, 900);
}

function bindPointerEvents() {
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointermove', (e) => {
    if (draggingIndex < 0 || state.curveType !== 'bezier') return;
    const handle = controlHandles[draggingIndex];
    if (!handle) return;
    const p = e.data.global;
    const x = p.x - (handle._dragOffsetX || 0);
    const y = p.y - (handle._dragOffsetY || 0);
    const clampedX = clamp(x, 24, app.screen.width - 24);
    const clampedY = clamp(y, 24, app.screen.height - 24);
    controlPoints[draggingIndex].x = clampedX;
    controlPoints[draggingIndex].y = clampedY;
    handle.x = clampedX;
    handle.y = clampedY;
    renderAll({ fast: true });
  });
  app.stage.on('pointerup', () => {
    draggingIndex = -1;
    renderAll();
  });
  app.stage.on('pointerupoutside', () => {
    draggingIndex = -1;
    renderAll();
  });
}

function initPixi() {
  if (!canvasWrap.value) return;
  app = new PIXI.Application({
    antialias: true,
    backgroundAlpha: 0,
    resizeTo: canvasWrap.value
  });
  canvasWrap.value.appendChild(app.view);
  ropeTexture = createRopeTexture(app.renderer);
  layers = {
    mesh: new PIXI.Container(),
    curve: new PIXI.Graphics(),
    guides: new PIXI.Graphics(),
    samples: new PIXI.Graphics(),
    wire: new PIXI.Graphics(),
    normals: new PIXI.Graphics(),
    controls: new PIXI.Container()
  };
  app.stage.addChild(layers.mesh, layers.curve, layers.guides, layers.samples, layers.wire, layers.normals, layers.controls);
  bindPointerEvents();
  renderAll();

  app.ticker.add((delta) => {
    const fps = app.ticker.FPS || 0;
    runtime.fps = runtime.fps === 0 ? fps : runtime.fps * 0.88 + fps * 0.12;
    if (state.currentStep >= 4 && state.showTexture && state.uvScrollSpeed > 0) {
      uvOffset += (state.uvScrollSpeed * delta) / 60;
      if (currentSamples.length > 1) rebuildMesh(currentSamples);
    }
  });

  resizeObserver = new ResizeObserver(() => {
    if (!app || !canvasWrap.value) return;
    app.renderer.resize(canvasWrap.value.clientWidth, canvasWrap.value.clientHeight);
    renderAll();
  });
  resizeObserver.observe(canvasWrap.value);
}

watch(
  () => [
    state.curveType,
    state.samplingMode,
    state.uniformSegments,
    state.fixedStep,
    state.errorThreshold,
    state.ropeWidth,
    state.uvMode,
    state.uvRepeat,
    state.showControlPoints,
    state.showSamplePoints,
    state.showWireframe,
    state.showNormals,
    state.showTexture,
    state.currentStep,
    curveParams.sineAmplitude,
    curveParams.sineCycles,
    curveParams.sinePhase,
    curveParams.parabolaA,
    curveParams.parabolaB,
    curveParams.parabolaC,
    curveParams.parabolaScale,
    curveParams.ellipseRadiusX,
    curveParams.ellipseRadiusY,
    curveParams.ellipseStartDeg,
    curveParams.ellipseEndDeg,
    curveParams.spiralA,
    curveParams.spiralTurns,
    curveParams.spiralStartDeg
  ],
  () => { renderAll(); }
);

watch(
  () => state.curveType,
  () => {
    clearControlHandles();
    renderAll();
  }
);

onMounted(() => {
  initPixi();
});

onBeforeUnmount(() => {
  if (autoPlayTimer) clearInterval(autoPlayTimer);
  if (resizeObserver) resizeObserver.disconnect();
  if (app) {
    app.destroy(true, { children: true, texture: false, baseTexture: false });
    app = null;
  }
});
</script>

<template>
  <div class="curve-rope-demo">
    <aside class="panel">
      <h3>曲线绳带 Demo（CPU）</h3>
      <div class="section no-border">
        <div class="label">曲线类型</div>
        <select v-model="state.curveType">
          <option value="bezier">贝塞尔曲线</option>
          <option value="sine">正弦曲线</option>
          <option value="parabola">抛物线</option>
          <option value="ellipse">椭圆弧线</option>
          <option value="spiral">阿基米德螺旋线</option>
        </select>
        <p class="hint">{{ curveDescription }}</p>
      </div>

      <div v-if="state.curveType === 'sine'" class="section">
        <div class="label">正弦参数</div>
        <div class="row">
          <label>振幅 {{ curveParams.sineAmplitude.toFixed(0) }}</label>
          <input v-model.number="curveParams.sineAmplitude" type="range" min="20" max="220" step="1" />
        </div>
        <div class="row">
          <label>周期数 {{ curveParams.sineCycles.toFixed(1) }}</label>
          <input v-model.number="curveParams.sineCycles" type="range" min="0.5" max="6" step="0.1" />
        </div>
        <div class="row">
          <label>相位 {{ curveParams.sinePhase.toFixed(0) }}°</label>
          <input v-model.number="curveParams.sinePhase" type="range" min="-180" max="180" step="1" />
        </div>
      </div>

      <div v-if="state.curveType === 'parabola'" class="section">
        <div class="label">抛物线参数</div>
        <div class="row">
          <label>a {{ curveParams.parabolaA.toFixed(2) }}</label>
          <input v-model.number="curveParams.parabolaA" type="range" min="-2.5" max="2.5" step="0.01" />
        </div>
        <div class="row">
          <label>b {{ curveParams.parabolaB.toFixed(2) }}</label>
          <input v-model.number="curveParams.parabolaB" type="range" min="-2.5" max="2.5" step="0.01" />
        </div>
        <div class="row">
          <label>c {{ curveParams.parabolaC.toFixed(2) }}</label>
          <input v-model.number="curveParams.parabolaC" type="range" min="-1.5" max="1.5" step="0.01" />
        </div>
        <div class="row">
          <label>纵向缩放 {{ curveParams.parabolaScale.toFixed(0) }}</label>
          <input v-model.number="curveParams.parabolaScale" type="range" min="60" max="380" step="1" />
        </div>
      </div>

      <div v-if="state.curveType === 'ellipse'" class="section">
        <div class="label">椭圆参数</div>
        <div class="row">
          <label>半径X {{ curveParams.ellipseRadiusX.toFixed(0) }}</label>
          <input v-model.number="curveParams.ellipseRadiusX" type="range" min="60" max="430" step="1" />
        </div>
        <div class="row">
          <label>半径Y {{ curveParams.ellipseRadiusY.toFixed(0) }}</label>
          <input v-model.number="curveParams.ellipseRadiusY" type="range" min="40" max="260" step="1" />
        </div>
        <div class="row">
          <label>起始角 {{ curveParams.ellipseStartDeg.toFixed(0) }}°</label>
          <input v-model.number="curveParams.ellipseStartDeg" type="range" min="-360" max="360" step="1" />
        </div>
        <div class="row">
          <label>结束角 {{ curveParams.ellipseEndDeg.toFixed(0) }}°</label>
          <input v-model.number="curveParams.ellipseEndDeg" type="range" min="-360" max="360" step="1" />
        </div>
      </div>

      <div v-if="state.curveType === 'spiral'" class="section">
        <div class="label">螺旋参数</div>
        <div class="row">
          <label>a {{ curveParams.spiralA.toFixed(1) }}</label>
          <input v-model.number="curveParams.spiralA" type="range" min="2" max="24" step="0.1" />
        </div>
        <div class="row">
          <label>圈数 {{ curveParams.spiralTurns.toFixed(1) }}</label>
          <input v-model.number="curveParams.spiralTurns" type="range" min="0.4" max="6" step="0.1" />
        </div>
        <div class="row">
          <label>起始角 {{ curveParams.spiralStartDeg.toFixed(0) }}°</label>
          <input v-model.number="curveParams.spiralStartDeg" type="range" min="-360" max="360" step="1" />
        </div>
      </div>

      <div class="section">
        <div class="label">分步视图</div>
        <div class="row-inline">
          <button :class="{ active: state.currentStep === 1 }" @click="state.currentStep = 1">1 曲线</button>
          <button :class="{ active: state.currentStep === 2 }" @click="state.currentStep = 2">2 采样</button>
          <button :class="{ active: state.currentStep === 3 }" @click="state.currentStep = 3">3 网格</button>
          <button :class="{ active: state.currentStep === 4 }" @click="state.currentStep = 4">4 UV</button>
        </div>
      </div>

      <div class="section">
        <div class="label">采样策略</div>
        <select v-model="state.samplingMode">
          <option value="uniform-param">参数均匀分段</option>
          <option value="fixed-step">固定步长分段</option>
          <option value="error-limit">误差限制分段</option>
        </select>
        <div v-if="state.samplingMode === 'uniform-param'" class="row">
          <label>分段数 {{ state.uniformSegments }}</label>
          <input v-model.number="state.uniformSegments" type="range" min="6" max="140" />
        </div>
        <div v-if="state.samplingMode === 'fixed-step'" class="row">
          <label>步长 {{ state.fixedStep.toFixed(0) }}</label>
          <input v-model.number="state.fixedStep" type="range" min="6" max="80" step="1" />
        </div>
        <div v-if="state.samplingMode === 'error-limit'" class="row">
          <label>误差阈值 {{ state.errorThreshold.toFixed(1) }}</label>
          <input v-model.number="state.errorThreshold" type="range" min="0.6" max="8" step="0.1" />
        </div>
      </div>

      <div class="section">
        <div class="label">网格参数</div>
        <div class="row">
          <label>宽度 {{ state.ropeWidth.toFixed(0) }}</label>
          <input v-model.number="state.ropeWidth" type="range" min="8" max="90" step="1" />
        </div>
      </div>

      <div class="section">
        <div class="label">UV 参数</div>
        <select v-model="state.uvMode">
          <option value="segment">按段均匀</option>
          <option value="arclength">按弧长</option>
        </select>
        <div class="row">
          <label>重复次数 {{ state.uvRepeat.toFixed(1) }}</label>
          <input v-model.number="state.uvRepeat" type="range" min="1" max="16" step="0.5" />
        </div>
        <div class="row">
          <label>滚动速度 {{ state.uvScrollSpeed.toFixed(2) }}</label>
          <input v-model.number="state.uvScrollSpeed" type="range" min="0" max="1.2" step="0.02" />
        </div>
      </div>

      <div class="section">
        <div class="label">显示项</div>
        <label class="checkbox"><input v-model="state.showControlPoints" type="checkbox" /> 控制点（仅贝塞尔）</label>
        <label class="checkbox"><input v-model="state.showSamplePoints" type="checkbox" /> 采样点</label>
        <label class="checkbox"><input v-model="state.showWireframe" type="checkbox" /> 网格线框</label>
        <label class="checkbox"><input v-model="state.showNormals" type="checkbox" /> 法线</label>
        <label class="checkbox"><input v-model="state.showTexture" type="checkbox" /> 纹理显示</label>
      </div>

      <div class="row-inline">
        <button @click="resetParams">重置参数</button>
        <button @click="playSteps">一键演示</button>
      </div>
    </aside>

    <main class="stage-wrap">
      <div ref="canvasWrap" class="stage-canvas" />
      <div class="step-tag">{{ stepLabel }}</div>
    </main>

    <footer class="status">
      <span>采样点：{{ runtime.pointCount }}</span>
      <span>三角形：{{ runtime.triangleCount }}</span>
      <span>估算误差：{{ runtime.approxError.toFixed(2) }} px</span>
      <span>FPS：{{ runtime.fps.toFixed(1) }}</span>
      <span class="desc">{{ strategyDescription }}</span>
    </footer>
  </div>
</template>

<style scoped>
.curve-rope-demo {
  display: grid;
  grid-template-columns: 300px 1fr;
  grid-template-rows: 1fr 48px;
  gap: 10px;
  width: 100%;
  height: 100%;
  min-height: 640px;
  color: #e7ebf5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.panel {
  grid-row: 1 / span 2;
  background: #1b2130;
  border: 1px solid #2f3a52;
  border-radius: 10px;
  padding: 12px;
  overflow-y: auto;
}

.panel h3 {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
}

.section {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #3b4762;
}

.no-border {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.label {
  margin-bottom: 8px;
  color: #f0cc82;
  font-size: 13px;
}

.hint {
  margin: 8px 0 0;
  color: #a9b6d3;
  font-size: 12px;
  line-height: 1.35;
}

.row,
.row-inline {
  display: flex;
  gap: 8px;
  align-items: center;
}

.row {
  margin-top: 8px;
  flex-direction: column;
  align-items: stretch;
}

.row label {
  font-size: 12px;
}

.row-inline {
  margin-top: 10px;
}

button,
select,
input[type='range'] {
  width: 100%;
}

button,
select {
  height: 30px;
  border-radius: 6px;
  border: 1px solid #425072;
  background: #26304a;
  color: #e7ebf5;
}

button {
  cursor: pointer;
}

button.active {
  border-color: #86b5ff;
  background: #2b4574;
}

.checkbox {
  display: block;
  margin-top: 6px;
  font-size: 13px;
}

.checkbox input {
  margin-right: 6px;
}

.stage-wrap {
  position: relative;
  border: 1px solid #334260;
  border-radius: 10px;
  overflow: hidden;
  background:
    radial-gradient(circle at 24px 24px, rgba(255, 255, 255, 0.05) 2px, transparent 0) 0 0 / 48px 48px,
    #131925;
}

.stage-canvas {
  width: 100%;
  height: 100%;
  min-height: 520px;
}

.step-tag {
  position: absolute;
  right: 10px;
  top: 10px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(12, 18, 30, 0.72);
  border: 1px solid rgba(147, 182, 255, 0.45);
  font-size: 12px;
}

.status {
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 10px;
  border: 1px solid #2f3a52;
  background: #161e2d;
  padding: 0 12px;
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
}

.status .desc {
  color: #a9b6d3;
}
</style>