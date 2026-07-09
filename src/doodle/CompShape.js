import rough from "roughjs";
import { Graphics } from "pixi.js";
import { Component } from "./Component.js";
import { genId } from "./uid.js";
import { vertsBounds } from "./geom.js";

const gen = rough.generator();
const hex = n => "#" + n.toString(16).padStart(6, "0");
let _seed = 1;

export function vert(x, y, r = 0) {
  return { id: genId("v"), x, y, r };
}

function roundedPath(vs, closed) {
  const n = vs.length, seg = [];
  for (let i = 0; i < n; i++) {
    const P = vs[i];
    if (!P.r || (!closed && (i === 0 || i === n - 1))) { seg.push({ P, in: P, out: P, round: false }); continue; }
    const A = vs[(i - 1 + n) % n], B = vs[(i + 1) % n];
    const ax = A.x - P.x, ay = A.y - P.y, bx = B.x - P.x, by = B.y - P.y;
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (la === 0 || lb === 0) { seg.push({ P, in: P, out: P, round: false }); continue; }
    const d = P.r * Math.min(la, lb) / 2;
    seg.push({
      P, round: true,
      in: { x: P.x + ax / la * d, y: P.y + ay / la * d },
      out: { x: P.x + bx / lb * d, y: P.y + by / lb * d },
    });
  }
  let s = `M ${seg[0].in.x} ${seg[0].in.y}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const c = seg[i], nx = seg[(i + 1) % n];
    if (c.round) s += ` Q ${c.P.x} ${c.P.y} ${c.out.x} ${c.out.y}`;
    s += ` L ${nx.in.x} ${nx.in.y}`;
  }
  return closed ? s + " Z" : s;
}

function opsToPolylines(ops, steps = 10) {
  const paths = []; let cur = null, px = 0, py = 0;
  for (const o of ops) {
    const d = o.data;
    if (o.op === "move") { cur = [{ x: d[0], y: d[1] }]; paths.push(cur); px = d[0]; py = d[1]; }
    else {
      for (let s = 1; s <= steps; s++) {
        const t = s / steps, m = 1 - t;
        cur.push({
          x: m * m * m * px + 3 * m * m * t * d[0] + 3 * m * t * t * d[2] + t * t * t * d[4],
          y: m * m * m * py + 3 * m * m * t * d[1] + 3 * m * t * t * d[3] + t * t * t * d[5],
        });
      }
      px = d[4]; py = d[5];
    }
  }
  return paths;
}

function dashStroke(g, ops, dash, width) {
  const [on, off] = dash === "dotted" ? [Math.max(width * 0.7, 1), width * 1.8 + 3] : [width * 3 + 5, width * 2 + 4];
  for (const pts of opsToPolylines(ops)) {
    let rem = on, draw = true;
    for (let i = 1; i < pts.length; i++) {
      let ax = pts[i - 1].x, ay = pts[i - 1].y;
      const bx = pts[i].x, by = pts[i].y;
      let len = Math.hypot(bx - ax, by - ay);
      const ux = len ? (bx - ax) / len : 0, uy = len ? (by - ay) / len : 0;
      while (len > 1e-6) {
        const step = Math.min(rem, len);
        const nx = ax + ux * step, ny = ay + uy * step;
        if (draw) { g.moveTo(ax, ay); g.lineTo(nx, ny); }
        ax = nx; ay = ny; len -= step; rem -= step;
        if (rem <= 1e-6) { draw = !draw; rem = draw ? on : off; }
      }
    }
  }
}

export class CompShape extends Component {
  verts = [];
  fill = 0x66ccff;
  stroke = 0x333333;
  width = 2;
  closed = true;
  fillEnabled = true;
  strokeEnabled = true;
  dash = "solid";
  seed = _seed++;
  rough = { roughness: 1, bowing: 1, fillStyle: "hachure", fillWeight: 2, hachureGap: 6 };

  constructor(verts = []) {
    super();
    this.verts = verts;
  }
  onAdd() { this.g = new Graphics(); this.node.visual.addChild(this.g); this.redraw(); }
  onRemove() { this.g?.destroy(); this.g = null; }
  bounds() { return this.verts.length ? vertsBounds(this.verts) : null; }

  _options() {
    return {
      fill: this.fillEnabled ? hex(this.fill) : undefined,
      stroke: hex(this.stroke),
      strokeWidth: this.width,
      seed: this.seed,
      ...this.rough,
    };
  }
  redraw() {
    const g = this.g;
    g.clear();
    if (!this.verts.length) return;
    const drawable = gen.path(roundedPath(this.verts, this.closed), this._options());
    for (const set of drawable.sets) {
      if (set.type === "fillPath") { g.lineStyle(0); g.beginFill(this.fill); }
      else if (set.type === "fillSketch") g.lineStyle(this.rough.fillWeight, this.fill);
      else {
        if (!this.strokeEnabled) continue;
        g.lineStyle(this.width, this.stroke);
        if (this.dash !== "solid") { dashStroke(g, set.ops, this.dash, this.width); continue; }
      }
      for (const o of set.ops) {
        const d = o.data;
        if (o.op === "move") g.moveTo(d[0], d[1]);
        else g.bezierCurveTo(d[0], d[1], d[2], d[3], d[4], d[5]);
      }
      if (set.type === "fillPath") g.endFill();
    }
  }
}
