import { vert } from "./CompShape.js";

export function rect(w = 120, h = 80) {
  const x = w / 2, y = h / 2;
  return [vert(-x, -y, 0), vert(x, -y, 0), vert(x, y, 0), vert(-x, y, 0)];
}

export function circle(r = 60) {
  return [vert(0, -r, 1), vert(r, 0, 1), vert(0, r, 1), vert(-r, 0, 1)];
}

export function polygon(n = 5, r = 70) {
  const vs = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 - Math.PI / 2;
    vs.push(vert(Math.cos(a) * r, Math.sin(a) * r, 0));
  }
  return vs;
}

export function star(n = 5, rOut = 80, rIn = 34) {
  const vs = [];
  for (let i = 0; i < n * 2; i++) {
    const a = i / (n * 2) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? rIn : rOut;
    vs.push(vert(Math.cos(a) * r, Math.sin(a) * r, 0));
  }
  return vs;
}

export function line(len = 140) {
  return [vert(-len / 2, 0, 0), vert(len / 2, 0, 0)];
}

export function arrow(len = 140, w = 16, hw = 34, hl = 40) {
  const x0 = -len / 2, x1 = len / 2, xh = x1 - hl;
  return [
    vert(x0, -w / 2, 0), vert(xh, -w / 2, 0), vert(xh, -hw / 2, 0),
    vert(x1, 0, 0),
    vert(xh, hw / 2, 0), vert(xh, w / 2, 0), vert(x0, w / 2, 0),
  ];
}

export function speechBubble() {
  return [
    vert(-60, -40, 0.4), vert(60, -40, 0.4), vert(60, 40, 0.4),
    vert(-5, 40, 0), vert(-25, 66, 0), vert(-30, 40, 0), vert(-60, 40, 0.4),
  ];
}

export function makeVerts(kind, param) {
  switch (kind) {
    case "circle": return circle();
    case "polygon": return polygon(param || 5);
    case "star": return star(param || 5);
    case "line": return line();
    case "arrow": return arrow();
    case "speechBubble": return speechBubble();
    default: return rect();
  }
}

export const KIND_NAME = {
  rect: "Rect", circle: "Circle", polygon: "Polygon", star: "Star", line: "Line", arrow: "Arrow",
  speechBubble: "Bubble", group: "node",
};
