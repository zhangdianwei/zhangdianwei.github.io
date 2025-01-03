<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { Point, MeshRope, Texture, buildGeometryFromPath, Mesh, GraphicsPath, Circle, Graphics, Application, Assets, Sprite, Container } from 'pixi.js';

const rootRef = ref(null);
let app = null;

let activeControlPoint = -1;
let controlPointsNode = null;

let curveNode = null;

const textures = [
    await Assets.load('./img/rope1.png'),
    await Assets.load('./img/rope2.png'),
    await Assets.load('./img/rope3.png'),
]
let activeTexture = 1;

function getControlPoints() {
    return controlPointsNode.children.map((node) => {
        return new Point(node.x, node.y);
    });
}

function drawControlPoints() {
    let controlPoints = getControlPoints();
    let texture = textures[activeTexture];

    // if (curveNode) {
    //     app.stage.removeChild(curveNode);
    //     curveNode = null;
    // }
    if (!curveNode) {
        curveNode = new Graphics();
    }
    curveNode.clear();
    curveNode.moveTo(controlPoints[0].x, controlPoints[0].y);
    curveNode.bezierCurveTo(controlPoints[1].x, controlPoints[1].y, controlPoints[2].x, controlPoints[2].y, controlPoints[3].x, controlPoints[3].y);
    curveNode.stroke({ width: 5, color: 0xaa0000, alpha: 0.5 });
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



    // conexture = await Assets.load('https://pixijs.com/assets/bunny.png');
    // conunny = new Sprite(texture);
    // bunnchor.set(0.5);
    // bun = app.screen.width / 2;
    // bun = app.screen.height / 2;
    // appge.addChild(bunny);
    app.ticker.add(() => {
        for (let i = 0; i < controlPointsNode.children.length; i++) {
            let node = controlPointsNode.children[i];
            // node.y = Math.sin(app.ticker.lastTime / 1000 + i * 0.1) * 100 + center.y;
        }
        drawControlPoints();
    });
});
</script>
<template>
    <div ref="rootRef" style="width: 100%; height: 100%;"></div>
</template>