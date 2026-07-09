import { isNode } from "./Node.js";

export function pointInPoly(verts, p) {
  let inside = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const a = verts[i], b = verts[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function vertsBounds(verts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const v of verts) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  return { minX, minY, maxX, maxY };
}

export function worldBounds(node, shape) {
  const b = vertsBounds(shape.verts);
  const cs = [
    node.toGlobal({ x: b.minX, y: b.minY }),
    node.toGlobal({ x: b.maxX, y: b.minY }),
    node.toGlobal({ x: b.maxX, y: b.maxY }),
    node.toGlobal({ x: b.minX, y: b.maxY }),
  ];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const c of cs) {
    if (c.x < minX) minX = c.x;
    if (c.x > maxX) maxX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.y > maxY) maxY = c.y;
  }
  return { minX, minY, maxX, maxY };
}

export function pointToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const x = a.x + dx * t, y = a.y + dy * t;
  return { x, y, t, dist: Math.hypot(p.x - x, p.y - y) };
}

export function rectsIntersect(a, b) {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

export function normRect(m) {
  return {
    minX: Math.min(m.x0, m.x1), maxX: Math.max(m.x0, m.x1),
    minY: Math.min(m.y0, m.y1), maxY: Math.max(m.y0, m.y1),
  };
}

// 所有显示组件的局部包围盒并集(实时);无则 null
export function contentBounds(n) {
  let b = null;
  for (const c of n._comps || []) {
    const cb = c.bounds?.();
    if (!cb) continue;
    b = b ? { minX: Math.min(b.minX, cb.minX), minY: Math.min(b.minY, cb.minY), maxX: Math.max(b.maxX, cb.maxX), maxY: Math.max(b.maxY, cb.maxY) } : cb;
  }
  return b;
}

// 节点自身局部框:设定 size 的 _box(居中原点)
export function localBounds(n) {
  const w = n._box?.w || 60, h = n._box?.h || 60;
  return { minX: -w / 2, minY: -h / 2, maxX: w / 2, maxY: h / 2 };
}

// 整棵子树的显示包围框(实时,组件 bounds + 递归子节点),用于"重置为内容尺寸"
export function subtreeBounds(n) {
  let b = contentBounds(n);
  for (const c of n.children) {
    if (!isNode(c)) continue;
    const cb = subtreeBounds(c);
    if (!cb) continue;
    const box = { minX: cb.minX + c.x, minY: cb.minY + c.y, maxX: cb.maxX + c.x, maxY: cb.maxY + c.y };
    b = b ? { minX: Math.min(b.minX, box.minX), minY: Math.min(b.minY, box.minY), maxX: Math.max(b.maxX, box.maxX), maxY: Math.max(b.maxY, box.maxY) } : box;
  }
  return b;
}

// 节点在设计空间(root 局部)的包围盒
export function designBounds(node, root) {
  const b = localBounds(node);
  const cs = [
    root.toLocal(node.toGlobal({ x: b.minX, y: b.minY })),
    root.toLocal(node.toGlobal({ x: b.maxX, y: b.minY })),
    root.toLocal(node.toGlobal({ x: b.maxX, y: b.maxY })),
    root.toLocal(node.toGlobal({ x: b.minX, y: b.maxY })),
  ];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const c of cs) {
    if (c.x < minX) minX = c.x; if (c.x > maxX) maxX = c.x;
    if (c.y < minY) minY = c.y; if (c.y > maxY) maxY = c.y;
  }
  return { minX, minY, maxX, maxY };
}
