<script setup>
import { computed } from "vue";
import { editor, setPlaying, rootAnim, playClip, addClip, removeClip, setClipLoop } from "../editor.js";

const clips = computed(() => { editor.rev; const a = rootAnim(); return a ? Object.keys(a.clips) : []; });
const currentName = computed(() => { editor.rev; return rootAnim()?.currentName; });
const tracks = computed(() => { editor.rev; return rootAnim()?.current?.tracks || []; });
const loop = computed({
  get: () => { editor.rev; return rootAnim()?.current?.loop ?? true; },
  set: v => setClipLoop(v),
});
const pct = t => editor.duration ? (t / editor.duration * 100) : 0;
function seek(v) { editor.pixi?.seek(v); }
</script>

<template>
  <div class="timeline">
    <div class="clips">
      <span class="lbl">片段</span>
      <ButtonGroup size="small">
        <Button v-for="name in clips" :key="name" :type="name === currentName ? 'primary' : 'default'" @click="playClip(name)">{{ name }}</Button>
      </ButtonGroup>
      <Button size="small" icon="md-add" title="新建片段" @click="addClip()" />
      <Button v-if="currentName" size="small" icon="md-trash" title="删除当前片段" @click="removeClip(currentName)" />
      <span class="gap" />
      <span class="lbl">循环</span><i-switch v-model="loop" size="small" />
    </div>

    <div class="head">
      <Button size="small" :type="editor.playing ? 'warning' : 'success'" @click="setPlaying(!editor.playing)">
        {{ editor.playing ? '暂停' : '播放' }}
      </Button>
      <Slider class="seek" :value="editor.time" :max="editor.duration" :step="0.01" :tip-format="v => v.toFixed(2) + 's'" @on-input="seek" />
      <span class="clock">{{ editor.time.toFixed(2) }} / {{ editor.duration.toFixed(2) }}s</span>
    </div>

    <div class="tracks">
      <div v-for="(tr, i) in tracks" :key="i" class="track">
        <span class="name">{{ tr.target }}</span>
        <div class="lane">
          <span class="playhead" :style="{ left: pct(editor.time) + '%' }"></span>
          <span v-for="(k, j) in tr.keys" :key="j" class="key" :style="{ left: pct(k.t) + '%' }" :title="k.t + 's'"></span>
        </div>
      </div>
      <div v-if="!tracks.length" class="empty">空片段(后续可在此录制关键帧)</div>
    </div>
  </div>
</template>

<style scoped>
.timeline { font-size: 12px; }
.clips { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.clips .gap { flex: 1; }
.lbl { color: #808695; }
.head { display: flex; align-items: center; gap: 12px; }
.seek { flex: 1; }
.clock { color: #515a6e; white-space: nowrap; }
.tracks { margin-top: 6px; max-height: 90px; overflow: auto; }
.track { display: flex; align-items: center; height: 22px; }
.track .name { width: 160px; color: #808695; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: none; }
.lane { position: relative; flex: 1; height: 12px; background: #f3f3f4; border-radius: 6px; }
.key { position: absolute; top: 1px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: #2d8cf0; }
.playhead { position: absolute; top: -3px; width: 2px; height: 18px; background: #ed4014; }
.empty { color: #c5c8ce; padding: 6px; }
</style>
