<template>
    <div class="split-image-container">
        <h1>智能图片拆分</h1>
        <p>将丢失plist的png大图智能拆分成png小图</p>
        <div style="margin-bottom: 16px;">
            <input type="file" accept="image/*" @change="onSelectFile" :disabled="!opencvReady" />
            <button @click="onExportFile" :disabled="!opencvReady">导出小图</button>
        </div>
        <p>{{ log }}</p>
        <div>
            <p v-if="!opencvReady">正在加载环境...(大约20秒钟)</p>
            <canvas ref="canvas" id="mycanvas"></canvas>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
let opencvReady = ref(false);
let imageMat = null;
let log = '';
let rects = [];
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
    rects = [];
    log = '';
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
    rects = mergeRects(allrects);
    for (let i = 0; i < rects.length; ++i) {
        let rc = rects[i];
        let start = new cv.Point(rc.x, rc.y);
        let end = new cv.Point(rc.x + rc.width, rc.y + rc.height);
        cv.rectangle(src, start, end, new cv.Scalar(0, 255, 0, 255), 1);
    }
    log = `共${rects.length}张小图`;
    cv.imshow(canvas, src);
    src.delete();
    bgra.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();
}

function onSelectFile(e) {
    const file = e.target.files[0];
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

function onExportFile() {
    if (!imageMat || !rects.length) return;
    const zip = new JSZip();
    let zipContent = [];
    let finished = 0;
    for (let i = 0; i < rects.length; ++i) {
        const rc = rects[i];
        const roiRect = {x: rc.x, y: rc.y, width: rc.width, height: rc.height};
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
            if (finished === rects.length) {
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

    // OpenCV.js 加载完成后
    if (window.cv && window.cv['onRuntimeInitialized']) {
        window.cv['onRuntimeInitialized'] = () => {
            opencvReady.value = true;
            log = '';
        };
    } else {
        // 有些CDN版本不需要 onRuntimeInitialized
        opencvReady.value = true;
    }
    // 设置canvas尺寸
    if (canvas) {
        canvas.width = 512;
        canvas.height = 512;
    }
});
</script>

<style scoped>
.split-image-container {
    width: 420px;
    margin: 0 auto;
    text-align: center;
}

canvas {
    border: 1px solid #aaa;
    margin-top: 8px;
}
</style>
