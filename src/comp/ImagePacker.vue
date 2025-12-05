<template>
    <div class="image-packer-container">
        <Row :gutter="16" style="height: 100vh;">
            <!-- 左侧：图片区 -->
            <Col :span="18" class="image-area">
            <div class="upload-zone" :class="{ 'has-image': imageUrl }" @drop.prevent="handleDrop" @dragover.prevent
                @dragenter.prevent>
                <Upload v-if="!imageUrl" :before-upload="handleUpload" :show-upload-list="false" accept="image/*"
                    action="">
                    <Button type="primary" size="large">点击上传或拖拽图片</Button>
                </Upload>
                <div v-else class="image-wrapper">
                    <canvas ref="canvasRef" @click="handleCanvasClick" @mousemove="handleCanvasMouseMove"
                        @mouseleave="handleCanvasMouseLeave"></canvas>
                    <Button type="error" size="small" style="position: absolute; top: 10px; right: 10px;"
                        @click="clearImage">
                        清除图片
                    </Button>
                </div>
            </div>
            </Col>

            <!-- 右侧：主功能区 -->
            <Col :span="6" class="control-panel">
            <!-- 信息展示区 -->
            <Card :bordered="false" style="margin-bottom: 16px;">
                <div class="info-section">
                    <div class="info-row">
                        <span class="label">图片尺寸：</span>
                        <span>{{ imageWidth }} × {{ imageHeight }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">行数：</span>
                        <InputNumber v-model="rows" :min="1" :max="100" style="width: 80px;" @on-change="updateGrid" />
                        <span class="label" style="margin-left: 16px;">列数：</span>
                        <InputNumber v-model="cols" :min="1" :max="100" style="width: 80px;" @on-change="updateGrid" />
                    </div>
                    <div class="info-row">
                        <span class="label">小图尺寸：</span>
                        <span>{{ cellWidth }} × {{ cellHeight }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">导出格式：</span>
                        <CheckboxGroup v-model="exportFormats">
                            <Checkbox label="plist">plist</Checkbox>
                            <Checkbox label="json">json</Checkbox>
                            <Checkbox label="atlas">atlas</Checkbox>
                        </CheckboxGroup>
                    </div>
                    <div class="info-row" style="margin-top: 16px;">
                        <Button type="primary" @click="showResult"
                            :disabled="selectedCells.length === 0 || exportFormats.length === 0">
                            显示结果
                        </Button>
                        <Button type="success" style="margin-left: 8px;" @click="downloadFiles"
                            :disabled="selectedCells.length === 0 || exportFormats.length === 0">
                            下载
                        </Button>
                    </div>
                </div>
            </Card>

            <!-- 小图展示区 -->
            <Card :bordered="false" title="已选择的小图">
                <div class="cell-list">
                    <div v-for="(cell, index) in selectedCells" :key="cell.id" class="cell-item">
                        <div class="cell-header">
                            <Input v-model="cell.name" placeholder="输入名称" style="flex: 1;"
                                @on-change="updateCellName(cell, $event)" />
                            <Button type="error" size="small" @click="removeCell(index)" style="margin-left: 8px;">
                                删除
                            </Button>
                        </div>
                        <div class="cell-params">
                            <Checkbox v-model="cell.rotated">旋转</Checkbox>
                        </div>
                        <div class="cell-preview">
                            <canvas :ref="el => setCellPreviewRef(el, cell.id)" class="preview-canvas"></canvas>
                        </div>
                    </div>
                    <div v-if="selectedCells.length === 0" class="empty-tip">
                        请在上方图片中选择网格
                    </div>
                </div>
            </Card>
            </Col>
        </Row>

        <!-- 结果显示模态框 -->
        <Modal v-model="showResultModal" title="导出结果" width="800" :mask-closable="false">
            <div class="result-content">
                <Tabs v-model="resultTab">
                    <TabPane v-for="format in exportFormats" :key="format" :label="format.toUpperCase()" :name="format">
                        <pre class="result-code">{{ getResultByFormat(format) }}</pre>
                    </TabPane>
                </Tabs>
            </div>
            <template #footer>
                <Button @click="showResultModal = false">关闭</Button>
            </template>
        </Modal>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import {
    Row,
    Col,
    Card,
    Button,
    Upload,
    InputNumber,
    Input,
    Checkbox,
    CheckboxGroup,
    Modal,
    Tabs,
    TabPane
} from 'view-ui-plus';

// 图片相关
const imageUrl = ref('');
const imageWidth = ref(0);
const imageHeight = ref(0);
const canvasRef = ref(null);
const image = ref(null);

// 网格相关
const rows = ref(1);
const cols = ref(1);
const cellWidth = computed(() => imageWidth.value ? Math.floor(imageWidth.value / cols.value) : 0);
const cellHeight = computed(() => imageHeight.value ? Math.floor(imageHeight.value / rows.value) : 0);

// 选中的网格
const selectedCells = ref([]);
let cellIdCounter = 0;
let lastSelectedIndex = -1;
let isShiftPressed = false;

// 导出格式
const exportFormats = ref(['json']);

// 结果显示
const showResultModal = ref(false);
const resultTab = ref('json');

// 鼠标悬停
const hoveredCell = ref(null);

// 处理上传
function handleUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        imageUrl.value = e.target.result;
        loadImage();
    };
    reader.readAsDataURL(file);
    return false;
}

// 处理拖拽
function handleDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        handleUpload(files[0]);
    }
}

// 加载图片
function loadImage() {
    if (!imageUrl.value) return;

    const img = new Image();
    img.onload = () => {
        image.value = img;
        imageWidth.value = img.width;
        imageHeight.value = img.height;
        nextTick(() => {
            drawImage();
            updateGrid();
        });
    };
    img.src = imageUrl.value;
}

// 清除图片
function clearImage() {
    imageUrl.value = '';
    image.value = null;
    imageWidth.value = 0;
    imageHeight.value = 0;
    selectedCells.value = [];
    rows.value = 1;
    cols.value = 1;
}

// 绘制图片和网格
function drawImage() {
    const canvas = canvasRef.value;
    if (!canvas || !image.value) return;

    const ctx = canvas.getContext('2d');
    canvas.width = image.value.width;
    canvas.height = image.value.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image.value, 0, 0);

    drawGrid(ctx);
    highlightSelectedCells(ctx);
}

// 绘制网格
function drawGrid(ctx) {
    if (!image.value) return;

    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;

    // 绘制垂直线
    for (let i = 0; i <= cols.value; i++) {
        const x = (i * imageWidth.value) / cols.value;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, imageHeight.value);
        ctx.stroke();
    }

    // 绘制水平线
    for (let i = 0; i <= rows.value; i++) {
        const y = (i * imageHeight.value) / rows.value;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(imageWidth.value, y);
        ctx.stroke();
    }
}

// 高亮选中的网格
function highlightSelectedCells(ctx) {
    if (!image.value) return;

    selectedCells.value.forEach(cell => {
        const x = (cell.col * imageWidth.value) / cols.value;
        const y = (cell.row * imageHeight.value) / rows.value;
        const w = cellWidth.value;
        const h = cellHeight.value;

        ctx.fillStyle = 'rgba(24, 144, 255, 0.3)';
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
    });

    // 高亮悬停的网格
    if (hoveredCell.value && !isCellSelected(hoveredCell.value.row, hoveredCell.value.col)) {
        const x = (hoveredCell.value.col * imageWidth.value) / cols.value;
        const y = (hoveredCell.value.row * imageHeight.value) / rows.value;
        const w = cellWidth.value;
        const h = cellHeight.value;

        ctx.fillStyle = 'rgba(24, 144, 255, 0.1)';
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    }
}

// 更新网格
function updateGrid() {
    if (image.value) {
        drawImage();
        updateCellPreviews();
    }
}

// 检查网格是否已选中
function isCellSelected(row, col) {
    return selectedCells.value.some(cell => cell.row === row && cell.col === col);
}

// 获取点击的网格坐标
function getCellAtPosition(x, y) {
    if (!image.value) return null;

    const col = Math.floor((x / imageWidth.value) * cols.value);
    const row = Math.floor((y / imageHeight.value) * rows.value);

    if (col >= 0 && col < cols.value && row >= 0 && row < rows.value) {
        return { row, col };
    }
    return null;
}

// 处理画布点击
function handleCanvasClick(e) {
    if (!image.value) return;

    const canvas = canvasRef.value;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 缩放比例
    const scaleX = imageWidth.value / rect.width;
    const scaleY = imageHeight.value / rect.height;

    const actualX = x * scaleX;
    const actualY = y * scaleY;

    const cell = getCellAtPosition(actualX, actualY);
    if (!cell) return;

    // 检查是否按住Shift键
    isShiftPressed = e.shiftKey;

    if (isShiftPressed && lastSelectedIndex >= 0) {
        // Shift多选：选择从上次选择到当前选择之间的所有网格
        const lastCell = selectedCells.value[lastSelectedIndex];
        const startRow = Math.min(lastCell.row, cell.row);
        const endRow = Math.max(lastCell.row, cell.row);
        const startCol = Math.min(lastCell.col, cell.col);
        const endCol = Math.max(lastCell.col, cell.col);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (!isCellSelected(r, c)) {
                    addCell(r, c);
                }
            }
        }
    } else {
        // 单个选择/取消选择
        const existingIndex = selectedCells.value.findIndex(
            c => c.row === cell.row && c.col === cell.col
        );

        if (existingIndex >= 0) {
            selectedCells.value.splice(existingIndex, 1);
            lastSelectedIndex = -1;
        } else {
            addCell(cell.row, cell.col);
            lastSelectedIndex = selectedCells.value.length - 1;
        }
    }

    drawImage();
    updateCellPreviews();
}

// 添加网格
function addCell(row, col) {
    const cell = {
        id: cellIdCounter++,
        row,
        col,
        name: `cell_${row}_${col}`,
        rotated: false
    };
    selectedCells.value.push(cell);
}

// 移除网格
function removeCell(index) {
    selectedCells.value.splice(index, 1);
    drawImage();
    updateCellPreviews();
}

// 更新网格名称
function updateCellName(cell, event) {
    cell.name = event.target.value;
}

// 处理鼠标移动
function handleCanvasMouseMove(e) {
    if (!image.value) return;

    const canvas = canvasRef.value;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = imageWidth.value / rect.width;
    const scaleY = imageHeight.value / rect.height;

    const actualX = x * scaleX;
    const actualY = y * scaleY;

    const cell = getCellAtPosition(actualX, actualY);
    hoveredCell.value = cell;

    if (cell) {
        canvas.style.cursor = 'pointer';
    } else {
        canvas.style.cursor = 'default';
    }

    drawImage();
}

// 处理鼠标离开
function handleCanvasMouseLeave() {
    hoveredCell.value = null;
    if (image.value) {
        drawImage();
    }
}

// 单元格预览引用
const cellPreviewRefs = ref({});

function setCellPreviewRef(el, id) {
    if (el) {
        cellPreviewRefs.value[id] = el;
    }
}

// 更新单元格预览
function updateCellPreviews() {
    if (!image.value) return;

    nextTick(() => {
        selectedCells.value.forEach(cell => {
            const previewCanvas = cellPreviewRefs.value[cell.id];
            if (!previewCanvas) return;

            const ctx = previewCanvas.getContext('2d');
            const x = (cell.col * imageWidth.value) / cols.value;
            const y = (cell.row * imageHeight.value) / rows.value;
            const w = cellWidth.value;
            const h = cellHeight.value;

            previewCanvas.width = w;
            previewCanvas.height = h;

            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(image.value, x, y, w, h, 0, 0, w, h);
        });
    });
}

// 生成JSON格式
function generateJSON() {
    const frames = {};
    const meta = {
        image: 'texture.png',
        size: { w: imageWidth.value, h: imageHeight.value },
        scale: 1
    };

    selectedCells.value.forEach(cell => {
        const x = (cell.col * imageWidth.value) / cols.value;
        const y = (cell.row * imageHeight.value) / rows.value;
        const w = cellWidth.value;
        const h = cellHeight.value;

        frames[cell.name] = {
            frame: { x, y, w, h },
            rotated: cell.rotated,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w, h },
            sourceSize: { w, h }
        };
    });

    return JSON.stringify({ frames, meta }, null, 2);
}

// 生成Plist格式
function generatePlist() {
    let plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>frames</key>
    <dict>
`;

    selectedCells.value.forEach(cell => {
        const x = (cell.col * imageWidth.value) / cols.value;
        const y = (cell.row * imageHeight.value) / rows.value;
        const w = cellWidth.value;
        const h = cellHeight.value;

        plist += `        <key>${cell.name}</key>
        <dict>
            <key>frame</key>
            <string>{{${x},${y}},{${w},${h}}}</string>
            <key>offset</key>
            <string>{0,0}</string>
            <key>rotated</key>
            <${cell.rotated ? 'true' : 'false'}/>
            <key>sourceColorRect</key>
            <string>{{0,0},{${w},${h}}}</string>
            <key>sourceSize</key>
            <string>{${w},${h}}</string>
        </dict>
`;
    });

    plist += `    </dict>
    <key>metadata</key>
    <dict>
        <key>format</key>
        <integer>2</integer>
        <key>realTextureFileName</key>
        <string>texture.png</string>
        <key>size</key>
        <string>{${imageWidth.value},${imageHeight.value}}</string>
        <key>textureFileName</key>
        <string>texture.png</string>
    </dict>
</dict>
</plist>`;

    return plist;
}

// 生成Atlas格式
function generateAtlas() {
    let atlas = `${imageWidth.value}:${imageHeight.value}
`;

    selectedCells.value.forEach(cell => {
        const x = (cell.col * imageWidth.value) / cols.value;
        const y = (cell.row * imageHeight.value) / rows.value;
        const w = cellWidth.value;
        const h = cellHeight.value;

        atlas += `${cell.name}
  rotate: ${cell.rotated ? 'true' : 'false'}
  xy: ${x}, ${y}
  size: ${w}, ${h}
  orig: ${w}, ${h}
  offset: 0, 0
  index: -1
`;
    });

    return atlas;
}

// 根据格式获取结果
function getResultByFormat(format) {
    switch (format) {
        case 'json':
            return generateJSON();
        case 'plist':
            return generatePlist();
        case 'atlas':
            return generateAtlas();
        default:
            return '';
    }
}

// 显示结果
function showResult() {
    if (exportFormats.value.length > 0) {
        resultTab.value = exportFormats.value[0];
        showResultModal.value = true;
    }
}

// 下载文件
function downloadFiles() {
    exportFormats.value.forEach(format => {
        const content = getResultByFormat(format);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `texture.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// 监听选中单元格变化，更新预览
watch(selectedCells, () => {
    updateCellPreviews();
}, { deep: true });
</script>

<style scoped>
.image-packer-container {
    width: 100%;
    height: 100vh;
    padding: 16px;
    box-sizing: border-box;
    background: #f5f5f5;
}

.image-area {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.upload-zone {
    flex: 1;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    position: relative;
    overflow: auto;
}

.upload-zone.has-image {
    border: none;
    background: #fff;
}

.image-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
}

.image-wrapper canvas {
    max-width: 100%;
    max-height: 100%;
    cursor: pointer;
    border: 1px solid #d9d9d9;
}

.control-panel {
    height: 100%;
    overflow-y: auto;
    padding-right: 8px;
}

.info-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

.info-row .label {
    font-weight: 500;
    margin-right: 8px;
    min-width: 80px;
}

.cell-list {
    max-height: calc(100vh - 400px);
    overflow-y: auto;
}

.cell-item {
    margin-bottom: 16px;
    padding: 12px;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    background: #fafafa;
}

.cell-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.cell-params {
    margin-bottom: 8px;
}

.cell-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    padding: 8px;
}

.preview-canvas {
    max-width: 100%;
    max-height: 120px;
    border: 1px solid #d9d9d9;
}

.empty-tip {
    text-align: center;
    color: #999;
    padding: 40px 0;
}

.result-content {
    max-height: 500px;
    overflow-y: auto;
}

.result-code {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
}
</style>