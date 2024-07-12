<script setup>
import { onMounted, readonly, ref } from "vue";
import { Transformer } from "konva"
import VueKonva from 'vue-konva'


const SW = 800;
const SH = 600;

const coordConfig = ref({
    stageConfig: {
        width: SW,
        height: SH,
        fill: "black",
    },
    backgroundConfig: {
        x: 0,
        y: 0,
        width: SW,
        height: SH,
        fill: "#fefae0",
        stroke: "black",
        strokeWidth: 1,
    },
    rectConfig: {
        x: 100,
        y: 100,
        gx: 100,
        gy: 100,
        width: 200,
        height: 100,
        offsetX: 0,
        offsetY: 0,
        fill: "#dda15e",
        opacity: 0.8,
        stroke: "black",
        name: "rect",
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        shadowColor: "#A78EEB",
        shadowOffset: { x: 3, y: 3 },
        shadowBlur: 3,
        lineJoin: "miter",
        draggable: true,
    },
});

const myRectRef = ref(null);
const myStageRef = ref(null);
const myLayerRef = ref(null);

function onAnimationFrame() {
    if (!myRectRef.value) {
        return;
    }
    var myrect = myRectRef.value.getNode();
    coordConfig.value.rectConfig.x = myrect.x();
    coordConfig.value.rectConfig.y = myrect.y();
    coordConfig.value.rectConfig.gx = myrect.absolutePosition().x;
    coordConfig.value.rectConfig.gy = myrect.absolutePosition().y;
    coordConfig.value.rectConfig.offsetX = myrect.offsetX();
    coordConfig.value.rectConfig.offsetY = myrect.offsetY();
    coordConfig.value.rectConfig.width = myrect.width();
    coordConfig.value.rectConfig.height = myrect.height();
    coordConfig.value.rectConfig.rotation = myrect.rotation();
    coordConfig.value.rectConfig.rotation = myrect.rotation();
    coordConfig.value.rectConfig.scaleX = myrect.scaleX();
    coordConfig.value.rectConfig.scaleY = myrect.scaleY();

    requestAnimationFrame(onAnimationFrame);
}

onMounted(() => {
    requestAnimationFrame(onAnimationFrame);

    var stage = myStageRef.value.getNode();
    var layer = myLayerRef.value.getNode();

    stage.on('click tap', function (e) {

        if (!e.target.hasName('rect')) {
            stage.findOne('Transformer')?.destroy();
            layer.draw();
            return;
        }

        stage.findOne('Transformer')?.destroy();

        var tr = new Transformer();
        layer.add(tr);
        tr.nodes([e.target]);
        layer.draw();
    });

    window.stage = stage;
    window.coordConfig = coordConfig;
    window.VueKonva = VueKonva;
})

</script>

<template>
    <Card>
        <template #title>
            <h1>坐标系展示</h1>
        </template>
        <Row>
            <Col>
            <div>
                <v-stage ref="myStageRef" :config="coordConfig.stageConfig">
                    <v-layer ref="myLayerRef">
                        <v-rect :config="coordConfig.backgroundConfig"></v-rect>
                        <v-arrow :config="{ points: [0, 0, SW, 0], fill: 'black', stroke: 'black' }"></v-arrow>
                        <v-arrow :config="{ points: [0, 0, 0, SH], fill: 'black', stroke: 'black' }"></v-arrow>
                        <v-rect ref="myRectRef" :config="coordConfig.rectConfig" :__useStrictMode="true"></v-rect>
                    </v-layer>
                </v-stage>
            </div>
            </Col>
            <Col>
            <div>
                <Row>
                    <Col>

                    <Divider>基础</Divider>

                    <Row>
                        <div class="mylabel">坐标(x,y)</div>
                        <InputNumber v-model="coordConfig.rectConfig.x" :step="10"></InputNumber>
                        <InputNumber v-model="coordConfig.rectConfig.y" :step="10"></InputNumber>
                    </Row>

                    <Row>
                        <div class="mylabel">全局坐标(x,y)</div>
                        <InputNumber v-model="coordConfig.rectConfig.gx" :readonly="true"></InputNumber>
                        <InputNumber v-model="coordConfig.rectConfig.gy" :readonly="true"></InputNumber>
                    </Row>

                    <Row>
                        <div class="mylabel">锚点(offset)</div>
                        <InputNumber v-model="coordConfig.rectConfig.offsetX" :step="10"></InputNumber>
                        <InputNumber v-model="coordConfig.rectConfig.offsetY" :step="10"></InputNumber>
                    </Row>

                    <Row>
                        <div class="mylabel">尺寸(w,h)</div>
                        <InputNumber v-model="coordConfig.rectConfig.width" :step="10"></InputNumber>
                        <InputNumber v-model="coordConfig.rectConfig.height" :step="10"></InputNumber>
                    </Row>

                    <Row>
                        <div class="mylabel">旋转角度</div>
                        <InputNumber v-model="coordConfig.rectConfig.rotation" :step="10"></InputNumber>
                    </Row>

                    <Row>
                        <div class="mylabel">缩放(scale)</div>
                        <InputNumber v-model="coordConfig.rectConfig.scaleX" :step="0.1"></InputNumber>
                        <InputNumber v-model="coordConfig.rectConfig.scaleY" :step="0.1"></InputNumber>
                    </Row>

                    <Row>
                        <div class="mylabel">透明度(0-1)</div>
                        <Slider v-model="coordConfig.rectConfig.opacity" :min="0" :max="1" :step="0.05"
                            style="width: 160px;">
                        </Slider>
                    </Row>

                    <Divider>阴影</Divider>

                    <Row>
                        <div class="mylabel">颜色</div>
                        <ColorPicker v-model="coordConfig.rectConfig.shadowColor"></ColorPicker>
                    </Row>

                    <Row>
                        <div class="mylabel">shadowOffset</div>
                        <InputNumber v-model="coordConfig.rectConfig.shadowOffsetX"></InputNumber>
                        <InputNumber v-model="coordConfig.rectConfig.shadowOffsetY"></InputNumber>
                    </Row>

                    <Row>
                        <div class="mylabel">shadowBlur</div>
                        <InputNumber v-model="coordConfig.rectConfig.shadowBlur"></InputNumber>
                    </Row>

                    <Divider>边角</Divider>

                    <Row>
                        <div class="mylabel">lineJoin</div>
                        <Select v-model="coordConfig.rectConfig.lineJoin" style="width: 160px;">
                            <Option value="miter">miter</Option>
                            <Option value="bevel">bevel</Option>
                            <Option value="round">round</Option>
                        </Select>
                    </Row>

                    </Col>
                </Row>

            </div>
            </Col>
        </Row>

    </Card>




</template>

<style>
.mylabel {
    background-color: antiquewhite;
    display: flex;
    align-items: center;
    justify-content: right;
    width: 100px;
}
</style>