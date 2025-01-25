<script setup>
import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue';
import { Shader, Geometry, Point, Mesh, Circle, Graphics, Application, Assets, Container, Sprite } from 'pixi.js';
import { WebGLRenderer, MeshStandardMaterial, Raycaster, Plane, Vector2, Vector3, Camera, Scene, PerspectiveCamera } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

var gltfLoader = new GLTFLoader();
var fontLoader = new FontLoader();

var g = {
    border: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
};
window.g = g;

var CubeConfigs = {
    "2": {
        scale: 1,
        color: 0x364f6b,
    },
    "4": {
        scale: 1.2,
        color: 0x3fc1c9,
    },
    "8": {
        scale: 1.4,
        color: 0x40514e,
    },
    "16": {
        scale: 1.6,
        color: 0x3f72af,
    },
    "32": {
        scale: 1.8,
        color: 0x00b8a9,
    },
}

async function initGame() {
    // let rope = new Sprite(g.assets.rope1);
    // rope.anchor.set(0.5, 0.5);
    // rope.position.set(g.center.x, g.center.y);
    // g.app.stage.addChild(rope);
    // g.rope = rope;

    g.player = new Snake([8, 4, 2])
    g.scene.add(g.player);
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
            this.cubes.push(cube);
            g.scene.add(cube);
        }

        // this.trigo = g.assets.trigo.scene.clone();
        // this.trigo.rotateZ(Math.PI / 2);
        // this.cubes[0].modelParent.add(this.trigo);

        for (var i = 0; i < this.cubes.length; i++) {
            // var cube = this.cubes[i];
            // var trigo = g.assets.trigo.scene.clone();
            // trigo.rotateZ(Math.PI / 2);
            // cube.modelParent.add(trigo);

            var axesHelper = new THREE.AxesHelper(1);
            this.cubes[i].modelParent.add(axesHelper);
        }

        this.speed = 0.02;

        // var cube2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        // cube2.position.set(0, 0, 0);
        // this.add(cube2);

        this.updateCubes();
    }

    update() {
        var distance = this.playerMoveDiff ? this.playerMoveDiff.length() : 0;
        if (distance >= 0.5) {
            var moveVec = this.playerMoveDiff.clone().normalize().multiplyScalar(this.speed);

            var targetPos = this.position.clone().add(moveVec);
            targetPos.x = Math.max(g.border.minX, Math.min(g.border.maxX, targetPos.x));
            targetPos.y = Math.max(g.border.minY, Math.min(g.border.maxY, targetPos.y));

            moveVec = targetPos.clone().sub(this.position);
            this.position.set(targetPos.x, targetPos.y, targetPos.z);

            this.updateCubes();
        }

    }

    updateCubes() {
        for (var i = 0; i < this.cubes.length; i++) {
            var cube = this.cubes[i];

            var targetPos = this.getCubeStandPos(i);
            var moveVec = targetPos.clone().sub(cube.position);
            cube.position.add(moveVec);

            var angle = Math.atan2(moveVec.y, moveVec.x);
            cube.modelParent.rotation.z = angle;
        }
    }

    getCubeStandPos(index) {
        var startPos = this.position.clone();
        for (var i = 0; i < index; i++) {
            var cube = this.cubes[i];

            let frontVector = new THREE.Vector3(-1, 0, 0);
            frontVector.applyMatrix4(cube.modelParent.matrixWorld);
            frontVector.normalize().multiplyScalar(-1);

            startPos.add(frontVector);
        }
        return startPos;
    }

    setMoveDiff(playerMoveDiff) {
        this.playerMoveDiff = playerMoveDiff;
    }
}

function createCube(num) {
    var cube = new THREE.Group();
    cube.num = num;

    var config = CubeConfigs[num];

    cube.modelParent = new THREE.Group();
    cube.add(cube.modelParent);

    cube.model = g.assets.cube.scene.clone();
    cube.modelParent.add(cube.model);
    cube.model.traverse((child) => {
        if (child.isMesh) {
            child.material = new MeshStandardMaterial({ color: config.color, transparent: true, opacity: 0.5 });
        }
    })
    cube.model.rotateX(Math.PI / 2);

    cube.text = new THREE.Mesh(new TextGeometry(num.toString(), {
        font: g.assets.font,
        size: 0.6,
        depth: 0.1,
        curveSegments: 10,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.02,
        bevelSegments: 3
    }), new THREE.MeshBasicMaterial({ color: 0xbb0000 }));
    cube.add(cube.text);

    // 让cube.text居中
    var box = new THREE.Box3().setFromObject(cube.text);
    var size = box.getSize(new THREE.Vector3());
    cube.text.position.set(-size.x / 2, -size.y / 2, 0.15);

    // var cube2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    // cube2.position.set(0, 0, 0);
    // cube.add(cube2);


    return cube;
}

g.lastUpdateTime = Date.now();
g.needUpdate = true;
function onRequestAnimationFrame() {
    requestAnimationFrame(onRequestAnimationFrame);

    // var now = Date.now();
    // var delta = now - g.lastUpdateTime;
    // if (delta < 1000) {
    //     return;
    // }
    // g.lastUpdateTime = now;

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
    g.player.update();
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

    // const axesHelper = new THREE.AxesHelper(2);
    // scene.add(axesHelper);

    g.raycaster = new THREE.Raycaster();

    onRequestAnimationFrame();
}

async function initAssets() {
    Assets.addBundle('assets', {
        "rope1": "img/rope1.png",
    });
    g.assets = await Assets.loadBundle('assets');

    var resources = [
        { name: 'cube', url: 'game2048/cube.glb', loader: gltfLoader },
        { name: 'trigo', url: 'game2048/trigo.glb', loader: gltfLoader },
        { name: 'font', url: 'fonts/gentilis_regular.typeface.json', loader: fontLoader }
    ]
    for (var i = 0; i < resources.length; i++) {
        var item = resources[i];
        var gltf = await item.loader.loadAsync(item.url);
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

        <div id="pixiDom" style=" position: absolute; top: 0; left: 0; width: 100%; height: 100%; ">
        </div>

        <div id="threeDom" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
        </div>



    </div>
</template>