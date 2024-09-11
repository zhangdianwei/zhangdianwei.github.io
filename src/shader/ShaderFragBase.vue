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
uniform vec2 u_resolution;
varying vec2 UV;
void main() {
    vec2 st = UV;
    float c = st.x;
    gl_FragColor = vec4(c, c, c, 1.0);
}
`},
            {
                name: "普通渐变2",
                frag: `
uniform vec2 u_resolution;
varying vec2 UV;
void main() {
    vec2 st = UV;
    float c = 1.0-st.x-st.y; //写出渐变方程
    c = abs(c);
    gl_FragColor = vec4(c, c, c, 1.0);
}

                `
            },
            {
                name: "普通渐变3",
                frag: `
uniform vec2 u_resolution;
varying vec2 UV;
void main() {
    vec2 st = UV;
    float c = st.x*st.x*st.x-st.y; //写出渐变方程
    c = abs(c);
    gl_FragColor = vec4(c, c, c, 1.0);
}

                `
            },
            {
                name: "普通渐变4",
                frag: `
uniform vec2 u_resolution;
varying vec2 UV;
void main() {
    vec2 st = UV;
    float c = (st.x-0.5)*2.0;
    c = abs(c);
    gl_FragColor = vec4(0.0, c, 0.0, 1.0);
}
`
            },
            {
                name: "普通渐变5",
                frag: `
uniform vec2 u_resolution;
varying vec2 UV;
void main() {
    vec2 st = UV;
    float c = 1.0-distance(st, vec2(0.5))*1.0;
    gl_FragColor = vec4(0.0, c, c, 1.0);
}
`
            },
        ]
    },
    {
        name: "渐变和切变，可以用于边缘平滑",
        children: [
            {
                name: "渐变和切变1",
                frag: `
uniform vec2 u_resolution;

varying vec2 UV;
void main() {
    vec2 st = UV;
    
    float c = distance(st, vec2(0.5))*2.0;
    c = smoothstep(0.8, 0.9, c);
    
    gl_FragColor = vec4(c, c, c, 1.0);
}
`
            },
            {
                name: "渐变和切变2",
                frag: `

uniform vec2 u_resolution;

varying vec2 UV;
void main() {
    vec2 st = UV;
    
    float c = st.x*st.x*st.x-st.y;
    c = abs(c);
    c = smoothstep(0.005, 0.015, c);

    gl_FragColor = vec4(c, c, c, 1.0);
}

`
            },
            {
                name: "颜色混合(颜色渐变)",
                frag: `
uniform vec2 u_resolution;

varying vec2 UV;
void main() {
    vec2 st = UV;
    
    float c = st.x*st.y;
    vec3 color = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), c);
    
    gl_FragColor = vec4(color, 1.0);
}
`
            },
        ]
    },
    {
        name: "重复图形",
        children: [
            {
                name: "重复图形1",
                frag: `
uniform vec2 u_resolution;

varying vec2 UV;
void main() {
    vec2 st = UV;
    st *= 3.0;

    vec2 c = floor(st)*0.5;
    
    gl_FragColor = vec4(c, 0.0, 1.0);
}

`
            },
            {
                name: "重复图形2",
                frag: `
uniform vec2 u_resolution;

varying vec2 UV;
void main() {
    vec2 st = UV;
    st *= 3.0;

    vec2 c = fract(st);
    
    gl_FragColor = vec4(c, 0.0, 1.0);
}

`
            },
            {
                name: "重复图形3",
                frag: `

uniform vec2 u_resolution;

varying vec2 UV;
void main() {
    vec2 st = UV;
    st *= 3.0;

    vec2 center = 0.5+floor(st);
    float c = distance(st, center)*2.0;
    
    gl_FragColor = vec4(c, c, c, 1.0);
}
`
            },
        ]
    },
    {
        name: "简单动画",
        children: [
            {
                name: "平移动画",
                frag: `
uniform vec2 u_resolution;
uniform float u_time;

varying vec2 UV;
void main() {
    vec2 st = UV;
    st.x -= fract(u_time*0.2)*2.0-1.0;

    float c = distance(st, vec2(0.5))*2.0;
    c = step(0.5, c);

    gl_FragColor = vec4(c, c, c, 1.0);
}
`
            },
            {
                name: "缩放动画",
                frag: `
uniform vec2 u_resolution;
uniform float u_time;

varying vec2 UV;
void main() {
    vec2 st = UV;
    st -= 0.5;
    st /= sin(u_time);

    float c = distance(st, vec2(0.0))*2.0;
    c = step(1.0, c);

    gl_FragColor = vec4(c, c, c, 1.0);
}
`
            },
            {
                name: "旋转动画",
                frag: `
uniform vec2 u_resolution;
uniform float u_time;

varying vec2 UV;
void main() {
    vec2 st = UV;
    st -= 0.5;
    float theta = mod(u_time, 6.28);
    st = mat2(cos(theta), sin(theta), -sin(theta), cos(theta)) * st; //构造了一个绕Z轴的旋转矩阵

    float c = st.x;
    c = abs(c);
    c = step(0.05, c);

    gl_FragColor = vec4(c, c, c, 1.0);
}
`
            },
        ]
    },
];

const CommonVert = `
varying vec2 UV;
void main() {
    UV = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );
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
        <div ref="tresCanvasParentRef" class="tresCanvasBorder">
            <TresCanvas clear-color="#FDF5E6">
                <TresPerspectiveCamera :position="[0, 0, 5]"></TresPerspectiveCamera>
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

<style lang="css">
.tresCanvasBorder {
    border: 1px solid black;
    width: 100%;
    height: 100%;
    /* aspect-ratio: 1; */
}
</style>