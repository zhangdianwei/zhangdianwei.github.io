<script setup>

import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue';
import { Shader, Geometry, Point, Mesh, Circle, Graphics, Application, Assets, Container, Sprite } from 'pixi.js';

const rootRef = shallowRef(null);
var g = {};

async function initGame() {
    let rope = new Sprite(g.assets.rope1);
    rope.anchor.set(0.5, 0.5);
    rope.position.set(g.center.x, g.center.y);
    g.app.stage.addChild(rope);
    g.rope = rope;
}

function update() {
    g.rope.position.set(g.mousePos.x, g.mousePos.y);
}

function onpointerdown(e) {
    g.mousePos = e.global;
    updatePlayerPos();
}

function onpointermove(e) {
    g.mousePos = e.global;
}

function onpointerup(e) {
    g.mousePos = e.global;
}

onMounted(async () => {
    g.app = new Application({ background: '#eeeeee', resizeTo: rootRef.value });
    rootRef.value.appendChild(g.app.view);
    g.center = { x: g.app.screen.width / 2, y: g.app.screen.height / 2 };

    g.app.stage.eventMode = "static";
    g.app.stage.hitArea = g.app.screen;
    g.app.stage.on("pointerdown", onpointerdown);
    g.app.stage.on("pointermove", onpointermove);
    g.app.stage.on("pointerup", onpointerup);
    g.mousePos = { x: g.center.x, y: g.center.y };

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
    <div ref="rootRef" style="width: 100%; height: 98vh;"></div>
</template>