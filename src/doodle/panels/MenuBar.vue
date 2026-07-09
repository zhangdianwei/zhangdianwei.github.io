<script setup>
import { ref, computed } from "vue";
import { editor, exportJSON, selectedNodesList, selectedVertsList, setDesignSize, setDevice } from "../editor.js";
import { adapt, DEVICES } from "../adapt.js";
import FunctionBar from "./FunctionBar.vue";

const file = ref(null);
const cnt = computed(() => { editor.rev; return editor.mode === "shape" ? selectedVertsList().length : selectedNodesList().length; });

const dw = computed({ get: () => adapt.design.w, set: v => setDesignSize(v, 0) });
const dh = computed({ get: () => adapt.design.h, set: v => setDesignSize(0, v) });
const dev = computed({ get: () => adapt.deviceIndex, set: setDevice });

function onFile(name) {
  if (name === "export") exportJSON();
  else file.value.click();
}
function importJSON(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => editor.pixi.loadScene(JSON.parse(r.result));
  r.readAsText(f); e.target.value = "";
}
</script>

<template>
  <div class="menubar">
    <Dropdown trigger="click" @on-click="onFile">
      <Button size="small">文件 ▾</Button>
      <template #list>
        <DropdownMenu>
          <DropdownItem name="export">导出 JSON</DropdownItem>
          <DropdownItem name="import">导入 JSON</DropdownItem>
        </DropdownMenu>
      </template>
    </Dropdown>
    <input ref="file" type="file" accept=".json" style="display:none" @change="importJSON" />

    <span class="sep" />
    <span class="lbl">设计</span>
    <InputNumber v-model="dw" :min="1" size="small" class="wh" />
    <span class="x">×</span>
    <InputNumber v-model="dh" :min="1" size="small" class="wh" />
    <span class="lbl">设备</span>
    <Select v-model="dev" size="small" style="width:180px">
      <Option v-for="(d, i) in DEVICES" :key="i" :value="i">{{ d.name }} · {{ d.w }}×{{ d.h }}</Option>
    </Select>

    <span class="spring" />

    <Poptip trigger="click" placement="bottom-end" padding="16px" width="380" :disabled="cnt < 2">
      <Button size="small" :disabled="cnt < 2">排列 ▾</Button>
      <template #content><FunctionBar /></template>
    </Poptip>
  </div>
</template>

<style scoped>
.menubar { display: flex; align-items: center; gap: 8px; }
.menubar .sep { width: 1px; height: 18px; background: #e8eaec; margin: 0 4px; }
.menubar .spring { flex: 1; }
.menubar .lbl { color: #808695; font-size: 12px; }
.menubar .x { color: #c5c8ce; }
.menubar .wh { width: 64px; }
.menubar :deep(.ivu-input-number-handler-wrap) { display: none; }
.menubar :deep(.ivu-input-number-input) { padding: 0 7px; }
</style>
