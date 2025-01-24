<script setup>

import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue';
import { Shader, Geometry, Point, Mesh, Circle, Graphics, Application, Assets, Container, Sprite } from 'pixi.js';
import { OrbitControls, useGLTF } from '@tresjs/cientos'
import { MeshStandardMaterial, Raycaster, Plane, Vector2, Vector3, Camera } from 'three';

const pixiRef = shallowRef(null);
const threeRef = shallowRef(null);
const rootModelRef = shallowRef(null);
var g = {};
window.g = g;

async function initGame() {
    // let rope = new Sprite(g.assets.rope1);
    // rope.anchor.set(0.5, 0.5);
    // rope.position.set(g.center.x, g.center.y);
    // g.app.stage.addChild(rope);
    // g.rope = rope;

    // 从g.assets.cube创建一个模型
    var model = g.assets.cube.scene.clone();
    // 给模型设置材质
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = new MeshStandardMaterial({ color: "#11999e" });
        }
    })
    rootModelRef.value.add(model);
}

function update() {
    // if (g.mouse) {
    //     if (g.mouse.buttons === 1) {
    //         g.rope.position.set(g.mouse.global.x, g.mouse.global.y);
    //     }
    // }
}

function resetPlayerTarget() {
    const raycaster = new Raycaster();
    const mouse = new Vector2(g.mousex, g.mouse.y);

    raycaster.setFromCamera(mouse, Camera.main);

    const xyPlane = new Plane(new Vector3(0, 0, 1), 0);

    const intersectPoint = new Vector3();
    raycaster.ray.intersectPlane(xyPlane, intersectPoint);

    console.log(intersectPoint);
}

function onpointerdown(e) {
    g.mouse = e;
    resetPlayerTarget();
}

function onpointermove(e) {
    g.mouse = e;
    resetPlayerTarget();
}

function onpointerup(e) {
    g.mouse = e;
    resetPlayerTarget();
}

async function loadAssets() {
    Assets.addBundle('assets', {
        "rope1": "img/rope1.png",
    });
    g.assets = await Assets.loadBundle('assets');

    var resources = [
        { name: 'cube', url: 'game2048/cube.glb' },
    ]
    for (var i = 0; i < resources.length; i++) {
        var item = resources[i];
        g.assets[item.name] = await useGLTF(item.url);
    }
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

    await loadAssets();

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
                <TresPerspectiveCamera :position="[0, 10, 4]" :rotation="[0, 0, 0]"></TresPerspectiveCamera>
                <TresAmbientLight :intensity="2" />
                <TresDirectionalLight :intensity="5" :position="[20, 20, 20]" />

                <TresAxesHelper></TresAxesHelper>
                <TresGridHelper></TresGridHelper>

                <TresGroup ref="rootModelRef"></TresGroup>

                <OrbitControls />
            </TresCanvas>
        </div>

        <div ref="pixiRef" style=" position: absolute; top: 0; left: 0; width: 100%; height: 100%; ">
        </div>

    </div>
</template>