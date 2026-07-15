// 动画预设:build(base) → [{ path, keys:[{ tf(0..1 时间比例), value: number[], ease? }] }]
// 基于节点当前变换值(b)生成;回弹靠 ease="backOut" 等缓动。b = { x, y, sx, sy, rot, a }
export const PRESETS = [
  { key: "appear", name: "出现 · 弹性放大", build: b => [
    { path: "transform/scale", keys: [{ tf: 0, value: [0, 0], ease: "backOut" }, { tf: 1, value: [b.sx, b.sy] }] },
    { path: "transform/alpha", keys: [{ tf: 0, value: [0], ease: "easeOut" }, { tf: .5, value: [b.a] }] },
  ] },
  { key: "disappear", name: "消失 · 缩小淡出", build: b => [
    { path: "transform/scale", keys: [{ tf: 0, value: [b.sx, b.sy], ease: "easeIn" }, { tf: 1, value: [0, 0] }] },
    { path: "transform/alpha", keys: [{ tf: .3, value: [b.a], ease: "easeIn" }, { tf: 1, value: [0] }] },
  ] },
  { key: "pop", name: "弹跳强调", build: b => [
    { path: "transform/scale", keys: [{ tf: 0, value: [b.sx, b.sy], ease: "easeOut" }, { tf: .5, value: [b.sx * 1.25, b.sy * 1.25], ease: "easeIn" }, { tf: 1, value: [b.sx, b.sy] }] },
  ] },
  { key: "fadeIn", name: "淡入", build: b => [
    { path: "transform/alpha", keys: [{ tf: 0, value: [0], ease: "easeOut" }, { tf: 1, value: [b.a] }] },
  ] },
  { key: "fadeOut", name: "淡出", build: b => [
    { path: "transform/alpha", keys: [{ tf: 0, value: [b.a], ease: "easeIn" }, { tf: 1, value: [0] }] },
  ] },
  { key: "slideUp", name: "上移淡入", build: b => [
    { path: "transform/pos", keys: [{ tf: 0, value: [b.x, b.y + 40], ease: "backOut" }, { tf: 1, value: [b.x, b.y] }] },
    { path: "transform/alpha", keys: [{ tf: 0, value: [0], ease: "easeOut" }, { tf: .6, value: [b.a] }] },
  ] },
];
