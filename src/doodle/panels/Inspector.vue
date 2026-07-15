<script setup>
import { computed, ref } from "vue";
import { CompShape } from "../CompShape.js";
import { CompText, CompProgress, CompButton } from "../ui.js";
import { editor, touch, selectedNodesList, selectedVertsList, selectedShape, resetTransform, setPosType, setSizeType, setPos, setSize, addCompByKey, removeComps, fitSize } from "../editor.js";
import { ADD_COMPS } from "../comps.js";
import RecordBtn from "./RecordBtn.vue";

const nodeMode = computed(() => { editor.rev; return editor.mode === "node"; });
const isRoot = computed(() => { editor.rev; return selectedNodesList().some(n => n === editor.root); });
const nodesLen = computed(() => { editor.rev; return selectedNodesList().length; });
const mainNode = computed(() => { editor.rev; return selectedNodesList()[0] || null; });
const shapesLen = computed(() => { editor.rev; return shapes().length; });
const vertsLen = computed(() => { editor.rev; return selectedVertsList().length; });

const nodes = () => selectedNodesList();
const shapes = () => selectedNodesList().map(n => n?.getComp(CompShape)).filter(Boolean);
const verts = () => selectedVertsList();
const dirtyShapes = () => { for (const s of shapes()) s.redraw(); };
const dirtyCur = () => selectedShape()?.redraw();

// 数值:混合值 → null(占位 —)
function multi(list, read, write, after) {
  return computed({
    get: () => { editor.rev; const l = list(); if (!l.length) return null; const v0 = read(l[0]); return l.every(o => read(o) === v0) ? v0 : null; },
    set: v => { if (v == null) return; list().forEach(o => write(o, v)); after?.(); touch(); },
  });
}
// 色/开关/选择:取首个,应用全部
function first(list, read, write, after) {
  return computed({
    get: () => { editor.rev; const l = list(); return l.length ? read(l[0]) : undefined; },
    set: v => { list().forEach(o => write(o, v)); after?.(); touch(); },
  });
}
const toHex = n => "#" + (n >>> 0).toString(16).padStart(6, "0").slice(-6);
const fromHex = v => { const n = parseInt((v || "").replace("#", ""), 16); return Number.isNaN(n) ? null : n; };

// —— 基础
const varName = first(nodes, n => n.varName, (n, v) => n.varName = v);
// —— 位置(pos + posType);percent 用百分制整数展示,底层存 0..1
const posType = computed({ get: () => { editor.rev; return nodes()[0]?.posType || "abs"; }, set: setPosType });
const px = computed({ get: () => { editor.rev; const n = nodes()[0]; if (!n) return null; return n.posType === "percent" ? Math.round(n.posPct.x * 100) : Math.round(n.x); }, set: v => { if (v == null) return; const n = nodes()[0]; setPos("x", n?.posType === "percent" ? v / 100 : v); } });
const py = computed({ get: () => { editor.rev; const n = nodes()[0]; if (!n) return null; return n.posType === "percent" ? Math.round(n.posPct.y * 100) : Math.round(n.y); }, set: v => { if (v == null) return; const n = nodes()[0]; setPos("y", n?.posType === "percent" ? v / 100 : v); } });

// —— 尺寸(size + sizeType);percent 同样用百分制整数
const sizeType = computed({ get: () => { editor.rev; return nodes()[0]?.sizeType || "fixed"; }, set: setSizeType });
const sw = computed({ get: () => { editor.rev; const n = nodes()[0]; if (!n) return null; return n.sizeType === "percent" ? Math.round(n.sizePct.x * 100) : Math.round(n.size.w); }, set: v => { if (v == null) return; const n = nodes()[0]; setSize("x", n?.sizeType === "percent" ? v / 100 : v); } });
const sh = computed({ get: () => { editor.rev; const n = nodes()[0]; if (!n) return null; return n.sizeType === "percent" ? Math.round(n.sizePct.y * 100) : Math.round(n.size.h); }, set: v => { if (v == null) return; const n = nodes()[0]; setSize("y", n?.sizeType === "percent" ? v / 100 : v); } });

// —— 其余变换
const rotDeg = multi(nodes, n => Math.round(n.rotation * 180 / Math.PI), (n, v) => n.rotation = v * Math.PI / 180);
const scaleX = multi(nodes, n => n.scale.x, (n, v) => n.scale.x = v);
const scaleY = multi(nodes, n => n.scale.y, (n, v) => n.scale.y = v);
const pivotX = multi(nodes, n => Math.round(n.pivot.x), (n, v) => n.pivot.x = v);
const pivotY = multi(nodes, n => Math.round(n.pivot.y), (n, v) => n.pivot.y = v);
const alpha = multi(nodes, n => Math.round(n.alpha * 100) / 100, (n, v) => n.alpha = v);
// 记录按钮:一属性一轨道,read 返回分量数组(变换类)
const RB = {
  pos: { path: "transform/pos", read: n => [n.x, n.y] },
  rot: { path: "transform/rotation", read: n => [n.rotation] },
  scale: { path: "transform/scale", read: n => [n.scale.x, n.scale.y] },
  alpha: { path: "transform/alpha", read: n => [n.alpha] },
};

// —— 样式
const fillOn = first(shapes, s => s.fillEnabled, (s, v) => s.fillEnabled = v, dirtyShapes);
const fillCol = first(shapes, s => toHex(s.fill), (s, v) => { const c = fromHex(v); if (c != null) s.fill = c; }, dirtyShapes);
const strokeOn = first(shapes, s => s.strokeEnabled, (s, v) => s.strokeEnabled = v, dirtyShapes);
const strokeCol = first(shapes, s => toHex(s.stroke), (s, v) => { const c = fromHex(v); if (c != null) s.stroke = c; }, dirtyShapes);
const width = multi(shapes, s => s.width, (s, v) => s.width = v, dirtyShapes);
const dash = first(shapes, s => s.dash, (s, v) => s.dash = v, dirtyShapes);
const closed = first(shapes, s => s.closed, (s, v) => s.closed = v, dirtyShapes);
const fillStyle = first(shapes, s => s.rough.fillStyle, (s, v) => s.rough.fillStyle = v, dirtyShapes);
const roughness = first(shapes, s => s.rough.roughness, (s, v) => s.rough.roughness = v, dirtyShapes);
const bowing = first(shapes, s => s.rough.bowing, (s, v) => s.rough.bowing = v, dirtyShapes);
const fillWeight = first(shapes, s => s.rough.fillWeight, (s, v) => s.rough.fillWeight = v, dirtyShapes);
const hachureGap = first(shapes, s => s.rough.hachureGap, (s, v) => s.rough.hachureGap = v, dirtyShapes);
const seed = multi(shapes, s => s.seed, (s, v) => s.seed = v, dirtyShapes);
function randomSeed() { shapes().forEach(s => s.seed = Math.floor(Math.random() * 1e6)); dirtyShapes(); touch(); }

// —— UI 组件
const texts = () => selectedNodesList().map(n => n?.getComp(CompText)).filter(Boolean);
const progs = () => selectedNodesList().map(n => n?.getComp(CompProgress)).filter(Boolean);
const textsLen = computed(() => { editor.rev; return texts().length; });
const progsLen = computed(() => { editor.rev; return progs().length; });
const dirtyTexts = () => { for (const t of texts()) t.redraw(); };
const dirtyProgs = () => { for (const p of progs()) p.redraw(); };

const txtVal = first(texts, t => t.text, (t, v) => t.text = v, dirtyTexts);
const txtSize = multi(texts, t => t.fontSize, (t, v) => t.fontSize = v, dirtyTexts);
const txtColor = first(texts, t => toHex(t.color), (t, v) => { const c = fromHex(v); if (c != null) t.color = c; }, dirtyTexts);
const txtAlign = first(texts, t => t.align, (t, v) => t.align = v, dirtyTexts);

const pgVal = multi(progs, p => p.value, (p, v) => p.value = v, dirtyProgs);


// —— 顶点
const vx = multi(verts, v => v.x, (v, val) => v.x = val, dirtyCur);
const vy = multi(verts, v => v.y, (v, val) => v.y = val, dirtyCur);
const vr = multi(verts, v => v.r, (v, val) => v.r = val, dirtyCur);

const btnComp = computed(() => { editor.rev; return !!nodes()[0]?.getComp(CompButton); });
const hasComp = Cls => { editor.rev; return !!nodes()[0]?.getComp(Cls); };

const openN = ref(["t", "s", "text", "prog", "btn"]);
const openV = ref(["v"]);
</script>

<template>
  <!-- root:适配/相机容器,无可编辑属性 -->
  <div v-if="isRoot"></div>

  <!-- node 模式 -->
  <div v-else-if="nodeMode && nodesLen">
    <Collapse v-model="openN" simple>
      <Panel name="t">基础
        <template #content>
          <div class="row"><label>变量名</label><Input v-model="varName" placeholder="运行时变量名" /></div>
          <div class="row">
            <label>位置</label>
            <Select v-model="posType" size="small" class="ty"><Option value="abs">绝对</Option><Option value="percent">百分比</Option></Select>
            <InputNumber v-model="px" size="small" placeholder="—" :step="1" :precision="0" />
            <InputNumber v-model="py" size="small" placeholder="—" :step="1" :precision="0" />
            <Button size="small" icon="md-refresh" title="重置" @click="resetTransform('pos')" />
            <RecordBtn :node="mainNode" :rb="RB.pos" />
          </div>
          <div class="row">
            <label>大小</label>
            <Select v-model="sizeType" size="small" class="ty"><Option value="fixed">固定</Option><Option value="percent">百分比</Option></Select>
            <InputNumber v-model="sw" size="small" placeholder="—" :step="1" :precision="0" />
            <InputNumber v-model="sh" size="small" placeholder="—" :step="1" :precision="0" />
            <Button size="small" icon="md-refresh" title="按内容包围框重置" @click="fitSize()" />
          </div>
          <div class="row">
            <label>锚点</label><span class="ty" />
            <InputNumber v-model="pivotX" size="small" placeholder="—" /><InputNumber v-model="pivotY" size="small" placeholder="—" />
            <Button size="small" icon="md-refresh" title="重置" @click="resetTransform('pivot')" />
          </div>
          <div class="row">
            <label>缩放</label><span class="ty" />
            <InputNumber v-model="scaleX" size="small" :step="0.1" :precision="2" placeholder="—" /><InputNumber v-model="scaleY" size="small" :step="0.1" :precision="2" placeholder="—" />
            <Button size="small" icon="md-refresh" title="重置" @click="resetTransform('scale')" />
            <RecordBtn :node="mainNode" :rb="RB.scale" />
          </div>
          <div class="row">
            <label>旋转</label><span class="ty" />
            <InputNumber v-model="rotDeg" size="small" placeholder="—" /><span class="fill" />
            <Button size="small" icon="md-refresh" title="重置" @click="resetTransform('rot')" />
            <RecordBtn :node="mainNode" :rb="RB.rot" />
          </div>
          <div class="row">
            <label>透明</label><span class="ty" />
            <Slider v-model="alpha" :min="0" :max="1" :step="0.05" />
            <RecordBtn :node="mainNode" :rb="RB.alpha" />
          </div>
        </template>
      </Panel>

      <Panel v-if="shapesLen" name="s">样式
        <template #content>
          <div class="row"><label>填充</label><i-switch v-model="fillOn" /><ColorPicker v-if="fillOn" v-model="fillCol" /></div>
          <template v-if="fillOn">
            <div class="row"><label>样式</label>
              <Select v-model="fillStyle" size="small">
                <Option value="hachure">hachure</Option><Option value="solid">solid</Option>
                <Option value="zigzag">zigzag</Option><Option value="cross-hatch">cross-hatch</Option><Option value="dots">dots</Option>
              </Select>
            </div>
            <div class="row"><label>填充</label><Slider v-model="fillWeight" :min="0.5" :max="6" :step="0.5" /></div>
            <div class="row"><label>线距</label><Slider v-model="hachureGap" :min="2" :max="20" :step="1" /></div>
          </template>
          <Divider style="margin:6px 0" />
          <div class="row"><label>描边</label><i-switch v-model="strokeOn" /><ColorPicker v-if="strokeOn" v-model="strokeCol" /></div>
          <template v-if="strokeOn">
            <div class="row"><label>线宽</label><InputNumber v-model="width" size="small" :min="0" :step="0.5" placeholder="—" />
              <Select v-model="dash" size="small">
                <Option value="solid">实线</Option><Option value="dashed">虚线</Option><Option value="dotted">点线</Option>
              </Select>
            </div>
          </template>
          <Divider style="margin:6px 0" />
          <div class="row"><label>闭合</label><i-switch v-model="closed" /><label class="l2">种子</label><InputNumber v-model="seed" size="small" :min="0" placeholder="—" /><Button size="small" icon="md-shuffle" @click="randomSeed()" /></div>
          <div class="row"><label>粗糙</label><Slider v-model="roughness" :min="0" :max="5" :step="0.1" /></div>
          <div class="row"><label>弯曲</label><Slider v-model="bowing" :min="0" :max="5" :step="0.1" /></div>
          <div class="row"><Button size="small" long @click="removeComps(CompShape)">删除组件</Button></div>
        </template>
      </Panel>

      <Panel v-if="textsLen" name="text">文本
        <template #content>
          <div class="row"><label>内容</label><Input v-model="txtVal" size="small" /></div>
          <div class="row"><label>字号</label><InputNumber v-model="txtSize" size="small" :min="1" :precision="0" placeholder="—" /><label class="l2">对齐</label>
            <Select v-model="txtAlign" size="small"><Option value="left">左</Option><Option value="center">中</Option><Option value="right">右</Option></Select>
          </div>
          <div class="row"><label>颜色</label><ColorPicker v-model="txtColor" /></div>
          <div class="row"><Button size="small" long @click="removeComps(CompText)">删除组件</Button></div>
        </template>
      </Panel>

      <Panel v-if="progsLen" name="prog">进度条
        <template #content>
          <div class="row"><label>进度</label><Slider v-model="pgVal" :min="0" :max="1" :step="0.01" /></div>
          <div class="row"><Button size="small" long @click="removeComps(CompProgress)">删除组件</Button></div>
        </template>
      </Panel>

      <Panel v-if="btnComp" name="btn">按钮
        <template #content>
          <div class="row"><label>事件</label><span class="ro">onClick</span></div>
          <div class="row"><Button size="small" long @click="removeComps(CompButton)">删除组件</Button></div>
        </template>
      </Panel>

    </Collapse>
    <Dropdown class="addcomp" trigger="click" @on-click="addCompByKey">
      <Button size="small" long>添加组件 ▾</Button>
      <template #list>
        <DropdownMenu>
          <DropdownItem v-for="c in ADD_COMPS" :key="c.key" :name="c.key" :disabled="hasComp(c.cls)">{{ c.name }}</DropdownItem>
        </DropdownMenu>
      </template>
    </Dropdown>
  </div>

  <!-- shape 模式:顶点 -->
  <div v-else-if="!nodeMode && vertsLen">
    <Collapse v-model="openV" simple>
      <Panel name="v">顶点({{ vertsLen }})
        <template #content>
          <div class="row"><label>位置</label><InputNumber v-model="vx" size="small" placeholder="—" /><InputNumber v-model="vy" size="small" placeholder="—" /></div>
          <div class="row"><label>尖角</label><InputNumber v-model="vr" size="small" :min="0" :max="1" :step="0.05" placeholder="—" /></div>
        </template>
      </Panel>
    </Collapse>
  </div>

  <div v-else class="empty">{{ nodeMode ? '未选中对象' : '未选中顶点' }}</div>
</template>

<style scoped>
.row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.row > label { width: 36px; color: #515a6e; font-size: 12px; flex: none; }
.row > label.l2 { width: auto; margin-left: 4px; }
.row .ivu-input-number { flex: 1; min-width: 0; }
.row .ivu-select { flex: 1; min-width: 0; }
.row .ty { width: 72px; flex: none; }
.row .fill { flex: 1; }
.row .ivu-slider { flex: 1; }
.row :deep(.ivu-input-number-handler-wrap) { display: none; }
.row :deep(.ivu-input-number-input) { padding: 0 7px; }
.addcomp { display: block; margin-top: 10px; }
.ro { color: #808695; }
.empty { color: #808695; padding: 24px 8px; text-align: center; }
</style>
