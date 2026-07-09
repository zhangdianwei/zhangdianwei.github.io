<script setup>
import { computed } from "vue";
import { editor, alignNodes, alignVerts, distributeNodes, distributeVerts, arrangeNodes, arrangeVerts, selectedNodesList, selectedVertsList } from "../editor.js";

const isVert = computed(() => { editor.rev; return editor.mode === "shape"; });
const cnt = computed(() => { editor.rev; return isVert.value ? selectedVertsList().length : selectedNodesList().length; });

function align(type) { (isVert.value ? alignVerts : alignNodes)(type); }
function distribute(axis) { (isVert.value ? distributeVerts : distributeNodes)(axis); }
function arrange(kind) { (isVert.value ? arrangeVerts : arrangeNodes)(kind); }
</script>

<template>
  <div class="fbar">
    <div class="sec">
      <span class="t">对齐</span>
      <ButtonGroup>
        <Button :disabled="cnt < 2" @click="align('left')">左</Button>
        <Button :disabled="cnt < 2" @click="align('right')">右</Button>
        <Button :disabled="cnt < 2" @click="align('top')">上</Button>
        <Button :disabled="cnt < 2" @click="align('bottom')">下</Button>
      </ButtonGroup>
    </div>

    <div class="sec">
      <span class="t">均分</span>
      <ButtonGroup>
        <Button :disabled="cnt < 3" @click="distribute('x')">横向</Button>
        <Button :disabled="cnt < 3" @click="distribute('y')">纵向</Button>
      </ButtonGroup>
    </div>

    <div class="sec">
      <span class="t">排列</span>
      <ButtonGroup>
        <Button :disabled="cnt < 3" @click="arrange('circle')">圆形</Button>
        <Button :disabled="cnt < 3" @click="arrange('rect')">矩形</Button>
        <Button :disabled="cnt < 3" @click="arrange('polygon')">多边形</Button>
      </ButtonGroup>
    </div>
  </div>
</template>

<style scoped>
.fbar { display: flex; flex-direction: column; gap: 14px; }
.sec { display: flex; align-items: center; gap: 12px; }
.t { width: 40px; color: #808695; font-size: 13px; flex: none; }
</style>
