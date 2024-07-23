<script setup>
import KonvaStage from "../konva/KonvaStage.vue";
import { ref, onMounted, computed } from "vue";

const width = ref(130);
const height = ref(100);
const alpha = ref(60);

const rows = ref(4);
const cols = ref(10);

const shapes = computed(() => {
    var ret = [];
    const w = width.value;
    const h = height.value;
    const a = alpha.value * Math.PI / 180;
    const sinA = Math.sin(a);
    const cosA = Math.cos(a);
    for (let r = 0; r < rows.value; r++) {
        for (let c = 0; c < cols.value; c++) {
            let data = null;
            let x1, y1, x2, y2, x3, y3, x4, y4;

            x1 = w * c + w / 2;
            y1 = h * r;
            x2 = x1 + w / 2;
            y2 = y1 + h / 2;
            x3 = x1;
            y3 = y1 + h;
            x4 = w * c;
            y4 = y2;

            x1 -= w * Math.floor(c / 2);
            x2 -= w * Math.floor(c / 2);
            x3 -= w * Math.floor(c / 2);
            x4 -= w * Math.floor(c / 2);

            if (c % 2 == 1) {
                x1 -= w / 2;
                x2 -= w / 2;
                x3 -= w / 2;
                x4 -= w / 2;
                y1 += h / 2;
                y2 += h / 2;
                y3 += h / 2;
                y4 += h / 2;
            }

            y1 *= -1;
            y2 *= -1;
            y3 *= -1;
            y4 *= -1;
            data = {
                type: "Line",
                points: [x1, y1, x2, y2, x3, y3, x4, y4],
                fill: '#c9ada7',
                stroke: 'black',
                strokeWidth: 1,
                closed: true,
                name: `${r}_${c} line`,
                id: `${r}_${c}`,
            }
            ret.push(data);

            var text = {
                type: "Text",
                text: `(${r},${c})`,
                x: x4,
                y: y2,
                align: 'center',
                width: w,
                height: h,
            }
            ret.push(text);
        }
    }
    return ret;
});

const arrows = computed(() => {
    return [
        {
            type: "Arrow",
            points: [0, 0, width.value * cols.value / 2, 0],
            pointerLength: 20,
            pointerWidth: 20,
            fill: 'black',
            stroke: 'red',
            strokeWidth: 4
        },
        {
            type: "Arrow",
            points: [0, 0, 0, -height.value * rows.value],
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
            oldSelect.fill("#c9ada7");
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
        <Col :span="4">
        <Form :label-width="100">
            <FormItem label="地块主边(px)">
                <Slider v-model="width" :min="50" :max="200" :show-input="true"></Slider>
            </FormItem>
            <FormItem label="地块次边(px)">
                <Slider v-model="height" :min="50" :max="200" :show-input="true"></Slider>
            </FormItem>
            <FormItem label="行 / 列">
                <InputNumber v-model="rows"></InputNumber>
                <InputNumber v-model="cols"></InputNumber>
            </FormItem>
        </Form>
        </Col>
    </Row>
</template>