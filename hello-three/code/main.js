import * as THREE from "three";
import { OrbitControls } from "OrbitControls";
import * as TWEEN from "TWEEN";
import { GameLogic } from "./GameLogic.js";
import { ResLoader } from "./ResLoader.js";
import { ThreeHelper } from "./ThreeHelper.js";

const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas, alpha: true, premultipliedAlpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setClearColor(new THREE.Color(0x999999));

const scene = new THREE.Scene();
const root = new THREE.Object3D();
scene.add(root);

let camera = null;
{
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = 11.5;
    camera.position.y = 11.5;
    camera.position.z = -3.5;
}

const light = new THREE.AmbientLight(0x808080);
scene.add(light);

const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// 使用OrbitControls创建控制器
const controls = new OrbitControls(camera, renderer.domElement);
// controls.target = new THREE.Vector3(4, -0.6, -6);
controls.update();

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

function animate() {
    TWEEN.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// 当浏览器窗口大小变化时，更新相机和渲染器大小
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

window.renderer = renderer;
window.scene = scene;
window.root = root;
window.canvas = canvas;
window.camera = camera;
window.controls = controls;
window.THREE = THREE;
window.TWEEN = TWEEN;
window.ResLoader = ResLoader;
window.ThreeHelper = ThreeHelper;
window.logic = new GameLogic();
