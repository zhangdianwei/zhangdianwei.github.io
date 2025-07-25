<template>
    <div class="loader-container" v-if="isLoading">
        <div class="loader-content">
            <div class="current-file" v-if="currentFileName">
                {{ currentFileName }}
            </div>
            <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
            <div class="progress-text">{{ loadedCount }}/{{ totalCount }}</div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import * as PIXI from 'pixi.js';

const props = defineProps({
    textureUrls: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['loaded', 'progress']);

const isLoading = ref(true);
const progress = ref(0);
const loadedCount = ref(0);
const totalCount = ref(0);
const currentFileName = ref('');
const textures = ref({});

const loadTextures = async () => {
    if (!props.textureUrls || props.textureUrls.length === 0) {
        isLoading.value = false;
        emit('loaded', {});
        return;
    }

    totalCount.value = props.textureUrls.length;
    loadedCount.value = 0;
    progress.value = 0;
    currentFileName.value = '';

    // 串行加载纹理
    for (let i = 0; i < props.textureUrls.length; i++) {
        const url = props.textureUrls[i];
        const fileName = url.split('/').pop();
        currentFileName.value = fileName;

        try {
            const texture = await new Promise((resolve, reject) => {
                const pixiTexture = PIXI.Texture.from(url);

                // 如果已经加载好，直接resolve
                if (pixiTexture.baseTexture.valid) {
                    resolve(pixiTexture);
                    return;
                }

                pixiTexture.baseTexture.on('loaded', () => {
                    resolve(pixiTexture);
                });

                pixiTexture.baseTexture.on('error', (error) => {
                    console.error(`纹理加载失败: ${url}`, error);
                    reject(error); // 改为reject，让错误传播
                });
            });

            textures.value[url] = texture;
            loadedCount.value++;
            progress.value = Math.round((loadedCount.value / totalCount.value) * 100);

            // 发送进度事件
            emit('progress', {
                loaded: loadedCount.value,
                total: totalCount.value,
                progress: progress.value,
                currentUrl: url,
                currentFileName: fileName
            });

        } catch (error) {
            console.error(`纹理加载失败: ${url}`, error);
            currentFileName.value = `加载失败: ${fileName}`;
            // 不继续加载，卡在这里
            return;
        }
    }

    // 加载完成
    currentFileName.value = '加载完成';
    isLoading.value = false;
    emit('loaded', textures.value);
};

// 监听textureUrls变化
watch(() => props.textureUrls, (newUrls) => {
    if (newUrls && newUrls.length > 0) {
        isLoading.value = true;
        textures.value = {};
        loadTextures();
    }
}, { immediate: true });

// 暴露方法给父组件
defineExpose({
    textures,
    isLoading,
    progress,
    currentFileName,
    reload: loadTextures
});
</script>

<style scoped>
.loader-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.loader-content {
    text-align: center;
    color: white;
    font-family: Arial, sans-serif;
}

.current-file {
    font-size: 28px;
    margin-bottom: 30px;
    color: #4CAF50;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.progress-bar {
    width: 300px;
    height: 20px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    overflow: hidden;
    margin: 0 auto 10px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #45a049);
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 16px;
    opacity: 0.8;
}
</style>
