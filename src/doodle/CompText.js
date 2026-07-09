import { Text } from "pixi.js";
import { Component } from "./Component.js";

// 纯显示:文本
export class CompText extends Component {
  text = "文本";
  fontSize = 56;
  color = 0x333333;
  align = "center";

  onAdd() { this.t = new Text(this.text, this._style()); this.t.anchor.set(0.5); this.node.visual.addChild(this.t); }
  onRemove() { this.t?.destroy(); this.t = null; }
  _style() { return { fontFamily: "sans-serif", fontSize: this.fontSize, fill: this.color, align: this.align }; }
  redraw() { if (!this.t) return; this.t.text = this.text; this.t.style = this._style(); this.t.anchor.set(0.5); }
  bounds() { if (!this.t) return null; const w = this.t.width, h = this.t.height; return { minX: -w / 2, minY: -h / 2, maxX: w / 2, maxY: h / 2 }; }
}
