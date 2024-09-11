<script setup>
import { computed, onMounted, ref, nextTick, watch, shallowRef } from "vue";
import { OrbitControls } from '@tresjs/cientos'

import { EditorView, basicSetup } from "codemirror"
import { cpp } from "@codemirror/lang-cpp"

import { TresCanvas, useRenderLoop } from '@tresjs/core'
const { onLoop } = useRenderLoop()

const Data = [
    {
        name: "渐变和切变",
        children: [
            {
                name: "普通渐变1",
                frag: `
uniform float u_time;
uniform vec2 u_resolution;
void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    float c = st.x;
    gl_FragColor = vec4(c, 0.0, 0.0, 1.0);
}
`},
            { name: "普通渐变2", vert: null, frag: null },
            { name: "普通渐变3", vert: null, frag: null },
            { name: "普通渐变4", vert: null, frag: null },
            { name: "普通渐变5", vert: null, frag: null },
        ]
    },
    {
        name: "渐变和切变，可以用于边缘平滑",
        children: [
            { name: "渐变和切变1", vert: null, frag: null },
            { name: "渐变和切变2", vert: null, frag: null },
            { name: "颜色混合(颜色渐变)", vert: null, frag: null },
        ]
    },
    {
        name: "重复图形",
        children: [
            { name: "重复图形1", vert: null, frag: null },
            { name: "重复图形2", vert: null, frag: null },
            { name: "重复图形3", vert: null, frag: null },
        ]
    },
    {
        name: "简单动画",
        children: [
            { name: "平移动画", vert: null, frag: null },
            { name: "缩放动画", vert: null, frag: null },
            { name: "旋转动画", vert: null, frag: null },
        ]
    },
];

const CommonVert = `
void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
}
`;
const CommonFrag = `
precision mediump float;
void main() {
  gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
}
`;

const uniforms = {
    u_time: { value: 0.0 },
    u_resolution: { value: { x: 800, y: 600 } },
}
onLoop(({ elapsed }) => {
    if (materialRef.value) {
        materialRef.value.uniforms.u_time.value = elapsed;
        if (tresCanvasParentRef.value) {
            materialRef.value.uniforms.u_resolution.value.x = tresCanvasParentRef.value.clientWidth;
            materialRef.value.uniforms.u_resolution.value.y = tresCanvasParentRef.value.clientHeight;
        }

    }
})

const showAxesHelper = ref(true);
const materialRef = shallowRef(null);
const tresCanvasParentRef = shallowRef(null);

const codeContainerV = ref(null);
let codeViewV = null;
const codeContainerF = ref(null);
let codeViewF = null;
onMounted(() => {
    const onVertCodeChanged = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            let material = materialRef.value;
            if (!material)
                return;
            material.vertexShader = update.state.doc.toString();
            material.needsUpdate = true;
        }
    });
    codeViewV = new EditorView({
        doc: ``,
        extensions: [basicSetup, cpp(), onVertCodeChanged],
        parent: codeContainerV.value,
    });

    const onFragCodeChanged = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            let material = materialRef.value;
            if (!material)
                return;
            material.fragmentShader = update.state.doc.toString();
            material.needsUpdate = true;
        }
    });
    codeViewF = new EditorView({
        doc: ``,
        extensions: [basicSetup, cpp(), onFragCodeChanged],
        parent: codeContainerF.value,
    });
});

watch(materialRef, () => {
    onClickItem(0, 0);
})

function formatCode(code) {
    return code.trim();
}

function onClickItem(catIndex, itemIndex) {
    let cat = Data[catIndex];
    let item = cat.children[itemIndex];

    let vert = item.vert ? item.vert : CommonVert;
    let frag = item.frag ? item.frag : CommonFrag;

    vert = formatCode(vert);
    frag = formatCode(frag);

    let editor = codeViewV;
    let transaction = editor.state.update({
        changes: { from: 0, to: editor.state.doc.length, insert: vert }
    });
    editor.dispatch(transaction);

    editor = codeViewF;
    transaction = editor.state.update({
        changes: { from: 0, to: editor.state.doc.length, insert: frag }
    });
    editor.dispatch(transaction);
}

</script>

<template>
    <Row>
        <Col :span="4">
        <Card v-for="cat, catIndex in Data">
            <template #title>
                <!-- <Icon type="md-desktop" /> -->
                <h3>{{ cat.name }}</h3>
            </template>
            <Button v-for="item, itemIndex in cat.children" @click="onClickItem(catIndex, itemIndex)">{{ item.name
                }}</Button>
        </Card>
        </Col>
        <Col :span="12">
        <div ref="tresCanvasParentRef" style="width: 100%; height: 100%;">
            <TresCanvas clear-color="#FDF5E6">
                <TresPerspectiveCamera :position="[0, 5, 5]" :rotation="[0, 0, 0]"></TresPerspectiveCamera>
                <TresAxesHelper :args="[2]"></TresAxesHelper>
                <TresMesh>
                    <TresBoxGeometry :args="[2, 2, 2]" />
                    <TresShaderMaterial ref="materialRef" :uniforms="uniforms" :vertexShader="CommonVert"
                        :fragmentShader="CommonFrag" />
                </TresMesh>
                <OrbitControls />
            </TresCanvas>
        </div>
        </Col>
        <Col :span="8">
        <!-- <Checkbox v-model="showAxesHelper">是否显示坐标系</Checkbox> -->
        <Divider orientation="left">顶点着色器</Divider>
        <div ref="codeContainerV"></div>
        <Divider orientation="left">片段着色器</Divider>
        <div ref="codeContainerF"></div>
        </Col>
    </Row>
</template>
