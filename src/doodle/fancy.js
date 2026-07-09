import { CompShape, vert } from "./CompShape.js";

// 样式组件:预置顶点 + 手绘样式的 CompShape(纯显示,无动画)
const rough = o => ({ roughness: 1, bowing: 1, fillStyle: "hachure", fillWeight: 2, hachureGap: 6, ...o });
function comp(verts, style) { const s = new CompShape(verts); Object.assign(s, style); return s; }

function flame() {
  return comp([
    vert(0, 60, .3), vert(38, 42, .4), vert(30, 0, .2), vert(44, -18, 0),
    vert(16, -30, .3), vert(6, -66, 0), vert(-14, -34, .3), vert(-40, -16, 0),
    vert(-30, 4, .2), vert(-36, 44, .4),
  ], { fill: 0xff6a00, stroke: 0xcc2200, rough: rough({ roughness: 1.4, bowing: 1.6, fillStyle: "zigzag", fillWeight: 3, hachureGap: 5 }) });
}
function lightning() {
  return comp([
    vert(-4, -75, 0), vert(28, -75, 0), vert(4, -12, 0), vert(24, -12, 0),
    vert(-14, 75, 0), vert(-2, 6, 0), vert(-26, 6, 0),
  ], { fill: 0xffd21a, stroke: 0xf29100, rough: rough({ roughness: .9, fillWeight: 2.5, hachureGap: 4 }) });
}
function grass() {
  return comp([
    vert(-46, 30, .3), vert(-34, -36, 0), vert(-22, -2, .2), vert(-8, -52, 0),
    vert(4, -6, .2), vert(18, -40, 0), vert(28, -4, .2), vert(40, -30, 0), vert(46, 30, .3),
  ], { fill: 0x5aa02a, stroke: 0x2f6d16, rough: rough({ roughness: 1.2, fillWeight: 2, hachureGap: 5 }) });
}
function brick() {
  return comp([vert(-90, -30, .2), vert(90, -30, .2), vert(90, 30, .2), vert(-90, 30, .2)],
    { fill: 0xb1553a, stroke: 0x7a3320, rough: rough({ roughness: 1.2, fillWeight: 2.5, hachureGap: 4 }) });
}
function drop() {
  return comp([
    vert(0, -62, 0), vert(30, -6, .5), vert(34, 30, .8),
    vert(0, 56, .9), vert(-34, 30, .8), vert(-30, -6, .5),
  ], { fill: 0x2f9fe6, stroke: 0x1c6fa8, rough: rough({ roughness: .8, fillStyle: "solid" }) });
}
function cloud() {
  return comp([
    vert(-58, 22, .5), vert(-64, -6, 1), vert(-34, -30, 1), vert(2, -40, 1),
    vert(40, -28, 1), vert(62, -2, 1), vert(58, 22, .5),
  ], { fill: 0xeef2f7, stroke: 0x9aa7b5, rough: rough({ roughness: 1, fillStyle: "solid" }) });
}

export const STYLES = [
  { key: "flame", name: "火焰" }, { key: "lightning", name: "雷电" }, { key: "grass", name: "草" },
  { key: "brick", name: "砖块" }, { key: "drop", name: "水滴" }, { key: "cloud", name: "云" },
];
export function makeStyleComp(kind) {
  switch (kind) {
    case "lightning": return lightning();
    case "grass": return grass();
    case "brick": return brick();
    case "drop": return drop();
    case "cloud": return cloud();
    default: return flame();
  }
}
