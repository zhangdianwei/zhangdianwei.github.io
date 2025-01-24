<script setup>
import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue';
import { Shader, Geometry, Point, Mesh, Circle, Graphics, Application, Assets, Container, Sprite } from 'pixi.js';
import { WebGLRenderer, MeshStandardMaterial, Raycaster, Plane, Vector2, Vector3, Camera, Scene, PerspectiveCamera } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


const pixiRef = shallowRef(null);

var gltfLoader = new GLTFLoader();

var g = {};
window.g = g;

async function initGame() {
    let rope = new Sprite(g.assets.rope1);
    rope.anchor.set(0.5, 0.5);
    rope.position.set(g.center.x, g.center.y);
    g.app.stage.addChild(rope);
    g.rope = rope;

    // 从g.assets.cube创建一个模型
    var model = g.assets.cube.scene.clone();
    // 给模型设置材质
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = new MeshStandardMaterial({ color: "#11999e" });
        }
    })
    g.scene.add(model);
}

function update() {
    if (g.mouse) {
        if (g.mouse.buttons === 1) {
            g.rope.position.set(g.mouse.global.x, g.mouse.global.y);
        }
    }

    g.controls.update();
    g.renderer.render(g.scene, g.camera);
}

function resetPlayerTarget() {
    return;
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
    g.controls.dispatchEvent(e.nativeEvent);
    resetPlayerTarget();
}

function onpointermove(e) {
    g.mouse = e;
    g.controls.dispatchEvent(e.nativeEvent);
    resetPlayerTarget();
}

function onpointerup(e) {
    g.mouse = e;
    g.controls.dispatchEvent(e.nativeEvent);
    resetPlayerTarget();
}


function initThreeScene() {
    var threeDom = document.getElementById('threeDom');
    // console.log("threeDom", threeDom.clientWidth, threeDom.clientHeight);

    var scene = new Scene();
    g.scene = scene;

    var camera = new PerspectiveCamera(75, threeDom.clientWidth / threeDom.clientHeight, 0.1, 1000);
    g.camera = camera;
    camera.position.z = 5;

    var renderer = new WebGLRenderer();
    g.renderer = renderer;
    renderer.setSize(threeDom.clientWidth, threeDom.clientHeight);
    threeDom.appendChild(renderer.domElement);
    renderer.setClearColor(0xe0eee8, 1);

    // 添加环境光
    var ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    // 添加方向光
    var directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    directionalLight.position.set(0, 1, -1);
    scene.add(directionalLight);

    // 添加orbitControls
    var controls = new OrbitControls(camera, renderer.domElement);
    g.controls = controls;

    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

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
        var gltf = await gltfLoader.loadAsync(item.url);
        g.assets[item.name] = gltf;
    }
}

onMounted(async () => {
    g.app = new Application({ resizeTo: pixiRef.value, transparent: true, backgroundAlpha: 0.0 });
    pixiRef.value.appendChild(g.app.view);
    g.center = { x: g.app.screen.width / 2, y: g.app.screen.height / 2 };

    await loadAssets();
    initThreeScene();

    g.app.stage.eventMode = "static";
    g.app.stage.hitArea = g.app.screen;
    g.app.stage.on("pointerdown", onpointerdown);
    g.app.stage.on("pointermove", onpointermove);
    g.app.stage.on("pointerup", onpointerup);

    initGame();

    g.app.ticker.add(update);
})

onUnmounted(() => {
    g.app.destroy(true, true);
})

</script>

<template>

    <div style="position: relative; width: 100%; height: 100vh;">

        <div ref="pixiRef" style=" position: absolute; top: 0; left: 0; width: 100%; height: 100%; ">
        </div>

        <div id="threeDom" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
        </div>

    </div>
</template>