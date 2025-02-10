<script setup>
import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue';
import { Shader, Geometry, Point, Mesh, Circle, Graphics, Application, Assets, Container, Sprite } from 'pixi.js';
import { WebGLRenderer, MeshStandardMaterial, Raycaster, Plane, Vector2, Vector3, Camera, Scene, PerspectiveCamera } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as CANNON from 'cannon-es';

var gltfLoader = new GLTFLoader();
var fontLoader = new FontLoader();

var g = {
    border: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
    world: new CANNON.World(),
};
window.g = g;

var CubeColors = ["#E0F7E6", "#B2E9C1", "#8CDBAA", "#66CC99", "#4CAF89", "#3F9E8C", "#348899", "#2979A5", "#1F5F9E", "#1A4976", "#6A5ACD", "#9575CD", "#AB47BC", "#D81B60", "#FF7043", "#FFB300", "#FFA000", "#E53935", "#C62828", "#8E0000"];

function getTextColor(hex) {
    const rgb = parseInt(hex.substring(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#FFFFFF";
}

function getCubeSize(cube) {
    var box = new THREE.Box3().setFromObject(cube);
    return box.getSize(new THREE.Vector3());
}
g.test = function () {
    console.log("test", getCubeSize(g.player.cubes[0]));
}

async function initGame() {
    // let rope = new Sprite(g.assets.rope1);
    // rope.anchor.set(0.5, 0.5);
    // rope.position.set(g.center.x, g.center.y);
    // g.app.stage.addChild(rope);
    // g.rope = rope;

    g.player = new Snake([2])
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
            this.addCube(nums[i]);
        }

        // for (var i = 0; i < this.cubes.length; i++) {
        //     // var cube = this.cubes[i];
        //     // var trigo = g.assets.trigo.scene.clone();
        //     // trigo.rotateZ(Math.PI / 2);
        //     // cube.modelParent.add(trigo);

        //     var axesHelper = new THREE.AxesHelper(1);
        //     this.cubes[i].modelParent.add(axesHelper);
        // }

        this.speed = 1;
        this.frame = 0;
        this.moveItems = [];
        this.moveDir = null;
        this.mergingIndex = -1;
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    updatePre() {
        if (!this.moveDir) {
            return;
        }

        var velocity = this.moveDir.clone().multiplyScalar(this.speed);

        var cube = this.cubes[0];
        cube.body.velocity.set(velocity.x, velocity.y, 0);
        cube.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.atan2(this.moveDir.y, this.moveDir.x));
    }

    updateAfter() {
        var cube = this.cubes[0];
        this.position.copy(cube.body.position);

        var cube = this.cubes[0];
        this.moveItems.push({ frame: this.frame, moveVec: cube.body.velocity.clone() });
        if (this.moveItems.length > 100000) {
            this.moveItems.shift();
        }
        return;

        if (this.mergingStep > 0) {
            this.mergingStep -= 1;
        }

        if (this.mergingCube && this.mergingStep <= 0) {
            this.mergingStep = 0;
            this.mergingIndex = -1;
            this.mergingCube = null;
            this.doMergeReplace();
            this.mergingCubes = null;
        }

        if (this.mergingIndex < 0) {
            this.checkMerge();
        }
    }

    checkMerge() {
        var now = Date.now();

        var num2cubes = {};
        for (var i = 0; i < this.cubes.length; i++) {
            var cube = this.cubes[i];
            if (now - cube.createTime < 700) {
                continue;
            }
            var num = cube.num;
            if (!num2cubes[num]) {
                num2cubes[num] = [];
            }
            num2cubes[num].push(cube);
            if (num2cubes[num].length == 2) {
                break;
            }
        }

        var mergeCubes = [];
        for (var num in num2cubes) {
            var cubes = num2cubes[num];
            if (cubes.length >= 2) {
                mergeCubes = cubes;
                break;   
            }
        }

        if (mergeCubes.length == 0) {
            return false;
        }

        this.mergingCube = mergeCubes[1];
        this.mergingCubes = mergeCubes;
        this.mergingIndex = this.cubes.indexOf(this.mergingCube);
        this.mergingStep = 10;

        return mergeCubes.length > 0;
    }

    doMergeReplace() {
        var cube1 = this.mergingCubes[0];
        var cube2 = this.mergingCubes[1];
        var num = cube1.num + cube2.num;
        var oldIndex = this.cubes.indexOf(cube1);
        this.removeCube(cube1);
        this.removeCube(cube2);
        this.addCube(num, oldIndex);
    }

    updateCubes() {
        var frame = this.frame;
        var frames = [];
        for (var i = 0; i < this.cubes.length; i++) {
            var cube = this.cubes[i];
            frames.push(frame);
            frame -= (1 / this.speed) + (cube.scale.x - 1) * 90;
        }

        if (this.mergingIndex >= 0) {
            var diff = frames[this.mergingIndex - 1] - frames[this.mergingIndex];
            diff /= this.mergingStep;
            diff = Math.floor(diff);
            for (var i = this.mergingIndex; i < this.cubes.length; i++) {
                frames[i] += diff;
            }
        }

        // console.log("frames", `frame=${this.frame}`, `mergingStep=${this.mergingStep}`, `frames=${frames}`);

        for (var i = 0; i < this.cubes.length; i++) {
            var cube = this.cubes[i];

            var frame = frames[i];

            var moveItem = this.moveItems.find(item => item.frame === frame);
            if (!moveItem) {
                cube.body.position.copy(this.getCubeStandPos(i));
                continue;
            }

            var moveTarget = moveItem.moveTarget.clone();
            cube.body.position.set(moveTarget.x, moveTarget.y, moveTarget.z);

            var moveDir = moveItem.moveVec.clone().normalize();
            var angle = Math.atan2(moveDir.y, moveDir.x);
            cube.modelParent.rotation.z = angle;
        }
    }

    addCube(num, index) {
        index ??= this.cubes.length;
        var cube = createCube(num, index == 0);
        cube.body.material = g.snakeMaterial;
        this.cubes.splice(index, 0, cube);
        cube.createTime = Date.now();
        g.scene.add(cube);
    }

    removeCube(cube) {
        var index = this.cubes.indexOf(cube);
        if (index >= 0) {
            this.cubes.splice(index, 1);
            g.scene.remove(cube);
        }
    }

    getCubeStandPos(index) {
        var startPos = this.position.clone();
        if (index == 0) {
            return startPos;
        }
        else {
            var cube = this.cubes[index - 1];
            var cubeSize = getCubeSize(cube);
            let frontVector = new THREE.Vector3(1, 0, 0);
            frontVector.applyMatrix4(cube.modelParent.matrixWorld);
            frontVector.normalize().multiplyScalar(-cubeSize.x);
            startPos.add(frontVector);
            return startPos;
        }
    }

    setMoveDir(moveDir) {
        this.moveDir = moveDir.clone().normalize();
    }
}

function createCube(num, trigo) {
    var cube = new THREE.Group();
    cube.num = num;

    var index = Math.log2(num) - 1;
    var color = CubeColors[index];
    var scale = 1 + index * 0.1;

    cube.scale.set(scale, scale, scale);

    cube.modelParent = new THREE.Group();
    cube.add(cube.modelParent);

    cube.model = g.assets.cube.scene.clone();
    cube.model.castShadow = true
    cube.modelParent.add(cube.model);
    cube.model.traverse((child) => {
        if (child.isMesh) {
            child.material = new MeshStandardMaterial({ color: color, transparent: true, opacity: 1 });
            child.castShadow = true;
        }
    })
    cube.model.rotateX(Math.PI / 2);

    cube.text = new THREE.Mesh(new TextGeometry(num.toString(), {
        font: g.assets.font,
        size: 0.6,
        depth: 0,
        curveSegments: 10,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.02,
        bevelSegments: 3
    }), new THREE.MeshBasicMaterial({ color: 0xbb0000 }));
    cube.add(cube.text);
    var textScale = 1 - index * 0.05;
    cube.text.scale.set(textScale, textScale, textScale);
    var textColor = getTextColor(color);
    cube.text.material.color.set(textColor);

    // 让cube.text居中
    var textBox = new THREE.Box3().setFromObject(cube.text);
    var textSize = textBox.getSize(new THREE.Vector3());
    var cubeBox = new THREE.Box3().setFromObject(cube);
    var cubeSize = cubeBox.getSize(new THREE.Vector3());
    cube.text.position.set(-textSize.x / 2, -textSize.y / 2, cubeSize.z / 2);

    if (trigo) {
        var trigo = g.assets.trigo.scene.clone();
        cube.modelParent.add(trigo);
        trigo.position.set(0.8, 0, 0);
    }

    // var cube2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 2), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    // cube2.position.set(0, 0, 0);
    // cube.add(cube2);

    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.25)); // Cube的半边长
    const body = new CANNON.Body({
        mass: 0.1, // 质量
        fixedRotation: true,
        position: new CANNON.Vec3(0, 0, 0), // 初始位置
        shape: shape,
        material: g.cubeMaterial
    });
    g.world.addBody(body);

    body.obj = cube;
    cube.body = body;

    return cube;
}

function onRequestAnimationFrame() {
    requestAnimationFrame(onRequestAnimationFrame);

    if (g.player && !g.paused) {
        g.player.updatePre();
    }

    // 物理世界
    {
        g.world.step(1 / 60);

        for (let i = 0; i < g.world.bodies.length; ++i) {
            const body = g.world.bodies[i];
            const obj = body.obj;
            obj.position.copy(body.position);
            obj.quaternion.copy(body.quaternion);
        }
    }

    if (g.player && !g.paused) {
        g.player.updateAfter();
    }

    checkFoodCube();

    if (g.mouse) {
        if (g.mouse.buttons === 1 && g.rope) {
            g.rope.position.set(g.mouse.global.x, g.mouse.global.y);
        }
    }

    if (g.controls) {
        g.controls.update();
    }

    g.renderer.render(g.scene, g.camera);
}

function checkFoodCube(force) {
    if (g.foodCube && !force) {
        return;
    }

    g.foodCube = createCube(2);
    g.scene.add(g.foodCube);
    // g.foodCube.body.position.set(Math.random() * 20 - 10, Math.random() * 20 - 10, 0);
    g.foodCube.body.position.set(0, -2, 0);
    // g.foodCube.body.velocity.set(-6, 0, 0);
}

function checkEatFood() {
    if (!g.foodCube || !g.player) {
        return;
    }

    var foodPos = g.foodCube.position;
    var playerPos = g.player.position;
    var distance = playerPos.distanceTo(foodPos);
    if (distance < 1) {
        g.scene.remove(g.foodCube);
        g.foodCube = null;
        g.player.addCube(2);
    }
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
    var moveDir = intersectPoint.clone().sub(g.player.position);
    moveDir.z = 0;
    g.player.setMoveDir(moveDir);

}

function onpointerdown(e) {
    g.mouse = e;
    g.player.setSpeed(5);
    resetPlayerTarget();
}

function onpointermove(e) {
    g.mouse = e;
    resetPlayerTarget();
}

function onpointerup(e) {
    g.mouse = e;
    g.player.setSpeed(1);
    resetPlayerTarget();
}

function onkeydown(e) {
    g.keys[e.key] = true;
    if (e.key === 'f') {
        var num = g.player.cubes[g.player.cubes.length - 1].num;
        num /= 2;
        if (num < 2) {
            num = 2;
        }
        g.player.addCube(2);
    }
    else if (e.key === 'p') {
        g.paused = !g.paused;
    }
    else if (e.key === 's') {
        g.paused = true;
        g.player.update();
    }
    else if (e.key === 'a') {
        checkFoodCube(true);
    }
}
function onkeyup(e) {
    delete g.keys[e.key];
}

function initThreeScene() {
    var threeDom = document.getElementById('threeDom');
    // console.log("threeDom", threeDom.clientWidth, threeDom.clientHeight);

    var scene = new Scene();
    g.scene = scene;

    var camera = new PerspectiveCamera(75, threeDom.clientWidth / threeDom.clientHeight, 0.1, 1000);
    g.camera = camera;
    camera.position.set(0, 0, 10);
    scene.add(camera)

    var renderer = new WebGLRenderer({ antialias: true });
    g.renderer = renderer;
    renderer.setSize(threeDom.clientWidth, threeDom.clientHeight);
    renderer.setClearColor(0xe0eee8, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 可选的阴影类型
    threeDom.appendChild(renderer.domElement);

    // 添加环境光
    var ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    // 添加方向光
    var directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true; // 允许这个光源投射阴影
    scene.add(directionalLight);
    // var directionalLight = new THREE.DirectionalLight(0xff0000, 1);
    // directionalLight.position.set(-1, -1, 1);
    // scene.add(directionalLight);

    // 添加orbitControls
    // var controls = new OrbitControls(camera, renderer.domElement);
    // g.controls = controls;

    // const gridHelper = new THREE.GridHelper(20, 20);
    // gridHelper.rotateX(Math.PI / 2);
    // scene.add(gridHelper);

    // const axesHelper = new THREE.AxesHelper(2);
    // scene.add(axesHelper);

    g.raycaster = new THREE.Raycaster();
}

function createWall(position, size, color) {
    const wallShape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    const wallBody = new CANNON.Body({
        mass: 0, // 墙体是静态的
        position: position,
        shape: wallShape,
        material: g.groundMaterial
    });
    g.world.addBody(wallBody);

    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshPhongMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    g.scene.add(mesh);

    wallBody.obj = mesh
    mesh.body = wallBody

}

function initWorld() {
    g.world.gravity.set(0, 0, -10);

    g.groundMaterial = new CANNON.Material({ friction: 0.06, restitution: 0.2 });
    g.snakeMaterial = new CANNON.Material({ friction: 0.00, restitution: 0.2 });
    g.cubeMaterial = new CANNON.Material({ friction: 0.06, restitution: 0.2 });

    createWall(new CANNON.Vec3(0, g.border.maxY + 0.5, -0.25), { x: g.border.maxX - g.border.minX, y: 1, z: 1 }, "#3f72af");
    createWall(new CANNON.Vec3(0, g.border.minY - 0.5, -0.25), { x: g.border.maxX - g.border.minX, y: 1, z: 1 }, "#3f72af");

    createWall(new CANNON.Vec3(g.border.minX - 0.5, 0, -0.25), { x: 1, y: g.border.maxY - g.border.minY + 2, z: 1 }, "#3f72af");
    createWall(new CANNON.Vec3(g.border.maxX + 0.5, 0, -0.25), { x: 1, y: g.border.maxY - g.border.minY + 2, z: 1 }, "#3f72af");

    createWall(new CANNON.Vec3(0, 0, -0.75), { x: g.border.maxX - g.border.minX, y: g.border.maxY - g.border.minY + 2, z: 1 }, "#00b8a9");
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
    g.keys = {};
    g.preKeys = {};

    await initAssets();
    initThreeScene();
    initWorld();
    initGame();
    onRequestAnimationFrame();

    // 在文档级别添加鼠标事件监听器
    document.addEventListener('pointerdown', onpointerdown);
    document.addEventListener('pointermove', onpointermove);
    document.addEventListener('pointerup', onpointerup);
    document.addEventListener('keydown', onkeydown);
    document.addEventListener('keyup', onkeyup);
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