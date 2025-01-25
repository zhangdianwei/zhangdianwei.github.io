<script setup>
import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue';
import { Shader, Geometry, Point, Mesh, Circle, Graphics, Application, Assets, Container, Sprite } from 'pixi.js';
import { WebGLRenderer, MeshStandardMaterial, Raycaster, Plane, Vector2, Vector3, Camera, Scene, PerspectiveCamera } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

var gltfLoader = new GLTFLoader();
var g = {
    speed: 0.02,
    border: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
};
window.g = g;

async function initGame() {
    // let rope = new Sprite(g.assets.rope1);
    // rope.anchor.set(0.5, 0.5);
    // rope.position.set(g.center.x, g.center.y);
    // g.app.stage.addChild(rope);
    // g.rope = rope;

    g.player = new THREE.Group();
    g.scene.add(g.player);

    g.player.add(g.camera);

    g.modelParent = new THREE.Group();
    g.player.add(g.modelParent);

    // 从g.assets.cube创建一个模型
    g.model = g.assets.cube.scene.clone();
    // 给模型设置材质
    g.model.traverse((child) => {
        if (child.isMesh) {
            child.material = new MeshStandardMaterial({ color: "#11999e" });
        }
    })
    g.modelParent.add(g.model);
    g.modelParent.lookAt(new Vector3(1, 0, 0));
    g.model.rotateZ(Math.PI / 2);


    // 显示player的xyz方向
    // const axesHelper = new THREE.AxesHelper(2);
    // g.modelParent.add(axesHelper);

    // 打印g.player的欧拉角
    // console.log("g.player.init", g.player.rotation.x, g.player.rotation.y, g.player.rotation.z);
}

function update() {
    if (g.mouse) {
        if (g.mouse.buttons === 1 && g.rope) {
            g.rope.position.set(g.mouse.global.x, g.mouse.global.y);
        }
    }

    // 让g.player向g.playerTarget,以固定速度移动
    if (g.playerTarget) {

        // 计算g.player与g.playerTarget的方向和距离
        var direction = g.playerTarget.clone().sub(g.player.position);
        var distance = direction.length();
        if (distance < 0.1) {
            g.player.position.copy(g.playerTarget);
        }
        else {
            var move = direction.normalize().multiplyScalar(g.speed);
            g.player.position.add(move);
            g.modelParent.lookAt(g.playerTarget);
        }

        // 限制g.player的位置在g.border内
        g.player.position.x = Math.max(g.border.minX, Math.min(g.border.maxX, g.player.position.x));
        g.player.position.y = Math.max(g.border.minY, Math.min(g.border.maxY, g.player.position.y));



        // 打印g.player的欧拉角
        // console.log("g.player.rotation", g.player.rotation.x, g.player.rotation.y, g.player.rotation.z);
    }

    // g.controls.update();
    g.renderer.render(g.scene, g.camera);
}

function resetPlayerTarget() {
    const mouse = new Vector2();
    mouse.x = (g.mouse.x / g.renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(g.mouse.y / g.renderer.domElement.clientHeight) * 2 + 1;

    g.raycaster.setFromCamera(mouse, g.camera);

    // 创建xy平面
    const xyPlane = new Plane(new Vector3(0, 0, 1), 0);

    const intersectPoint = new Vector3();
    g.raycaster.ray.intersectPlane(xyPlane, intersectPoint);

    g.playerTarget = intersectPoint;
    // console.log("g.model.position", g.model.position, intersectPoint);
}

function onpointerdown(e) {
    g.mouse = e;
    g.speed = 0.05;
    resetPlayerTarget();
}

function onpointermove(e) {
    g.mouse = e;
    resetPlayerTarget();
}

function onpointerup(e) {
    g.mouse = e;
    g.speed = 0.02;
    resetPlayerTarget();
}


function initThreeScene() {
    var threeDom = document.getElementById('threeDom');
    // console.log("threeDom", threeDom.clientWidth, threeDom.clientHeight);

    var scene = new Scene();
    g.scene = scene;

    var camera = new PerspectiveCamera(75, threeDom.clientWidth / threeDom.clientHeight, 0.1, 1000);
    g.camera = camera;
    camera.position.set(0, 0, 5);
    scene.add(camera)

    var renderer = new WebGLRenderer({ antialias: true });
    g.renderer = renderer;
    renderer.setSize(threeDom.clientWidth, threeDom.clientHeight);
    renderer.setClearColor(0xe0eee8, 1);
    threeDom.appendChild(renderer.domElement);

    // 添加环境光
    var ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    // 添加方向光
    var directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    directionalLight.position.set(0, 0, 1);
    scene.add(directionalLight);

    // 添加orbitControls
    // var controls = new OrbitControls(camera, renderer.domElement);
    // g.controls = controls;

    const gridHelper = new THREE.GridHelper(20, 20);
    gridHelper.rotateX(Math.PI / 2);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    g.raycaster = new THREE.Raycaster();
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
    var pixiDom = document.getElementById('pixiDom');
    g.app = new Application({ resizeTo: pixiDom, transparent: true, backgroundAlpha: 0.0 });
    pixiDom.appendChild(g.app.view);
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

        <div id="threeDom" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
        </div>

        <div id="pixiDom" style=" position: absolute; top: 0; left: 0; width: 100%; height: 100%; ">
        </div>

    </div>
</template>