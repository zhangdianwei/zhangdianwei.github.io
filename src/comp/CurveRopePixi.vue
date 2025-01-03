<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { Circle, Graphics, Application, Assets, Sprite, Container } from 'pixi.js';

const rootRef = ref(null);
let app = null;

let controlPoints = [];
let activeControlPoint = -1;
let controlPointsNode = null;
let curveNode = null;

const textures = [
    await Assets.load('./img/rope1.png'),
    await Assets.load('./img/rope2.png'),
    await Assets.load('./img/rope3.png'),
]
let activeTexture = 0;

function drawControlPoints() {
    for (let i = 0; i < controlPoints.length; i++) {
        const point = controlPoints[i];
        let node = controlPointsNode.children[i];
        node.position.set(point.x, point.y);
        node.clear();
        node.circle(0, 0, node.hitArea.radius);
        node.fill(0x00adb5);
        if (i === activeControlPoint) {
            node.stroke({ width: 3, color: 0x393e46 });
        }
    }

    curveNode.clear();
    curveNode.moveTo(controlPoints[0].x, controlPoints[0].y);
    curveNode.bezierCurveTo(controlPoints[1].x, controlPoints[1].y, controlPoints[2].x, controlPoints[2].y, controlPoints[3].x, controlPoints[3].y);
    curveNode.stroke({ width: 50, texture: textures[activeTexture] });
    console.log(controlPoints);
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
        controlPoints[activeControlPoint].x = local.x;
        controlPoints[activeControlPoint].y = local.y;
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
        controlPoints.push({ x: center.x, y: center.y - 300 });
        controlPoints.push({ x: center.x - 300, y: center.y - 100 });
        controlPoints.push({ x: center.x + 300, y: center.y + 100 });
        controlPoints.push({ x: center.x, y: center.y + 300 });

        controlPointsNode = new Container();
        app.stage.addChild(controlPointsNode);
        for (let i = 0; i < controlPoints.length; i++) {
            let node = new Graphics();
            controlPointsNode.addChild(node);
            node.hitArea = new Circle(0, 0, 30);
        }

        curveNode = new Graphics();
        app.stage.addChild(curveNode);

        drawControlPoints();
    }

    {
        document.addEventListener('keydown', (event) => {
            if (event.key == 1) {
                activeTexture = 0;
                drawControlPoints();
            }
            else if (event.key == 2) {
                activeTexture = 1;
                drawControlPoints();
            }
            else if (event.key == 3) {
                activeTexture = 2;
                drawControlPoints();
            }
        });
    }



    // conexture = await Assets.load('https://pixijs.com/assets/bunny.png');
    // conunny = new Sprite(texture);
    // bunnchor.set(0.5);
    // bun = app.screen.width / 2;
    // bun = app.screen.height / 2;
    // appge.addChild(bunny);
    // appker.add(() => {
    //    ny.rotation += 0.05;
    // });
});
</script>
<template>
    <div ref="rootRef" style="width: 100%; height: 100%;"></div>
</template>