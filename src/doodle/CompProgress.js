import { Graphics } from "pixi.js";
import { Component } from "./Component.js";
import { localBounds } from "./geom.js";

// 纯逻辑:按 value(0..1) 水平裁剪整个节点(含所有显示子节点)。挂在容器上,显示放子节点。
export class CompProgress extends Component {
  value = 0.6;

  onAdd() { this.m = new Graphics(); this.node.addChild(this.m); this.redraw(); }
  onResize() { this.redraw(); }
  onRemove() { if (this.node) this.node.mask = null; this.m?.destroy(); this.m = null; }
  redraw() {
    if (!this.m) return;
    const b = localBounds(this.node);
    const w = (b.maxX - b.minX) * Math.max(0, Math.min(1, this.value));
    this.m.clear();
    this.m.beginFill(0xffffff);
    this.m.drawRect(b.minX, b.minY, w, b.maxY - b.minY);
    this.m.endFill();
    this.node.mask = this.m;
  }
}
