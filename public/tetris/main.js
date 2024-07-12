import * as THREE from "three";
import { RoundedBoxGeometry } from "RoundedBoxGeometry";
import { OrbitControls } from "OrbitControls";
import * as TWEEN from "TWEEN";
import { GameLogic } from "./GameLogic.js";
import { ResLogic } from "./ResLogic.js";

const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas, alpha: true, premultipliedAlpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setClearColor(new THREE.Color(0x999999));

const scene = new THREE.Scene();
{
    const radius = 50;
    const widthSegments = 60;
    const heightSegments = 60;
    let geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const material = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load("background.jpg"),
        // flatShading: true,
        side: THREE.BackSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(7, 5, 10);
    scene.add(mesh);
}

let camera = null;
{
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
}



// const gridHelper = new THREE.GridHelper(10, 10);
// gridHelper.position.set(5, 0, -5);
// scene.add(gridHelper);

var dx = 10, dy = 10, dz = 1;
const geometry = new THREE.BoxGeometry(dx, dy, dz);
const edges = new THREE.EdgesGeometry(geometry);
const material = new THREE.LineBasicMaterial({ color: 0x000000 });
const edgesLine = new THREE.LineSegments(edges, material);
edgesLine.position.x = dx / 2;
edgesLine.position.y = dy / 2;
edgesLine.position.z = -dz / 2;
scene.add(edgesLine);

// 使用OrbitControls创建控制器

camera.position.set(8, 5, 10);

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.update();

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

// 灯光
const light = new THREE.DirectionalLight(0xFFFFFF, 1.5);
light.position.set(6, 10, 8);
light.target.position.set(0, 0, 0);
scene.add(light);
scene.add(light.target);

var pointLight = new THREE.PointLight(0xFF0000, 5.0, 8);
pointLight.position.set(5, 5, 2);
scene.add(pointLight);

// var pointLightHelper = new THREE.PointLightHelper(pointLight);
// scene.add(pointLightHelper);

function animate() {
    TWEEN.update();

    {
        var now = Date.now() / 3000;
        pointLight.position.x = Math.cos(now) * 8 + 5;
        pointLight.position.y = Math.sin(now) * 8 + 5;
    }

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

window.game = {
    scene,
    camera,
    renderer,
    canvas,
    // controls,
};

window.THREE = THREE;
window.TWEEN = TWEEN;
window.RoundedBoxGeometry = RoundedBoxGeometry;
window.game.logic = new GameLogic();
window.game.res = new ResLogic();

window.game.res.startLoad();

// var res_progress = document.getElementById("res_progress");
// res_progress.style.display = "block";
// window.game.res.onProgress = function () {
//     res_progress.value = window.game.res.getLoadedCount() / window.game.res.getTotalCount() * 100;
// };
window.game.res.onFinish = function () {
    openDialog("dialog_startgame")
};