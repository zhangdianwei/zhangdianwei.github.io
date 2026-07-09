import { reactive } from "vue";
import { isNode } from "./Node.js";

// 模拟设备(真机像素);编辑器用它决定"设备框"的形状
export const DEVICES = [
  { name: "竖屏", w: 1170, h: 2532 },
  { name: "方形", w: 1080, h: 1080 },
  { name: "横屏", w: 2532, h: 1170 },
];

export const adapt = reactive({
  design: { w: 1170, h: 2532 }, // 设计分辨率,默认对齐竖屏
  deviceIndex: 0,               // 默认竖屏 (1170×2532) = 设计分辨率
  scale: 1,                    // 设计→设备真实缩放 = min fit,永不裁
  rect: { w: 750, h: 1334 },   // 设备框(设计单位),居中于原点,恒 ⊇ 设计框
  canvas: { w: 0, h: 0 },      // 编辑器画布像素
  view: 1,                     // 最终显示缩放 = fit × zoom
  zoom: 1,                     // 用户滚轮缩放
  pan: { x: 0, y: 0 },         // 用户平移(相对画布中心)
  origin: { x: 0, y: 0 },      // root 在屏幕上的位置 = 画布中心 + pan
});

export const device = () => DEVICES[adapt.deviceIndex];

export function recompute() {
  const d = adapt.design, dev = device();
  const scale = Math.min(dev.w / d.w, dev.h / d.h);
  adapt.scale = scale;
  adapt.rect = { w: dev.w / scale, h: dev.h / scale };
}

// 节点在父框下解算出的自身框(设计单位):供子节点百分比参照 + gizmo
function sizeOf(n, box) {
  if (n.sizeType === "percent") return { w: box.w * n.sizePct.x, h: box.h * n.sizePct.y };
  return { w: n.size.w, h: n.size.h }; // fixed
}

// 自顶向下解算:posType 定位置(原点对齐),sizeType 定框
export function resolve(n, box) {
  n._box = sizeOf(n, box);
  for (const c of n._comps) c.onResize?.();   // 尺寸解算后通知组件(如 CompProgress 更新裁剪)
  if (n.posType === "percent") { n.x = (n.posPct.x - 0.5) * box.w; n.y = (n.posPct.y - 0.5) * box.h; }
  for (const c of n.children) if (isNode(c)) resolve(c, n._box);
}

// 交互移动后,把 percent 节点的像素位置反写回百分比
export function syncPos(n) {
  if (n.posType !== "percent") return;
  const b = n.parent?._box || adapt.rect;
  n.posPct = { x: n.x / b.w + 0.5, y: n.y / b.h + 0.5 };
}

// 编辑器布局:root 缩放居中 + 自顶向下解算
export function relayout(root) {
  recompute();
  const { canvas, rect } = adapt;
  const fit = Math.min(canvas.w / rect.w, canvas.h / rect.h) * 0.9 || 1;
  adapt.view = fit * adapt.zoom;
  adapt.origin = { x: canvas.w / 2 + adapt.pan.x, y: canvas.h / 2 + adapt.pan.y };
  if (!root) return;
  root.scale.set(adapt.view);
  root.position.set(adapt.origin.x, adapt.origin.y);
  root._box = { w: rect.w, h: rect.h };
  for (const c of root.children) if (isNode(c)) resolve(c, root._box);
}
