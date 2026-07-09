<script setup>
import { computed } from "vue";
import { editor } from "../editor.js";
import SceneItem from "./SceneItem.vue";

const root = computed(() => { editor.rev; return editor.root; });
</script>

<template>
  <div class="scene-tree">
    <SceneItem v-if="root" :node="root" />
  </div>
</template>

<style scoped>
.scene-tree { font-size: 13px; }
</style>
