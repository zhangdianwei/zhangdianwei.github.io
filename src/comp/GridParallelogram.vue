<script setup>
import KonvaStage from "../konva/KonvaStage.vue";
import { ref, onMounted, computed } from "vue";

const width = ref(100);
const height = ref(100);
const alpha = ref(60);

const rows = ref(4);
const cols = ref(5);

const shapes = computed(() => {
    var ret = [];
    const w = width.value;
    const h = height.value;
    const a = alpha.value * Math.PI / 180;
    for (let r = 0; r < rows.value; r++) {
        for (let c = 0; c < cols.value; c++) {
            const x1 = w * c + r * h * Math.cos(a);
            const y1 = h * Math.sin(a) * r;
            const x2 = x1 + w;
            const y2 = y1;
            const x3 = x2 + h * Math.cos(a);
            const y3 = (r + 1) * h * Math.sin(a);
            const x4 = x1 + h * Math.cos(a);
            const y4 = y3;
            const data = {
                type: "Line",
                points: [x1, y1, x2, y2, x3, y3, x4, y4],
                fill: '#00D2FF',
                stroke: 'black',
                strokeWidth: 1,
                closed: true,
                name: `${r}_${c} line`,
            }
            ret.push(data);
        }
    }
    return ret;
});

const arrows = computed(() => {
    return [
        {
            type: "Arrow",
            points: [0, 0, width.value * cols.value, 0],
            pointerLength: 20,
            pointerWidth: 20,
            fill: 'black',
            stroke: 'red',
            strokeWidth: 4
        },
        {
            type: "Arrow",
            points: [0, 0, 0, height.value * rows.value],
            pointerLength: 20,
            pointerWidth: 20,
            fill: 'black',
            stroke: 'green',
            strokeWidth: 4
        },
    ]
})

const stageRef = ref(null);
const stageData = ref({
    container: "container",
    draggable: true,
    x: 100,
    y: 600,
    scaleY: -1,
    children: [
        {
            type: "Layer",
            children: shapes,
        },
        {
            type: "Layer",
            children: arrows,
        }
    ]
});

onMounted(() => {
    window.shapes = shapes;
    var stage = stageRef.value.getObject(stageData.value);

    var oldSelect = null;
    stage.on('mousemove', (evt) => {
        if (oldSelect) {
            oldSelect.fill("#00D2FF");
        }
        if (evt.target.hasName("line")) {
            evt.target.fill("red");
            oldSelect = evt.target;
        }
    });
});

</script>

<template>
    <Row>
        <Col :span="12">
        <div id="container" style="background-color:antiquewhite; height: 80vh;">
            <KonvaStage ref="stageRef" v-model="stageData"></KonvaStage>
        </div>
        </Col>
        <Col :span="12">
        <Form :label-width="100">
            <FormItem label="width">
                <InputNumber v-model="width"></InputNumber>
            </FormItem>
            <FormItem label="height">
                <InputNumber v-model="height"></InputNumber>
            </FormItem>
            <FormItem label="alpha">
                <InputNumber v-model="alpha"></InputNumber>
            </FormItem>
            <FormItem label="rows">
                <InputNumber v-model="rows"></InputNumber>
            </FormItem>
            <FormItem label="cols">
                <InputNumber v-model="cols"></InputNumber>
            </FormItem>
        </Form>
        </Col>
    </Row>
</template>