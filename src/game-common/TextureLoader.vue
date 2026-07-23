<template>
    <div class="texture-loader" v-if="isLoading">
        <div v-if="!failed">
            <Progress :percent="progress" />
            <div class="current-file">{{ loadedCount }}/{{ totalCount }}</div>
        </div>
        <div v-else>
            <div class="error-text">加载失败：{{ failedUrl }}</div>
            <Button type="primary" @click="load">重试</Button>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import * as PIXI from 'pixi.js';
import { Progress, Button } from 'view-ui-plus';

const props = defineProps({
    textureUrls: { type: Array, required: true },
    timeout: { type: Number, default: 15000 },
});
const emit = defineEmits(['loaded', 'progress']);

const isLoading = ref(true);
const failed = ref(false);
const failedUrl = ref('');
const loadedCount = ref(0);
const totalCount = ref(0);
const progress = ref(0);

async function loadOne(url) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), props.timeout));
    const texture = await Promise.race([PIXI.Assets.load(url), timeout]);
    loadedCount.value++;
    progress.value = Math.round((loadedCount.value / totalCount.value) * 100);
    emit('progress', { loaded: loadedCount.value, total: totalCount.value, progress: progress.value });
    return texture;
}

async function load() {
    failed.value = false;
    isLoading.value = true;
    loadedCount.value = 0;
    progress.value = 0;
    totalCount.value = props.textureUrls.length;

    if (totalCount.value === 0) {
        isLoading.value = false;
        emit('loaded', {});
        return;
    }

    try {
        const textures = {};
        await Promise.all(props.textureUrls.map(async (url) => {
            textures[url] = await loadOne(url);
        }));
        isLoading.value = false;
        emit('loaded', textures);
    } catch (e) {
        failed.value = true;
        failedUrl.value = e.message;
    }
}

watch(() => props.textureUrls, load, { immediate: true });
</script>

<style scoped>
.texture-loader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);
}

.current-file,
.error-text {
    color: #fff;
    text-align: center;
    margin-bottom: 10px;
}
</style>
