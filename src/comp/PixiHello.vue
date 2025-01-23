<script setup>

import { ref, shallowRef, watch, onMounted } from 'vue';
import { Shader, Geometry, Point, Mesh, Circle, Graphics, Application, Assets, Container } from 'pixi.js';
import { Mesh3D, Light, LightType, LightingEnvironment, CameraOrbitControl, Color, StandardMaterial } from 'pixi3d/pixi7'

const rootRef = shallowRef(null);
let app = null;
let control = null;
let center = null;

let mesh = null;
function initGame() {
    mesh = app.stage.addChild(Mesh3D.createCube())
}

function update() {
    mesh.rotationQuaternion.setEulerAngles(0, app.ticker.lastTime * 0.01, 0);
}

onMounted(() => {
    app = new Application({ background: '#eeeeee', resizeTo: rootRef.value });
    rootRef.value.appendChild(app.view);

    control = new CameraOrbitControl(app.view);
    center = { x: app.screen.width / 2, y: app.screen.height / 2 };

    var light = new Light()
    light.type = LightType.directional;
    light.intensity = 5;
    light.rotationQuaternion.setEulerAngles(45, 225, 0);
    LightingEnvironment.main.lights.push(light);

    var light = new Light()
    light.type = LightType.directional;
    light.intensity = 2;
    light.rotationQuaternion.setEulerAngles(-45, 45, 0);
    LightingEnvironment.main.lights.push(light);

    initGame();

    app.ticker.add(update);
})

</script>

<template>
    <div ref="rootRef" style="width: 100%; height: 98vh;"></div>
</template>