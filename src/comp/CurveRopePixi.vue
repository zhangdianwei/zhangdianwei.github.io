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
  uvScrollSpeed: 0,
  showCurve: true,
  showSamplePoints: true,
  showWireframe: true,
  showTexture: true
});

const curveParams = reactive({
  sineAmplitude: 110,
  sineCycles: 2.2,
  sinePhase: 0,
  parabolaA: -1.47,
  parabolaB: 0,
  parabolaC: 0.9,
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
let resizeObserver = null;
let currentSamples = [];
let currentStrip = null;
let lastErrorComputeAt = 0;

const strategyDescription = computed(() => {
  if (state.samplingMode === 'uniform-param') {
    return '参数均匀分段：实现简单，曲率大的地方可能点更稀疏。';
  }
  if (state.samplingMode === 'fixed-step') {
    return '固定步长分段：按长度取点，视觉密度更均匀。';
  }
  return '误差限制分段：按误差自适应细分，兼顾精度和点数。';
});

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

  if (state.showCurve) {
    const denseCount = 180;
    layers.curve.lineStyle(2.5, 0x5cc8ff, 0.9);
    const first = evalCurveAt(0);
    layers.curve.moveTo(first.x, first.y);
    for (let i = 1; i <= denseCount; i++) {
      const p = evalCurveAt(i / denseCount);
      layers.curve.lineTo(p.x, p.y);
    }
  }

  if (state.showSamplePoints) {
    layers.samples.beginFill(0xffffff, 0.95);
    for (let i = 0; i < samples.length; i++) {
      layers.samples.drawCircle(samples[i].x, samples[i].y, 3);
    }
    layers.samples.endFill();
  }

  if (!strip) return;
  if (state.showWireframe) {
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
  if (state.curveType !== 'bezier') {
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
  const baseTexture = state.showTexture ? ropeTexture : PIXI.Texture.WHITE;
  const material = new PIXI.MeshMaterial(baseTexture, {
    alpha: 1
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
    if (state.showTexture && state.uvScrollSpeed > 0) {
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
    state.showCurve,
    state.showSamplePoints,
    state.showWireframe,
    state.showTexture,
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
  if (resizeObserver) resizeObserver.disconnect();
  if (app) {
    app.destroy(true, { children: true, texture: false, baseTexture: false });
    app = null;
  }
});
</script>

<template>
  <Row :gutter="16">
    <Col :xs="24" :sm="24" :md="8" :lg="7" :xl="6">
      <Card dis-hover>
        <template #title>曲线绳带 Demo（CPU）</template>
        <Form :label-width="90" size="small">
          <Divider orientation="left">1. 选择曲线类型</Divider>
          <FormItem label="曲线类型">
            <Select v-model="state.curveType">
              <Option value="bezier">贝塞尔曲线</Option>
              <Option value="sine">正弦曲线</Option>
              <Option value="parabola">抛物线</Option>
              <Option value="ellipse">椭圆弧线</Option>
              <Option value="spiral">阿基米德螺旋线</Option>
            </Select>
          </FormItem>

          <FormItem v-if="state.curveType === 'sine'" label="振幅">
            <Slider v-model="curveParams.sineAmplitude" :min="20" :max="220" :step="1" show-input />
          </FormItem>
          <FormItem v-if="state.curveType === 'sine'" label="周期数">
            <Slider v-model="curveParams.sineCycles" :min="0.5" :max="6" :step="0.1" show-input />
          </FormItem>
          <FormItem v-if="state.curveType === 'sine'" label="相位">
            <Slider v-model="curveParams.sinePhase" :min="-180" :max="180" :step="1" show-input />
          </FormItem>

          <FormItem v-if="state.curveType === 'parabola'" label="a">
            <Slider v-model="curveParams.parabolaA" :min="-2.5" :max="2.5" :step="0.01" show-input />
          </FormItem>
          <FormItem v-if="state.curveType === 'parabola'" label="b">
            <Slider v-model="curveParams.parabolaB" :min="-2.5" :max="2.5" :step="0.01" show-input />
          </FormItem>
          <FormItem v-if="state.curveType === 'parabola'" label="c">
            <Slider v-model="curveParams.parabolaC" :min="-1.5" :max="1.5" :step="0.01" show-input />
          </FormItem>
          <FormItem v-if="state.curveType === 'parabola'" label="纵向缩放">
            <Slider v-model="curveParams.parabolaScale" :min="60" :max="380" :step="1" show-input />
          </FormItem>

          <FormItem v-if="state.curveType === 'ellipse'" label="半径X">
            <Slider v-model="curveParams.ellipseRadiusX" :min="60" :max="430" :step="1" show-input />
          </FormItem>
          <FormItem v-if="state.curveType === 'ellipse'" label="半径Y">
            <Slider v-model="curveParams.ellipseRadiusY" :min="40" :max="260" :step="1" show-input />
          </FormItem>
          <FormItem v-if="state.curveType === 'ellipse'" label="起始角">
            <Slider v-model="curveParams.ellipseStartDeg" :min="-360" :max="360" :step="1" show-input />
          </FormItem>
          <FormItem v-if="state.curveType === 'ellipse'" label="结束角">
            <Slider v-model="curveParams.ellipseEndDeg" :min="-360" :max="360" :step="1" show-input />
          </FormItem>

          <FormItem v-if="state.curveType === 'spiral'" label="a">
            <Slider v-model="curveParams.spiralA" :min="2" :max="24" :step="0.1" show-input />
          </FormItem>
          <FormItem v-if="state.curveType === 'spiral'" label="圈数">
            <Slider v-model="curveParams.spiralTurns" :min="0.4" :max="6" :step="0.1" show-input />
          </FormItem>
          <FormItem v-if="state.curveType === 'spiral'" label="起始角">
            <Slider v-model="curveParams.spiralStartDeg" :min="-360" :max="360" :step="1" show-input />
          </FormItem>

          <Divider orientation="left">2. 采样策略</Divider>
          <FormItem label="采样策略">
            <Select v-model="state.samplingMode">
              <Option value="uniform-param">参数均匀分段</Option>
              <Option value="fixed-step">固定步长分段</Option>
              <Option value="error-limit">误差限制分段</Option>
            </Select>
          </FormItem>
          <FormItem v-if="state.samplingMode === 'uniform-param'" label="分段数">
            <Slider v-model="state.uniformSegments" :min="6" :max="140" :step="1" show-input />
          </FormItem>
          <FormItem v-if="state.samplingMode === 'fixed-step'" label="步长">
            <Slider v-model="state.fixedStep" :min="6" :max="80" :step="1" show-input />
          </FormItem>
          <FormItem v-if="state.samplingMode === 'error-limit'" label="误差阈值">
            <Slider v-model="state.errorThreshold" :min="0.6" :max="8" :step="0.1" show-input />
          </FormItem>

          <Divider orientation="left">3. 构造网格</Divider>
          <FormItem label="网格宽度">
            <Slider v-model="state.ropeWidth" :min="8" :max="90" :step="1" show-input />
          </FormItem>

          <Divider orientation="left">4. UV模式</Divider>
          <FormItem label="UV模式">
            <Select v-model="state.uvMode">
              <Option value="segment">按段均匀</Option>
              <Option value="arclength">按弧长</Option>
            </Select>
          </FormItem>
          <FormItem label="重复次数">
            <Slider v-model="state.uvRepeat" :min="1" :max="16" :step="0.5" show-input />
          </FormItem>
          <FormItem label="滚动速度">
            <Slider v-model="state.uvScrollSpeed" :min="0" :max="1.2" :step="0.02" show-input />
          </FormItem>

          <Divider orientation="left">5. 视图显示</Divider>
          <FormItem label="显示项">
            <Checkbox v-model="state.showCurve">显示曲线</Checkbox><br />
            <Checkbox v-model="state.showSamplePoints">控制细分点</Checkbox><br />
            <Checkbox v-model="state.showWireframe">网格线框</Checkbox><br />
            <Checkbox v-model="state.showTexture">纹理显示</Checkbox>
          </FormItem>
        </Form>
      </Card>
    </Col>

    <Col :xs="24" :sm="24" :md="16" :lg="17" :xl="18">
      <Card dis-hover>
        <template #title>曲线预览</template>
        <div ref="canvasWrap" style="width: 100%; height: 640px; background: #dff4ff;" />
      </Card>
      <Card dis-hover style="margin-top: 12px;">
        <Tag color="blue">采样点：{{ runtime.pointCount }}</Tag>
        <Tag color="green">三角形：{{ runtime.triangleCount }}</Tag>
        <Tag color="orange">估算误差：{{ runtime.approxError.toFixed(2) }} px</Tag>
        <Tag color="purple">FPS：{{ runtime.fps.toFixed(1) }}</Tag>
        <p style="margin-top: 10px;">{{ strategyDescription }}</p>
      </Card>
    </Col>
  </Row>
</template>