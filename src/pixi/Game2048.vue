<script setup>
import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue';
import { Shader, Geometry, Point, Mesh, Circle, Graphics, Application, Assets, Container, Sprite } from 'pixi.js';
import { WebGLRenderer, MeshStandardMaterial, Raycaster, Plane, Vector2, Vector3, Camera, Scene, PerspectiveCamera } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

var gltfLoader = new GLTFLoader();
var g = {
    border: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
};
window.g = g;

async function initGame() {
    // let rope = new Sprite(g.assets.rope1);
    // rope.anchor.set(0.5, 0.5);
    // rope.position.set(g.center.x, g.center.y);
    // g.app.stage.addChild(rope);
    // g.rope = rope;

    g.player = new Snake([8, 4, 2])
    g.scene.add(g.player);
    // g.player.lookAt(new Vector3(1, 0, 0));
    g.player.add(g.camera);

    // 为g.player添加axis
    // var axesHelper = new THREE.AxesHelper(2);
    // g.player.add(axesHelper);
}

class Snake extends THREE.Group {
    constructor(nums) {
        super();
        this.cubes = [];
        for (var i = 0; i < nums.length; i++) {
            var cube = createCube(nums[i]);
            cube.position.set(i, 0, 0);
            this.cubes.push(cube);
            g.scene.add(cube);
        }

        this.trigo = g.assets.trigo.scene.clone();
        this.trigo.rotateZ(Math.PI / 2);
        this.cubes[0].modelParent.add(this.trigo);

        // 创建一个立方体
        var cube = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        cube.position.set(0, 0, 0);
        this.add(cube);

        this.speed = 0.02;
    }

    update() {
        var distance = this.playerMoveDiff ? this.playerMoveDiff.length() : 0;
        if (distance >= 0.5) {
            var moveVec = this.playerMoveDiff.clone().normalize().multiplyScalar(this.speed);
            this.position.add(moveVec);
        }

        this.updateCubes();
    }

    updateCubes() {
        if (!this.playerMoveDiff) {
            return;
        }
        var playerTarget = this.position.clone().add(this.playerMoveDiff);
        for (var i = 0; i < this.cubes.length; i++) {
            var cube = this.cubes[i];
            cube.position.set(this.position.x + i, this.position.y, this.position.z);
            cube.modelParent.lookAt(playerTarget);
        }
    }

    setMoveDiff(playerMoveDiff) {
        this.playerMoveDiff = playerMoveDiff;
        console.log("setMoveDiff", playerMoveDiff);
    }
}

function createCube(num) {
    var cube = new THREE.Group();
    cube.num = num;

    cube.modelParent = new THREE.Group();
    cube.add(cube.modelParent);
    cube.modelParent.lookAt(new Vector3(1, 0, 0));

    cube.model = g.assets.cube.scene.clone();
    cube.modelParent.add(cube.model);
    cube.model.traverse((child) => {
        if (child.isMesh) {
            child.material = new MeshStandardMaterial({ color: "#11999e" });
        }
    })
    cube.model.rotateZ(Math.PI / 2);

    return cube;
}

function onRequestAnimationFrame() {
    if (g.mouse) {
        if (g.mouse.buttons === 1 && g.rope) {
            g.rope.position.set(g.mouse.global.x, g.mouse.global.y);
        }
    }

    if (g.player) {
        g.player.update();
    }

    // g.controls.update();
    g.renderer.render(g.scene, g.camera);

    requestAnimationFrame(onRequestAnimationFrame);
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

    // 求g.player与intersectPoint的向量
    var playerMoveDiff = intersectPoint.clone().sub(g.player.position);
    playerMoveDiff.z = 0;
    g.player.setMoveDiff(playerMoveDiff);

}

function onpointerdown(e) {
    g.mouse = e;
    g.player.speed = 0.05;
    resetPlayerTarget();
}

function onpointermove(e) {
    g.mouse = e;
    resetPlayerTarget();
}

function onpointerup(e) {
    g.mouse = e;
    g.player.speed = 0.02;
    resetPlayerTarget();
}


function initThreeScene() {
    var threeDom = document.getElementById('threeDom');
    // console.log("threeDom", threeDom.clientWidth, threeDom.clientHeight);

    var scene = new Scene();
    g.scene = scene;

    var camera = new PerspectiveCamera(75, threeDom.clientWidth / threeDom.clientHeight, 0.1, 1000);
    g.camera = camera;
    camera.position.set(0, 0, 8);
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

    onRequestAnimationFrame();
}

async function initAssets() {
    Assets.addBundle('assets', {
        "rope1": "img/rope1.png",
    });
    g.assets = await Assets.loadBundle('assets');

    var resources = [
        { name: 'cube', url: 'game2048/cube.glb' },
        { name: 'trigo', url: 'game2048/trigo.glb' },
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

    await initAssets();
    initThreeScene();
    initGame();

    // 在文档级别添加鼠标事件监听器
    document.addEventListener('pointerdown', onpointerdown);
    document.addEventListener('pointermove', onpointermove);
    document.addEventListener('pointerup', onpointerup);

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