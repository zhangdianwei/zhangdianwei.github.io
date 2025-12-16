<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { Shader, Geometry, Point, Mesh, Circle, Graphics, Application, Assets, Container } from 'pixi.js';
import { Bezier } from "bezier-js";

const rootRef = ref(null);
let app = null;

let activeControlPoint = -1;
let controlPointsNode = null;

let curveNode = null;
let subNode = null;

const textureList = ref([
    { value: 0, label: "纹理1" },
    { value: 1, label: "纹理2" },
    { value: 2, label: "纹理3" },
]);
const selectedTexture = ref(2);

const categoryList = ref(["以t分割", "以长度分割", "平行曲线方式"])
const selectedCategory = ref("以长度分割");

const showGrid = ref(false);
watch(showGrid, () => {
    drawControlPoints();
})

const segCountRef = ref(30);
watch(segCountRef, () => {
    drawControlPoints();
})

const vertex = `
attribute vec2 aPosition;
attribute vec3 aColor;
attribute vec2 aUV;

varying vec3 vColor;
varying vec2 vUV;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;

void main() {

    mat3 mvp = projectionMatrix * translationMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);

    vColor = aColor;
    vUV = aUV;
}
`;

const fragment = `
varying vec3 vColor;
varying vec2 vUV;

uniform sampler2D uTexture;

void main() {
    gl_FragColor = texture2D(uTexture, vUV) * vec4(vColor, 1.0);
}
`;

const textures = [
    await Assets.load('./img/rope1.png'),
    await Assets.load('./img/rope2.png'),
    await Assets.load('./img/rope3.png'),
]

function getControlPoints() {
    return controlPointsNode.children.map((node) => {
        return new Point(node.x, node.y);
    });
}

function makeCurveType1(controlPoints) {
    let texture = textures[selectedTexture.value];

    let aPosition = [];
    let aColor = [];
    let aUV = [];

    const b = new Bezier(...controlPoints);
    const luts = b.getLUT(segCountRef.value);
    for (let i = 0; i < luts.length; i++) {
        if (i == luts.length - 1) {
            break;
        }

        const lut1 = luts[i];
        const tagent1 = b.derivative(lut1.t);
        const normal1 = b.normal(lut1.t);
        normal1.x *= 20;
        normal1.y *= 20;

        const lut2 = luts[i + 1];
        const tagent2 = b.derivative(lut2.t);
        const normal2 = b.normal(lut2.t);
        normal2.x *= 20;
        normal2.y *= 20;

        let rect = [
            new Point(lut1.x + normal1.x, lut1.y + normal1.y),
            new Point(lut1.x - normal1.x, lut1.y - normal1.y),
            new Point(lut2.x - normal2.x, lut2.y - normal2.y),
            new Point(lut2.x + normal2.x, lut2.y + normal2.y),
        ];

        aPosition.push(rect[0].x, rect[0].y);
        aPosition.push(rect[1].x, rect[1].y);
        aPosition.push(rect[2].x, rect[2].y);

        aPosition.push(rect[0].x, rect[0].y);
        aPosition.push(rect[2].x, rect[2].y);
        aPosition.push(rect[3].x, rect[3].y);

        aColor.push(1, 1, 1);
        aColor.push(1, 1, 1);
        aColor.push(1, 1, 1);

        aColor.push(1, 1, 1);
        aColor.push(1, 1, 1);
        aColor.push(1, 1, 1);

        aUV.push(0, 0);
        aUV.push(1, 0);
        aUV.push(1, 1);

        aUV.push(0, 0);
        aUV.push(1, 1);
        aUV.push(0, 1);
    }

    return createMesh(aPosition, aColor, aUV);
}

function makeCurveType2(controlPoints) {
    let texture = textures[selectedTexture.value];

    let aPosition = [];
    let aColor = [];
    let aUV = [];

    const b = new Bezier(...controlPoints);
    const totalLength = b.length();
    const segCount = segCountRef.value;//Math.floor(totalLength / 20);
    let luts = b.getLUT(300);
    let perSegLength = totalLength / segCount;
    let historyLength = 0;
    let historyIndex = 0;
    for (let i = 1; i <= segCount; i++) {
        let targetLength = perSegLength * i;

        for (let j = historyIndex + 1; j < luts.length; j++) {
            let lastPoint = luts[j - 1];
            let curPoint = luts[j];
            const dx = curPoint.x - lastPoint.x;
            const dy = curPoint.y - lastPoint.y;
            historyLength += Math.sqrt(dx * dx + dy * dy);
            // historyLength += b.split(lastPoint.t, curPoint.t).length();

            if (historyLength >= targetLength || j == luts.length - 1) {

                // console.log("split", lastPoint, curPoint)

                const lut1 = luts[historyIndex];
                const normal1 = b.normal(lut1.t);
                normal1.x *= 20;
                normal1.y *= 20;

                const lut2 = curPoint;
                const normal2 = b.normal(lut2.t);
                normal2.x *= 20;
                normal2.y *= 20;

                let rect = [
                    new Point(lut1.x + normal1.x, lut1.y + normal1.y),
                    new Point(lut1.x - normal1.x, lut1.y - normal1.y),
                    new Point(lut2.x - normal2.x, lut2.y - normal2.y),
                    new Point(lut2.x + normal2.x, lut2.y + normal2.y),
                ];

                historyIndex = j;

                aPosition.push(rect[0].x, rect[0].y);
                aPosition.push(rect[1].x, rect[1].y);
                aPosition.push(rect[2].x, rect[2].y);

                aPosition.push(rect[0].x, rect[0].y);
                aPosition.push(rect[2].x, rect[2].y);
                aPosition.push(rect[3].x, rect[3].y);

                aColor.push(1, 1, 1);
                aColor.push(1, 1, 1);
                aColor.push(1, 1, 1);

                aColor.push(1, 1, 1);
                aColor.push(1, 1, 1);
                aColor.push(1, 1, 1);

                aUV.push(0, 0);
                aUV.push(1, 0);
                aUV.push(1, 1);

                aUV.push(0, 0);
                aUV.push(1, 1);
                aUV.push(0, 1);

                break;
            }
        }
    }

    return createMesh(aPosition, aColor, aUV);
}

function createMesh(aPosition, aColor, aUV) {
    const texture = textures[selectedTexture.value];
    const uniforms = { uTexture: texture };
    const geometry = new Geometry()
        .addAttribute('aPosition', aPosition, 2)
        .addAttribute('aColor', aColor, 3)
        .addAttribute('aUV', aUV, 2)

    const shader = Shader.from(vertex, fragment, uniforms);
    curveNode = new Mesh(geometry, shader);

    return curveNode;
}

function getLength(curveArray) {
    let totalLength = 0;
    for (let i = 0; i < curveArray.length; i++) {
        const curve = curveArray[i];
        totalLength += curve.length();
    }
    return totalLength;
}
function makeCurveType3(controlPoints) {
    let texture = textures[selectedTexture.value];

    let aPosition = [];
    let aColor = [];
    let aUV = [];

    const b = new Bezier(...controlPoints);
    const b1 = b.offset(20);
    const b2 = b.offset(-20);

    const curves = [b, b1, b2];
    const curveLength = [b.length(), getLength(b1), getLength(b2)];
    const segCount = segCountRef.value; // Math.ceil(curveLength[0] / 30);
    const perSegLength = [curveLength[0] / segCount, curveLength[1] / segCount, curveLength[2] / segCount];
    const luts_cache = new Map();

    function findNearestLUT_oneCurve(curve, targetLength) {
        let luts = luts_cache.get(curve);
        if (!luts) {
            luts = curve.getLUT();
            luts_cache[curve] = luts;
        }

        if (targetLength == 0) {
            return luts[0];
        }

        let length = 0;
        for (let i = 1; i < luts.length; i++) {
            const dx = luts[i].x - luts[i - 1].x;
            const dy = luts[i].y - luts[i - 1].y;
            const diff_length = Math.sqrt(dx * dx + dy * dy);
            length += diff_length;
            if (length >= targetLength || i == luts.length - 1) {
                return luts[i];
            }
        }
    }

    function findNearestLUT(curveId, targetLength) {
        const sub_curves = curves[curveId];
        const sub_lengths = sub_curves.map((c) => c.length());

        let need_sub_curve_id = sub_curves.length - 1;
        for (let i = 0; i < sub_lengths.length - 1; i++) {
            if (targetLength <= sub_lengths[i]) {
                need_sub_curve_id = i;
                break;
            }
            else {
                targetLength -= sub_lengths[i];
            }
        }

        let curve = sub_curves[need_sub_curve_id];
        let lut = findNearestLUT_oneCurve(curve, targetLength);
        return lut;
    }

    let historyLut1 = findNearestLUT(1, 0);
    let historyLut2 = findNearestLUT(2, 0);
    for (let segIndex = 1; segIndex <= segCount; segIndex++) {
        let targetLength1 = segIndex * perSegLength[1];
        let targetLength2 = segIndex * perSegLength[2];

        const lut1 = historyLut1;
        const lut2 = historyLut2;
        const lut3 = findNearestLUT(1, targetLength1);
        const lut4 = findNearestLUT(2, targetLength2);

        let rect = [
            new Point(lut2.x, lut2.y),
            new Point(lut1.x, lut1.y),
            new Point(lut3.x, lut3.y),
            new Point(lut4.x, lut4.y),
        ];

        historyLut1 = lut3;
        historyLut2 = lut4;

        aPosition.push(rect[0].x, rect[0].y);
        aPosition.push(rect[1].x, rect[1].y);
        aPosition.push(rect[2].x, rect[2].y);

        aPosition.push(rect[0].x, rect[0].y);
        aPosition.push(rect[2].x, rect[2].y);
        aPosition.push(rect[3].x, rect[3].y);

        aColor.push(1, 1, 1);
        aColor.push(1, 1, 1);
        aColor.push(1, 1, 1);

        aColor.push(1, 1, 1);
        aColor.push(1, 1, 1);
        aColor.push(1, 1, 1);

        aUV.push(0, 0);
        aUV.push(1, 0);
        aUV.push(1, 1);

        aUV.push(0, 0);
        aUV.push(1, 1);
        aUV.push(0, 1);
    }

    return createMesh(aPosition, aColor, aUV);
}


function drawControlPoints() {
    let controlPoints = getControlPoints();

    if (curveNode) {
        app.stage.removeChild(curveNode);
        curveNode = null;
    }
    if (selectedCategory.value == "以t分割") {
        curveNode = makeCurveType1(controlPoints);
    }
    else if (selectedCategory.value == "以长度分割") {
        curveNode = makeCurveType2(controlPoints);
    }
    else if (selectedCategory.value == "平行曲线方式") {
        curveNode = makeCurveType3(controlPoints);
    }
    if (curveNode) {
        curveNode.eventMode = "none";
        app.stage.addChild(curveNode);
    }

    if (subNode) {
        app.stage.removeChild(subNode);
        subNode = null;
    }
    subNode = new Container();
    app.stage.addChild(subNode);

    if (subNode && showGrid.value) {

        const triangle = new Graphics();
        // const points = curveNode.geometry.attributes.aPosition.buffer.data;
        const points = curveNode.geometry.buffers[0].data;
        for (let i = 0; i < points.length / 12; i++) {
            const index = i * 12;

            const rect = [
                new Point(points[index + 0], points[index + 1]),
                new Point(points[index + 2], points[index + 3]),
                new Point(points[index + 4], points[index + 5]),
                new Point(points[index + 10], points[index + 11]),
            ]
            triangle.lineStyle(1, 0xaa0000);
            triangle.moveTo(rect[0].x, rect[0].y);
            triangle.lineTo(rect[1].x, rect[1].y);
            triangle.lineTo(rect[2].x, rect[2].y);
            triangle.lineTo(rect[3].x, rect[3].y);
            triangle.lineTo(rect[0].x, rect[0].y);

        }
        subNode.addChild(triangle);


        // const b0 = new Bezier(...controlPoints);
        // const b1 = b0.offset(-20);
        // const b2 = b0.offset(20);
        // let node = new Graphics();
        // node.moveTo(controlPoints[0].x, controlPoints[0].y);
        // node.bezierCurveTo(controlPoints[1].x, controlPoints[1].y, controlPoints[2].x, controlPoints[2].y, controlPoints[3].x, controlPoints[3].y);
        // node.stroke({ width: 5, color: 0xaa0000, alpha: 0.1 });
        // subNode.addChild(node);
        // for (let i = 0; i < b1.length; i++) {
        //     const curve = b1[i];
        //     node = new Graphics();
        //     let points = curve.points;
        //     node.moveTo(points[0].x, points[0].y);
        //     node.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
        //     node.stroke({ width: 5, color: 0xaa0000, alpha: 0.1 });
        //     subNode.addChild(node);
        // }
        // for (let i = 0; i < b1.length; i++) {
        //     const curve = b2[i];
        //     node = new Graphics();
        //     let points = curve.points;
        //     node.moveTo(points[0].x, points[0].y);
        //     node.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
        //     node.stroke({ width: 5, color: 0xaa0000, alpha: 0.1 });
        //     subNode.addChild(node);
        // }
    }



    for (let i = 0; i < controlPoints.length; i++) {
        let node = controlPointsNode.children[i];
        node.clear();

        node.beginFill(0x00adb5, 1);
        node.drawCircle(0, 0, node.hitArea.radius);
        node.endFill();

        if (i === activeControlPoint) {
            node.lineStyle(3, 0x393e46, 1);
            node.drawCircle(0, 0, node.hitArea.radius);
        }
    }
}

function onPointerDown(e) {
    const position = e.data.global;
    for (let i = 0; i < controlPointsNode.children.length; i++) {
        const node = controlPointsNode.children[i];
        let local = node.toLocal(position);
        if (local.x * local.x + local.y * local.y < node.hitArea.radius * node.hitArea.radius) {
            activeControlPoint = i
            break;
        }
    }
    drawControlPoints();
}
function onPointerUp(e) {
    activeControlPoint = -1;
    drawControlPoints();
}
function onPointerMove(e) {
    if (activeControlPoint >= 0) {
        const { x, y } = e.data.global;
        let local = controlPointsNode.toLocal({ x, y });
        controlPointsNode.children[activeControlPoint].position.set(local.x, local.y);
        drawControlPoints();
    }
}

watch(selectedCategory, () => {
    drawControlPoints();
})
watch(selectedTexture, () => {
    drawControlPoints();
})

onMounted(async () => {
    app = new Application({ background: '#eeeeee', resizeTo: rootRef.value });
    rootRef.value.appendChild(app.view);

    const center = { x: app.screen.width / 2, y: app.screen.height / 2 };

    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.on('pointerupoutside', onPointerUp);
    app.stage.on('pointerdown', onPointerDown);
    app.stage.on('pointerup', onPointerUp);
    app.stage.on('pointermove', onPointerMove);

    // 初始化控制点
    {
        controlPointsNode = new Container();
        app.stage.addChild(controlPointsNode);
        for (let i = 0; i < 4; i++) {
            let node = new Graphics();
            controlPointsNode.addChild(node);
            node.hitArea = new Circle(0, 0, 30);
        }
        let curveNodes = controlPointsNode.children.slice(controlPointsNode.children.length - 4);
        curveNodes[0].position.set(center.x, center.y + 300);
        curveNodes[1].position.set(center.x - 300, center.y - 100);
        curveNodes[2].position.set(center.x + 300, center.y + 100);
        curveNodes[3].position.set(center.x, center.y - 300);

        drawControlPoints();
    }

    {
        document.addEventListener('keydown', (event) => {
            if (event.key >= 1 && event.key <= 9) {
                if (textures[event.key - 1]) {
                    selectedTexture.value = event.key - 1;
                    drawControlPoints();

                }
            }

        });
    }

    // app.ticker.add(() => {
    //     drawControlPoints();
    // });
});
</script>
<template>

    <Row>

        <Col :span="4">

        <List style="padding-left: 20px;">
            <ListItem>
                <p style="width: 100px;">算法：</p>
                <Select v-model="selectedCategory">
                    <Option v-for="item in categoryList" :value="item" :key="item">{{ item }}</Option>
                </Select>
            </ListItem>

            <ListItem>
                <p style="width: 100px;">纹理类型：</p>
                <Select v-model="selectedTexture">
                    <Option v-for="item in textureList" :value="item.value" :key="item.value">{{ item.label }}</Option>
                </Select>
            </ListItem>

            <ListItem>
                <Checkbox v-model="showGrid">显示网格</Checkbox>
            </ListItem>

            <ListItem>
                分段数：
                <InputNumber v-model="segCountRef" :min="1" :max="100" :step="10" controls-outside />
            </ListItem>
        </List>

        </Col>
        <Col :span="20">
        <div ref="rootRef" style="width: 100%; height: 98vh;"></div>
        </Col>
    </Row>

</template>