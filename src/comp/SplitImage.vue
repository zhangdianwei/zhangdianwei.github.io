<template>
    <div class="split-image-container">
        <Card dis-hover class="split-panel">
            <div class="tool-heading">
                <span class="tool-icon"><Icon type="md-grid" size="21" /></span>
                <div>
                    <h2>图集识别</h2>
                    <p>图像工具</p>
                </div>
            </div>
            <div class="actions">
            <Upload :before-upload="beforeUpload" :show-upload-list="false" :disabled="!opencvReady" accept="image/*"
                action="">
                <i-button type="primary" icon="md-image" :disabled="!opencvReady">选择图片</i-button>
            </Upload>
            <Button icon="md-download" @click="onExportFile" :disabled="!opencvReady || !rects.length">
                导出结果
            </Button>
            </div>
            <p class="status">{{ opencvReady ? log || '尚未选择图片' : '正在加载图像识别环境' }}</p>
        </Card>
        <div class="canvas-panel">
            <canvas ref="canvas"></canvas>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Upload as IUpload, Button as IButton } from 'view-ui-plus';
let opencvReady = ref(false);
let imageMat = null;
const log = ref('');
const rects = ref([]);
let canvas = null;

let cv = null;
let JSZip = null;

// 动态加载 OpenCV.js 和 JSZip
async function loadScripts() {
    if (!window.cv) {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/opencv.js';
            script.async = true;
            script.onload = () => resolve();
            document.body.appendChild(script);
        });
    }
    if (!window.JSZip) {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
            script.onload = () => resolve();
            document.body.appendChild(script);
        });
    }
    cv = window.cv;
    JSZip = window.JSZip;
}

function clean() {
    if (imageMat) {
        imageMat.delete();
        imageMat = null;
    }
    rects.value = [];
    log.value = '';
}

function mergeRects(allrects) {
    function rcInSome(rc_index) {
        const rc = allrects[rc_index];
        for (let i = 0; i < allrects.length; ++i) {
            if (rc_index === i) continue;
            const candy = allrects[i];
            if (
                rc.x >= candy.x &&
                rc.y >= candy.y &&
                rc.x + rc.width <= candy.x + candy.width &&
                rc.y + rc.height <= candy.y + candy.height
            ) {
                return true;
            }
        }
        return false;
    }
    const ret = [];
    for (let i = 0; i < allrects.length; ++i) {
        const rc = allrects[i];
        if (rcInSome(i)) continue;
        if (rc.width < 3 && rc.height < 3) continue;
        ret.push(allrects[i]);
    }
    return ret;
}

function doSrcFile(eleSrc) {
    clean();
    // 兼容 naturalWidth/naturalHeight，并加调试日志
    if (canvas && eleSrc) {
        canvas.width = eleSrc.width;
        canvas.height = eleSrc.height;
    } else {
        console.warn('canvas 或 eleSrc 未定义');
    }
    const src = cv.imread(eleSrc);
    imageMat = src.clone();

    const bgra = new cv.MatVector();
    cv.split(src, bgra);
    const alpha = bgra.get(3);
    const thresh = new cv.Mat();
    cv.threshold(alpha, thresh, 10, 255, cv.THRESH_BINARY);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

    const borderColor = new cv.Scalar(255, 0, 0, 255);
    cv.copyMakeBorder(src, src, 1, 1, 1, 1, cv.BORDER_CONSTANT, borderColor);

    let allrects = [];
    for (let i = 0; i < contours.size(); ++i) {
        let rc = cv.boundingRect(contours.get(i));
        allrects.push(rc);
    }
    rects.value = mergeRects(allrects);
    for (let i = 0; i < rects.value.length; ++i) {
        let rc = rects.value[i];
        let start = new cv.Point(rc.x, rc.y);
        let end = new cv.Point(rc.x + rc.width, rc.y + rc.height);
        cv.rectangle(src, start, end, new cv.Scalar(0, 255, 0, 255), 1);
    }
    log.value = `已识别 ${rects.value.length} 张图片`;
    cv.imshow(canvas, src);
    src.delete();
    bgra.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();
}

function onSelectFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function () {
        const img = new window.Image();
        img.src = this.result;
        img.onload = function () {
            doSrcFile(img);
        };
    };
}

// i-upload 的 before-upload 钩子
function beforeUpload(file) {
    onSelectFile(file);
    // 阻止自动上传
    return false;
}

function onExportFile() {
    if (!imageMat || !rects.value.length) return;
    const zip = new JSZip();
    let zipContent = [];
    let finished = 0;
    for (let i = 0; i < rects.value.length; ++i) {
        const rc = rects.value[i];
        const roiRect = { x: rc.x, y: rc.y, width: rc.width, height: rc.height };
        const smallMat = imageMat.roi(roiRect);
        const imageName = `image${i + 1}`;
        const d = document.createElement('canvas');
        d.width = rc.width;
        d.height = rc.height;
        cv.imshow(d, smallMat);
        d.toBlob(function (blob) {
            zip.file(imageName + '.png', blob);
            zipContent.push(imageName);
            finished++;
            if (finished === rects.value.length) {
                zip.generateAsync({ type: 'blob' }).then(function (content) {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(content);
                    a.download = 'images.zip';
                    a.click();
                });
            }
        });
        smallMat.delete();
    }
}


onMounted(async () => {
    await loadScripts();

    // 获取 canvas 元素
    canvas = document.querySelector('.split-image-container canvas');

    // OpenCV.js 加载完成后
    if (window.cv && window.cv['onRuntimeInitialized']) {
        window.cv['onRuntimeInitialized'] = () => {
            opencvReady.value = true;
            log.value = '';
        };
    } else {
        // 有些CDN版本不需要 onRuntimeInitialized
        opencvReady.value = true;
    }
    // 默认 canvas 尺寸（可选）
    if (canvas) {
        canvas.width = 512;
        canvas.height = 512;
    }
});
</script>

<style scoped>
.split-image-container {
    width: min(960px, 100%);
    margin: 0 auto;
    display: grid;
    gap: 16px;
}

.split-panel {
    border-color: var(--border-color);
}

.tool-heading {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.tool-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex: none;
    border-radius: var(--radius);
    background: var(--surface-muted);
    color: var(--accent-color);
}

.tool-heading h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.tool-heading p,
.status {
    margin: 3px 0 0;
    color: var(--text-muted);
    font-size: 13px;
}

.actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status {
    min-height: 20px;
    margin-top: 12px;
}

.canvas-panel {
    min-height: 420px;
    display: grid;
    place-items: center;
    overflow: auto;
    padding: 16px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    background-color: var(--surface-color);
    background-image: linear-gradient(45deg, #edf1ef 25%, transparent 25%), linear-gradient(-45deg, #edf1ef 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #edf1ef 75%), linear-gradient(-45deg, transparent 75%, #edf1ef 75%);
    background-position: 0 0, 0 8px, 8px -8px, -8px 0;
    background-size: 16px 16px;
}

canvas {
    display: block;
    max-width: 100%;
    height: auto;
    box-shadow: var(--shadow);
}

@media (max-width: 640px) {
    .canvas-panel { min-height: 300px; padding: 10px; }
}
</style>
