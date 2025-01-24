<script setup>

import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue';
import { Shader, Geometry, Point, Mesh, Circle, Graphics, Application, Assets, Container, Sprite } from 'pixi.js';
import { OrbitControls } from '@tresjs/cientos'

const pixiRef = shallowRef(null);
const threeRef = shallowRef(null);
var g = {};
window.g = g;

async function initGame() {
    let rope = new Sprite(g.assets.rope1);
    rope.anchor.set(0.5, 0.5);
    rope.position.set(g.center.x, g.center.y);
    g.app.stage.addChild(rope);
    g.rope = rope;
}

function update() {
    if (g.mouse) {
        if (g.mouse.buttons === 1) {
            g.rope.position.set(g.mouse.global.x, g.mouse.global.y);
        }
    }
}

function onpointerdown(e) {
    g.mouse = e;
}

function onpointermove(e) {
    g.mouse = e;
}

function onpointerup(e) {
    g.mouse = e;
}

onMounted(async () => {
    g.app = new Application({ resizeTo: pixiRef.value, transparent: true, backgroundAlpha: 0.0 });
    pixiRef.value.appendChild(g.app.view);
    g.center = { x: g.app.screen.width / 2, y: g.app.screen.height / 2 };

    g.app.stage.eventMode = "static";
    g.app.stage.hitArea = g.app.screen;
    g.app.stage.on("pointerdown", onpointerdown);
    g.app.stage.on("pointermove", onpointermove);
    g.app.stage.on("pointerup", onpointerup);

    Assets.addBundle('assets', {
        "rope1": "img/rope1.png",
    });
    g.assets = await Assets.loadBundle('assets');

    initGame();

    g.app.ticker.add(update);
})

onUnmounted(() => {
    g.app.destroy(true, true);
})

</script>

<template>

    <div style="position: relative; width: 100%; height: 100vh;">

        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
            <TresCanvas ref="threeRef" clear-color="#e0eee8" window-size>
                <TresPerspectiveCamera :position="[0, 20, 0]" :rotation="[0, 0, 0]"></TresPerspectiveCamera>
                <TresAmbientLight :intensity="1" />

                <TresAxesHelper></TresAxesHelper>
                <TresGridHelper></TresGridHelper>

                <OrbitControls />
            </TresCanvas>
        </div>

        <div ref="pixiRef" style=" position: absolute; top: 0; left: 0; width: 100%; height: 100%; ">
        </div>

    </div>
</template>