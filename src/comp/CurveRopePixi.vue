<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { Shader, Geometry, Point, MeshRope, Texture, buildGeometryFromPath, Mesh, GraphicsPath, Circle, Graphics, Application, Assets, Sprite, Container } from 'pixi.js';
import { Bezier } from "bezier-js";

const rootRef = ref(null);
let app = null;

let activeControlPoint = -1;
let controlPointsNode = null;

let curveNode = null;

const vertex = `
in vec2 aPosition;
in vec3 aColor;
in vec2 aUV;

out vec3 vColor;
out vec2 vUV;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;

uniform mat3 uTransformMatrix;


void main() {

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);

    vColor = aColor;
    vUV = aUV;
}
`;

const fragment = `
in vec3 vColor;
in vec2 vUV;

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
let activeTexture = 2;

function getControlPoints() {
    return controlPointsNode.children.map((node) => {
        return new Point(node.x, node.y);
    });
}

function makeCurveType1(controlPoints) {
    let texture = textures[activeTexture];

    let aPosition = [];
    let aColor = [];
    let aUV = [];

    const b = new Bezier(...controlPoints);
    const luts = b.getLUT(50);
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

    const geometry = new Geometry({ attributes: { aPosition, aColor, aUV } });
    const shader = Shader.from({ gl: { vertex, fragment, }, resources: { uTexture: texture.source, }, });
    curveNode = new Mesh({ geometry, shader, });

    return curveNode;
}

function makeCurveType2(controlPoints) {
    let texture = textures[activeTexture];

    let aPosition = [];
    let aColor = [];
    let aUV = [];

    const b = new Bezier(...controlPoints);
    const totalLength = b.length();
    const segCount = Math.floor(totalLength / 20);
    let luts = b.getLUT(500);
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

                console.log("split", lastPoint, curPoint)

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

    // const curves = splitCurveByLength(b, segCount);
    // for (let i = 0; i < curves.length; i++) {
    //     const curve = curves[i];

    //     const lut1 = curve.get(0)
    //     const tagent1 = curve.derivative(0);
    //     const normal1 = curve.normal(0);
    //     normal1.x *= 20;
    //     normal1.y *= 20;

    //     const lut2 = curve.get(1)
    //     const tagent2 = curve.derivative(1);
    //     const normal2 = curve.normal(1);
    //     normal2.x *= 20;
    //     normal2.y *= 20;

    //     let rect = [
    //         new Point(lut1.x + normal1.x, lut1.y + normal1.y),
    //         new Point(lut1.x - normal1.x, lut1.y - normal1.y),
    //         new Point(lut2.x - normal2.x, lut2.y - normal2.y),
    //         new Point(lut2.x + normal2.x, lut2.y + normal2.y),
    //     ];

    //     aPosition.push(rect[0].x, rect[0].y);
    //     aPosition.push(rect[1].x, rect[1].y);
    //     aPosition.push(rect[2].x, rect[2].y);

    //     aPosition.push(rect[0].x, rect[0].y);
    //     aPosition.push(rect[2].x, rect[2].y);
    //     aPosition.push(rect[3].x, rect[3].y);

    //     aColor.push(1, 1, 1);
    //     aColor.push(1, 1, 1);
    //     aColor.push(1, 1, 1);

    //     aColor.push(1, 1, 1);
    //     aColor.push(1, 1, 1);
    //     aColor.push(1, 1, 1);

    //     aUV.push(0, 0);
    //     aUV.push(1, 0);
    //     aUV.push(1, 1);

    //     aUV.push(0, 0);
    //     aUV.push(1, 1);
    //     aUV.push(0, 1);
    // }

    const geometry = new Geometry({ attributes: { aPosition, aColor, aUV } });
    const shader = Shader.from({ gl: { vertex, fragment, }, resources: { uTexture: texture.source, }, });
    curveNode = new Mesh({ geometry, shader, });

    return curveNode;
}

function splitCurveByLength(curve, parts) {
    const totalLength = curve.length();
    const segmentLength = totalLength / parts;
    const result = [];

    // 创建查找表
    const lut = curve.getLUT(500);
    let currentLength = 0;
    let lastSperateIndex = 0;

    for (let i = 1; i <= parts; i++) {
        const targetLength = segmentLength * i;

        // 在LUT中找到最接近目标长度的点
        for (let j = lastSperateIndex + 1; j < lut.length; j++) {
            const lastPoint = lut[j - 1];
            const point = lut[j];
            const dx = point.x - lastPoint.x;
            const dy = point.y - lastPoint.y;
            currentLength += Math.sqrt(dx * dx + dy * dy);

            if (currentLength >= targetLength || j == lut.length - 1) {
                let seg = curve.split(lut[lastSperateIndex].t, point.t);
                result.push(seg);
                lastSperateIndex = j;
                break;
            }
        }
    }

    // 分割曲线
    return result;
}

function drawControlPoints() {
    let controlPoints = getControlPoints();
    let texture = textures[activeTexture];

    if (curveNode) {
        app.stage.removeChild(curveNode);
        curveNode = null;
    }
    curveNode = makeCurveType1(controlPoints);
    app.stage.addChild(curveNode);

    for (let i = 0; i < controlPoints.length; i++) {
        let node = controlPointsNode.children[i];
        node.clear();
        node.circle(0, 0, node.hitArea.radius);
        node.fill(0x00adb5);
        if (i === activeControlPoint) {
            node.stroke({ width: 3, color: 0x393e46 });
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

onMounted(async () => {
    app = new Application();
    await app.init({ background: '#eeeeee', resizeTo: window });
    rootRef.value.appendChild(app.canvas);

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
                    activeTexture = event.key - 1;
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
    <div ref="rootRef" style="width: 100%; height: 100%;"></div>
</template>