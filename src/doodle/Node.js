import { Container } from "pixi.js";
import { genId } from "./uid.js";

export class Node extends Container {
  id = genId("n");
  name = this.id;
  varName = "";                // 运行时程序变量名
  _comps = [];
  visual = new Container();
  posType = "percent";         // percent=父框百分比(用 posPct) | abs=绝对(用 x/y)
  posPct = { x: 0.5, y: 0.5 };
  sizeType = "fixed";          // fixed=固定 | percent=父框百分比
  size = { w: 100, h: 100 };   // fixed 用
  sizePct = { x: 1, y: 1 };    // percent 用(0..1)
  _box = { w: 0, h: 0 };       // 解算后的自身框,运行时,不序列化

  constructor(name) {
    super();
    if (name) this.name = name;
    this.addChild(this.visual);
  }
  addComp(c) { this._comps.push(c); c.node = this; c.onAdd?.(); return c; }
  removeComp(c) { this._comps = this._comps.filter(x => x !== c); c.onRemove?.(); }
  getComp(Cls) { return this._comps.find(x => x instanceof Cls); }
  destroy() {
    for (const c of [...this.children]) if (c instanceof Node) c.destroy();
    for (const c of this._comps) c.onRemove?.();
    super.destroy({ children: true });
  }
}

export const isNode = o => o instanceof Node;
