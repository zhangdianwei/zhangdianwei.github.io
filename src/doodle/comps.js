import { Node } from "./Node.js";
import { CompShape, vert } from "./CompShape.js";
import { makeVerts } from "./shapes.js";
import { makeStyleComp } from "./fancy.js";
import { CompText } from "./CompText.js";
import { CompProgress } from "./CompProgress.js";
import { CompButton } from "./CompButton.js";

const S = 2; // 新建组件默认放大倍数
const scale = s => { s.verts.forEach(v => { v.x *= S; v.y *= S; }); return s; };
const rect = (w, h, fill) => scale(Object.assign(new CompShape([vert(-w / 2, -h / 2, .3), vert(w / 2, -h / 2, .3), vert(w / 2, h / 2, .3), vert(-w / 2, h / 2, .3)]), { fill }));
const shapeC = (kind, param) => scale(Object.assign(new CompShape(makeVerts(kind, param)), { fill: 0x9966ff }));
const styleC = kind => scale(makeStyleComp(kind));

function node(name, ...comps) { const n = new Node(); n.name = name; for (const c of comps) if (c) n.addComp(c); return n; }

// 进度条:容器(CompProgress,fixed 裁剪区) + 条子节点(CompShape,外观可改)
function progressNode() {
  const n = new Node(); n.name = "进度条";
  n.sizeType = "fixed"; n.size = { w: 220 * S, h: 30 * S };
  n.addChild(node("条", rect(220, 30, 0x4caf50)));
  n.addComp(new CompProgress());
  return n;
}

// 按钮:空节点(CompButton,fixed 点击区) + 背景子节点 + 文本子节点
function buttonNode() {
  const n = node("按钮", new CompButton());
  n.sizeType = "fixed"; n.size = { w: 180 * S, h: 60 * S };
  const t = new CompText(); t.text = "点一下"; t.color = 0x000000; t.fontSize = 30 * S;
  n.addChild(node("背景", rect(180, 60, 0x2d8cf0)));
  n.addChild(node("文本", t));
  return n;
}

function textNode() { const t = new CompText(); t.fontSize *= S; return node("文本", t); }

// 新建物件:make() 返回成品节点(可带组件与子节点);input 表示需要参数
export const NEW_ITEMS = [
  { name: "空节点", make: () => node("节点") },
  { sep: true },
  { name: "正方形", make: () => node("正方形", shapeC("rect")) },
  { name: "n 边形", input: { def: 5, min: 3 }, make: p => node("多边形", shapeC("polygon", p)) },
  { name: "n 角形", input: { def: 5, min: 3 }, make: p => node("星形", shapeC("star", p)) },
  { name: "水滴形", make: () => node("水滴", styleC("drop")) },
  { name: "火焰形", make: () => node("火焰", styleC("flame")) },
  { name: "闪电形", make: () => node("闪电", styleC("lightning")) },
  { sep: true },
  { name: "文本节点", make: textNode },
  { name: "进度条", make: progressNode },
  { name: "按钮", make: buttonNode },
];

// 可挂到已选中节点的组件(同类唯一)
export const ADD_COMPS = [
  { key: "shape", name: "图形", cls: CompShape, make: () => shapeC("rect") },
  { key: "text", name: "文本", cls: CompText, make: () => { const t = new CompText(); t.fontSize *= S; return t; } },
  { key: "progress", name: "进度条", cls: CompProgress, make: () => new CompProgress() },
  { key: "button", name: "按钮", cls: CompButton, make: () => new CompButton() },
];
