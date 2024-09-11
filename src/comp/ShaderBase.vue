<script setup>
import { computed, onMounted, ref, nextTick, watch, shallowRef } from "vue";
import { OrbitControls } from '@tresjs/cientos'

import { EditorView, basicSetup } from "codemirror"
import { cpp } from "@codemirror/lang-cpp"

import { Mesh, BoxGeometry, ShaderMaterial } from 'three'

const Data = [
    {
        name: "渐变和切变",
        children: [
            { name: "普通渐变1", vert: null, frag: null },
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
  gl_FragColor = vec4(0.5, 0.0, 0.0, 1.0);
}
`;
const CommonFrag2 = `
precision mediump float;
void main() {
  gl_FragColor = vec4(0.5, 0.5, 0.0, 1.0);
}
`;

const uniforms = {
    uTime: { value: 0 },
}
const vertexShader = ref(CommonVert);
const fragmentShader = ref(CommonFrag);

const showAxesHelper = ref(true);
const materialRef = shallowRef(null);

const codeContainerV = ref(null);
let codeViewV = null;
const codeContainerF = ref(null);
let codeViewF = null;
onMounted(() => {
    const onVertCodeChanged = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            let material = materialRef.value;
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

function formatCode(code) {
    return code.trim();
}

function onClickItem(cat, item) {
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

const geometry = new BoxGeometry(2, 2, 2)
const material = new ShaderMaterial({ uniforms, vertexShader: vertexShader.value, fragmentShader: fragmentShader.value })
let object = new Mesh(geometry, material);

</script>

<template>
    <Row>
        <Col :span="4">
        <Card v-for="cat in Data">
            <template #title>
                <!-- <Icon type="md-desktop" /> -->
                <h3>{{ cat.name }}</h3>
            </template>
            <Button v-for="item in cat.children" @click="onClickItem(cat, item)">{{ item.name }}</Button>
        </Card>
        </Col>
        <Col :span="12">
        <TresCanvas clear-color="#FDF5E6">
            <TresPerspectiveCamera :position="[0, 5, 5]" :rotation="[0, 0, 0]"></TresPerspectiveCamera>
            <TresAxesHelper v-if="showAxesHelper"></TresAxesHelper>
            <TresMesh>
                <TresBoxGeometry :args="[2, 2, 2]" />
                <TresShaderMaterial ref="materialRef" :uniforms="uniforms" :vertexShader="vertexShader"
                    :fragmentShader="fragmentShader" />
            </TresMesh>
            <!-- <primitive v-if="object" :object="object" /> -->
            <OrbitControls />
        </TresCanvas>

        </Col>
        <Col :span="8">
        <Checkbox v-model="showAxesHelper">是否显示坐标系</Checkbox>
        <Divider orientation="left">顶点着色器</Divider>
        <div ref="codeContainerV"></div>
        <Divider orientation="left">片段着色器</Divider>
        <div ref="codeContainerF"></div>
        </Col>
    </Row>
</template>
