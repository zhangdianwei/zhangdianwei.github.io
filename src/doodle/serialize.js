import { Node, isNode } from "./Node.js";
import { CompShape } from "./CompShape.js";
import { CompAnim, Track } from "./CompAnim.js";
import { CompText, CompProgress, CompButton } from "./ui.js";

// component 序列化注册表:加新 component(text/image…)只需在此加一项
const REG = [
  {
    type: "shape", cls: CompShape,
    save: s => ({
      verts: s.verts.map(v => ({ id: v.id, x: v.x, y: v.y, r: v.r })),
      fill: s.fill, stroke: s.stroke, width: s.width, closed: s.closed, seed: s.seed,
      fillEnabled: s.fillEnabled, strokeEnabled: s.strokeEnabled, dash: s.dash, rough: { ...s.rough },
    }),
    load: d => {
      const s = new CompShape(d.verts.map(v => ({ ...v })));
      Object.assign(s, {
        fill: d.fill, stroke: d.stroke, width: d.width, closed: d.closed, seed: d.seed,
        fillEnabled: d.fillEnabled, strokeEnabled: d.strokeEnabled, dash: d.dash, rough: { ...d.rough },
      });
      return s;
    },
  },
  {
    type: "anim", cls: CompAnim,
    save: a => ({
      current: a.currentName,
      clips: Object.fromEntries(Object.entries(a.clips).map(([name, c]) =>
        [name, { loop: c.loop, duration: c.duration, tracks: c.tracks.map(t => ({ target: t.target, keys: t.keys.map(k => ({ t: k.t, value: [...k.value], ease: k.ease })) })) }])),
    }),
    load: d => new CompAnim(Object.fromEntries(Object.entries(d.clips).map(([name, c]) =>
      [name, { loop: c.loop, duration: c.duration, tracks: c.tracks.map(t => new Track(t.target, t.keys.map(k => ({ t: k.t, value: [...k.value], ease: k.ease })))) }]))),
  },
  {
    type: "text", cls: CompText,
    save: c => ({ text: c.text, fontSize: c.fontSize, color: c.color, align: c.align }),
    load: d => Object.assign(new CompText(), { text: d.text, fontSize: d.fontSize, color: d.color, align: d.align }),
  },
  {
    type: "progress", cls: CompProgress,
    save: c => ({ value: c.value }),
    load: d => Object.assign(new CompProgress(), { value: d.value }),
  },
  {
    type: "button", cls: CompButton,
    save: () => ({}),
    load: () => new CompButton(),
  },
];

export function saveNodeToJson(root) {
  const walk = n => {
    const o = {
      id: n.id, name: n.name, varName: n.varName,
      transform: { x: n.x, y: n.y, rotation: n.rotation, scaleX: n.scale.x, scaleY: n.scale.y, pivotX: n.pivot.x, pivotY: n.pivot.y },
      layout: { posType: n.posType, posPct: { ...n.posPct }, sizeType: n.sizeType, size: { ...n.size }, sizePct: { ...n.sizePct } },
      components: [],
    };
    for (const c of n._comps) {
      const r = REG.find(e => c instanceof e.cls);
      if (r) o.components.push({ type: r.type, ...r.save(c) });
    }
    const kids = n.children.filter(isNode);
    if (kids.length) o.children = kids.map(walk);
    return o;
  };
  return { nodes: [walk(root)] };
}

export function loadNodeFromJson(json) {
  const build = o => {
    const n = new Node(o.name);
    n.id = o.id;
    n.varName = o.varName || "";
    const t = o.transform;
    n.x = t.x; n.y = t.y; n.rotation = t.rotation;
    if (t.scaleX != null) n.scale.set(t.scaleX, t.scaleY);
    if (t.pivotX != null) n.pivot.set(t.pivotX, t.pivotY);
    const L = o.layout;
    if (L) {
      n.posType = L.posType || "abs"; n.sizeType = L.sizeType || "fixed";
      if (L.posPct) n.posPct = { ...L.posPct };
      if (L.size) n.size = { ...L.size };
      if (L.sizePct) n.sizePct = { ...L.sizePct };
    }
    for (const cd of o.components) {
      const c = n.addComp(REG.find(e => e.type === cd.type).load(cd));
      if (cd.current) c.play(cd.current);
    }
    (o.children || []).forEach(ch => n.addChild(build(ch)));
    return n;
  };
  return build(json.nodes[0]);
}
