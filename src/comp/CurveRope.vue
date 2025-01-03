<script setup>

import { OrbitControls } from '@tresjs/cientos'
import { reactive, ref, shallowRef, watch } from 'vue';
import { Plane, Raycaster, LineSegments, WireframeGeometry, TextureLoader, ArrowHelper, Vector3, CanvasTexture, SpriteMaterial, Sprite, QuadraticBezierCurve, Points, Vector2, BufferGeometry, LineBasicMaterial, Line, Mesh, BufferAttribute, MeshBasicMaterial, PointsMaterial } from 'three';

const canvasRef = shallowRef(null);
const curveRef = shallowRef(null);
const cameraRef = shallowRef(null);

const textureLoader = new TextureLoader();
let textureRope = textureLoader.load('img/rope3.png');
var ropeMaterial = new MeshBasicMaterial({ map: textureRope });

const controlPointsRef = shallowRef(null);
let activeControlPoint = -1;
let raycaster = new Raycaster();

let controlPoints = reactive([
    new Vector3(0, -8, 0),
    new Vector3(0, 2, 0),
    new Vector3(0, 8, 0),
]);

function visualizeTangent(point, tangent, length = 1, color = 0xff0000) {
    const arrowHelper = new ArrowHelper(
        tangent.normalize(),
        point,
        length,
        color
    );
    curveRef.value.add(arrowHelper);
    return arrowHelper;
}

function refreshCurve() {
    const curve = new QuadraticBezierCurve(...controlPoints);
    const curveLength = curve.getLength();
    console.log("curveLength", curveLength);

    const segCount = 30;
    var vertices = []
    var uvs = [];
    for (let i = 0; i < segCount; i++) {
        let ratio1 = i / segCount;
        let point1 = curve.getPointAt(ratio1);
        let tagent1 = curve.getTangentAt(ratio1);
        let normal1 = new Vector2(-tagent1.y, tagent1.x).normalize();

        let ratio2 = (i + 1) / segCount;
        let point2 = curve.getPointAt(ratio2);
        let tagent2 = curve.getTangentAt(ratio2);
        let normal2 = new Vector2(-tagent2.y, tagent2.x).normalize();

        if (0) {
            visualizeTangent(new Vector3(point1.x, point1.y, 0), new Vector3(tagent1.x, tagent1.y, 0), 3, 0x00ff00);
            visualizeTangent(new Vector3(point2.x, point2.y, 0), new Vector3(tagent2.x, tagent2.y, 0), 3, 0x00ff00);

            visualizeTangent(new Vector3(point1.x, point1.y, 0), new Vector3(normal1.x, normal1.y, 0), 3, 0x0000ff);
            visualizeTangent(new Vector3(point2.x, point2.y, 0), new Vector3(normal2.x, normal2.y, 0), 3, 0x0000ff);
        }

        // console.log(`ratio1=${ratio1}`, `point1`, point1, `normal1`, normal1);

        let rect = [
            point1.clone().add(normal1.clone().multiplyScalar(0.4)),
            point1.clone().sub(normal1.clone().multiplyScalar(0.4)),
            point2.clone().add(normal2.clone().multiplyScalar(0.4)),
            point2.clone().sub(normal2.clone().multiplyScalar(0.4)),
        ];

        vertices.push(rect[0]);
        vertices.push(rect[1]);
        vertices.push(rect[2]);
        vertices.push(rect[1]);
        vertices.push(rect[3]);
        vertices.push(rect[2]);

        let uv1 = 0;
        let uv2 = 1;
        console.log(`ratio1=${ratio1.toFixed(2)}`, `uv1=${(uv1).toFixed(2)}`, `uv2=${uv2.toFixed(2)}`);

        uvs.push(new Vector2(0, uv1));//0
        uvs.push(new Vector2(1, uv1));//1
        uvs.push(new Vector2(0, uv2));//2
        uvs.push(new Vector2(1, uv1));//1
        uvs.push(new Vector2(1, uv2));//3
        uvs.push(new Vector2(0, uv2));//2
    }
    // const trigoIndex = 1;
    // const trigoCount = 1;
    // vertices = new Float32Array(vertices.slice(trigoIndex * 9, trigoIndex * 9 + 9 * trigoCount));
    // console.log("vertices", vertices);

    const buffer_vertices = new Float32Array(vertices.length * 3);
    for (let i = 0; i < vertices.length; i++) {
        buffer_vertices[i * 3] = vertices[i].x;
        buffer_vertices[i * 3 + 1] = vertices[i].y;
        buffer_vertices[i * 3 + 2] = 0;
    }

    const buffer_uvs = new Float32Array(uvs.length * 2);
    for (let i = 0; i < uvs.length; i++) {
        buffer_uvs[i * 2] = uvs[i].x;
        buffer_uvs[i * 2 + 1] = uvs[i].y;
    }

    const indices = [];
    for (let i = 0; i < segCount; i++) {
        indices.push(i * 2);
        indices.push(i * 2 + 1);
        indices.push(i * 2 + 2);

        indices.push(i * 2 + 1);
        indices.push(i * 2 + 3);
        indices.push(i * 2 + 2);
    }

    var geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(buffer_vertices, 3));
    geometry.setAttribute('uv', new BufferAttribute(buffer_uvs, 2));

    while (curveRef.value.children.length > 0) {
        curveRef.value.remove(curveRef.value.children[0]);
    }

    // 曲线
    if (0)
    {
        const points = curve.getPoints(50);
        const geometry = new BufferGeometry().setFromPoints(points);

        const material = new LineBasicMaterial({ color: 0xff0000 });

        //Create the final object to add to the scene
        const curveObject = new Line(geometry, material);
        curveRef.value.add(curveObject);
    }

    // 红色多边形
    if (0) {
        var material = new MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
        var curveObject = new Mesh(geometry, material);
        curveRef.value.add(curveObject);
    }

    // 网格
    if (0) {
        const wireframe = new WireframeGeometry(geometry);
        const line = new LineSegments(
            wireframe,
            new LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 })
        );
        line.position.z = 0.001;
        curveRef.value.add(line);
    }

    // 带纹理
    if (1) {
        var curveObject = new Mesh(geometry, ropeMaterial);
        curveRef.value.add(curveObject);
    }
}

watch(curveRef, () => {
    refreshCurve();
})

function onMouseMove(event) {
    if (activeControlPoint >= 0) {
        let mouse = { x: 0, y: 0 };
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // 更新射线
        raycaster.setFromCamera(mouse, cameraRef.value);

        let plane = new Plane(new Vector3(0, 0, 1), 0); // Z轴朝上的平面，过原点
        // 计算射线与平面的交点
        // intersectPlane方法会将结果存储在传入的向量中
        let planeIntersectPoint = new Vector3();
        if (raycaster.ray.intersectPlane(plane, planeIntersectPoint)) {
            controlPoints[activeControlPoint] = planeIntersectPoint;
        }
        refreshCurve();
    }
}
function onMouseDown(event) {
    let mouse = { x: (event.clientX / window.innerWidth) * 2 - 1, y: -(event.clientY / window.innerHeight) * 2 + 1 };
    raycaster.setFromCamera(mouse, cameraRef.value);

    const intersects = raycaster.intersectObjects(controlPointsRef.value.children);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        const index = controlPointsRef.value.children.indexOf(object);
        activeControlPoint = index;
    }
    else {
        activeControlPoint = -1;
    }
}
function onMouseUp(event) {
    activeControlPoint = -1;
}

</script>

<template>
    <div @mousemove="onMouseMove" @mousedown="onMouseDown" @mouseup="onMouseUp">
        <TresCanvas ref="canvasRef" clear-color="#f9f7f7" window-size>
            <TresPerspectiveCamera ref="cameraRef" :position="[0, 0, 20]" :rotation="[0, 0, 0]"></TresPerspectiveCamera>
            <!-- <OrbitControls /> -->

            <TresAmbientLight :intensity="1" />
            <TresAxesHelper></TresAxesHelper>

            <TresGroup ref="curveRef"></TresGroup>

            <TresGroup ref="controlPointsRef">
                <TresMesh v-for="(point, i) in controlPoints" :key="i" :position="point">
                    <TresSphereGeometry :args="[0.4, 8, 8]"></TresSphereGeometry>
                    <TresMeshBasicMaterial color="red" :transparent="true" :opacity="0.1"></TresMeshBasicMaterial>
                </TresMesh>
            </TresGroup>
        </TresCanvas>
    </div>
</template>