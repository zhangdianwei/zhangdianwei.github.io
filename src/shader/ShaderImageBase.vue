<script setup>
import { computed, onMounted, ref, nextTick, watch, shallowRef } from "vue";
import { OrbitControls } from '@tresjs/cientos'

import { EditorView, basicSetup } from "codemirror"
import { cpp } from "@codemirror/lang-cpp"

import { TresCanvas, useRenderLoop } from '@tresjs/core'
import { useTexture } from '@tresjs/core'
const { onLoop } = useRenderLoop()

const Data = [
    {
        name: "显示图像",
        children: [
            {
                name: "显示图像",
                frag: `
varying vec2 UV;
uniform sampler2D u_tex0;
void main() {
    vec4 color = texture2D(u_tex0, UV);
    gl_FragColor = color;
}
`
            },
            {
                name: "图像变色",
                frag: `
varying vec2 UV;
uniform sampler2D u_tex0;
uniform float u_time;
void main() {
    vec4 color = texture2D(u_tex0, UV);
    float scale = abs(sin(u_time));
    scale *= 1.5;
    color.rgb *= scale;
    gl_FragColor = color;
}
`
            },
            {
                name: "图像置灰",
                frag: `
varying vec2 UV;
uniform sampler2D u_tex0;
uniform float u_time;
void main() {
    vec4 color = texture2D(u_tex0, UV);
    float gray = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
    gl_FragColor = vec4(gray, gray, gray, color.a);
}
`
            },
            {
                name: "图像描边",
                frag: `
varying vec2 UV;
uniform sampler2D u_tex0;
uniform float u_time;

void main() {
    vec4 self = texture2D(u_tex0, UV);

    if(self.a>0.5){
        gl_FragColor = self;
        return;
    }

    float outlineW = abs(sin(u_time))*0.01;
    // outlineW = 0.01;

    int strokeCount = 0;
    strokeCount += texture2D(u_tex0, vec2(UV.x-outlineW, UV.y)).a>0.0 ? 1 : 0;
    strokeCount += texture2D(u_tex0, vec2(UV.x+outlineW, UV.y)).a>0.0 ? 1 : 0;
    strokeCount += texture2D(u_tex0, vec2(UV.x, UV.y-outlineW)).a>0.0 ? 1 : 0;
    strokeCount += texture2D(u_tex0, vec2(UV.x, UV.y+outlineW)).a>0.0 ? 1 : 0;

    if (strokeCount>0){
        self.rgb = vec3(1.0, 0.0, 1.0);
        self.a = 1.0;
    }

    gl_FragColor = self;
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
void main() {
  gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
}
`;

const uniforms = {
    u_time: { value: 0.0 },
    u_resolution: { value: { x: 800, y: 600 } },
    u_tex0: { value: null },
}
onLoop(({ elapsed }) => {
    uniforms.u_time.value = elapsed;
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

    uniforms.u_resolution.value.x = tresCanvasParentRef.value.clientWidth;
    uniforms.u_resolution.value.y = tresCanvasParentRef.value.clientHeight;

    useTexture({
        map: 'img/img1.png'
    }).then((res) => {
        uniforms.u_tex0.value = res.map;
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
        <Col :span="10">
        <div ref="tresCanvasParentRef" class="tresCanvasBorder">
            <TresCanvas clear-color="#FDF5E6">
                <TresPerspectiveCamera :position="[0, 0, 5]"></TresPerspectiveCamera>
                <TresAxesHelper :args="[2]"></TresAxesHelper>
                <TresMesh>
                    <TresBoxGeometry :args="[2, 3.6, 2]" />
                    <TresShaderMaterial ref="materialRef" :uniforms="uniforms" :vertexShader="CommonVert"
                        :fragmentShader="CommonFrag" />
                </TresMesh>
                <OrbitControls />
            </TresCanvas>
        </div>
        </Col>
        <Col :span="10">
        <!-- <Checkbox v-model="showAxesHelper">是否显示坐标系</Checkbox> -->
        <Divider orientation="left">顶点着色器</Divider>
        <div ref="codeContainerV"></div>
        <Divider orientation="left">片段着色器</Divider>
        <div ref="codeContainerF"></div>
        </Col>
    </Row>
</template>

<style lang="css" scoped>
.tresCanvasBorder {
    border: 1px solid black;
    width: 100%;
    height: 500px;
    /* aspect-ratio: 1; */
}
</style>