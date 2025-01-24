<script setup>
import { onMounted, ref, shallowRef, watch } from "vue";
import * as Konva from 'konva';

const boxParentRef = shallowRef(null);
const boxStageRef = shallowRef(null);
const boxLayerRef = shallowRef(null);
const arrowLayerRef = shallowRef(null);

const boxConfig = ref({
    rows: 5,
    cols: 8,
    boxWidth: 100,
    boxHeight: 50,
    offsetX: -400,
    offsetY: -125,
});
watch(boxConfig.value, () => {
    initBoxStage()
});
const oldSelect = shallowRef(null);

function refreshBoxStage() {
    var layer = boxLayerRef.value.getNode();
    var arrowLayer = arrowLayerRef.value.getNode();
    var children = layer.getChildren();

    for (let r = 0; r < boxConfig.value.rows; r++) {
        for (let c = 0; c < boxConfig.value.cols; c++) {
            var index = r * boxConfig.value.cols + c;
            var box = children[index];
            box.x(c * boxConfig.value.boxWidth + boxConfig.value.offsetX);
            box.y(r * boxConfig.value.boxHeight + boxConfig.value.offsetY);
        }
    }

    var arrowx = arrowLayer.findOne("#arrowx");
    arrowx.points([0, 0, boxConfig.value.boxWidth * boxConfig.value.cols + boxConfig.value.offsetX, 0]);
    var arrowy = arrowLayer.findOne("#arrowy");
    arrowy.points([0, 0, 0, boxConfig.value.boxHeight * boxConfig.value.rows + boxConfig.value.offsetY]);
}

function initBoxStage() {
    var stage = boxStageRef.value.getNode();
    var layer = boxLayerRef.value.getNode();
    var arrowLayer = arrowLayerRef.value.getNode();

    layer.removeChildren();
    arrowLayer.removeChildren();

    for (let r = 0; r < boxConfig.value.rows; r++) {
        for (let c = 0; c < boxConfig.value.cols; c++) {
            var group = new Konva.Group({
                id: `${r}_${c}`
            });
            layer.add(group);

            var box = new Konva.Rect({
                x: 0,
                y: 0,
                width: boxConfig.value.boxWidth,
                height: boxConfig.value.boxHeight,
                // fill: 'green',
                stroke: 'black',
                strokeWidth: 1,
                draggable: true,
                id: "box",
            });
            group.add(box);

            var text = new Konva.Text({
                text: `(${r},${c})`,
                x: 0,
                y: 0,
                width: boxConfig.value.boxWidth,
                height: boxConfig.value.boxHeight,
                align: 'center',
                verticalAlign: "middle",
                id: "text"
            });
            group.add(text);
        }
    }

    var arrowx = new Konva.Arrow({
        x: 0,
        y: 0,
        points: [0, 0, stage.width(), 0],
        pointerLength: 20,
        pointerWidth: 20,
        fill: 'red',
        stroke: 'red',
        strokeWidth: 4,
        id: "arrowx",
    });
    arrowLayer.add(arrowx);

    var arrowy = new Konva.Arrow({
        x: 0,
        y: 0,
        points: [0, 0, 0, stage.height()],
        pointerLength: 20,
        pointerWidth: 20,
        fill: 'green',
        stroke: 'green',
        strokeWidth: 4,
        id: "arrowy",
    });
    arrowLayer.add(arrowy);


    refreshBoxStage();
}

onMounted(() => {
    var stage = boxStageRef.value.getNode();
    var layer = boxLayerRef.value.getNode();

    stage.width(boxParentRef.value.clientWidth);
    stage.height(boxParentRef.value.clientHeight);

    stage.x(boxParentRef.value.clientWidth / 2);
    stage.y(boxParentRef.value.clientHeight / 2);

    window.boxConfig = boxConfig;
    window.stage = stage;
    window.layer = layer;

    initBoxStage();

    stage.on('wheel', (e) => {
        e.evt.preventDefault();

        var oldScale = stage.scaleX();
        var pointer = stage.getPointerPosition();

        var mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        let direction = e.evt.deltaY > 0 ? 1 : -1;
        if (e.evt.ctrlKey) {
            direction = -direction;
        }

        const scaleBy = 1.1;
        var newScale = direction < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        stage.scale({ x: newScale, y: newScale });

        var newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };
        stage.position(newPos);
    });

    stage.on('mousemove', (e) => {
        var mousePos = stage.getPointerPosition();
        var r = Math.floor((mousePos.y - stage.y() - boxConfig.value.offsetY) / boxConfig.value.boxHeight);
        var c = Math.floor((mousePos.x - stage.x() - boxConfig.value.offsetX) / boxConfig.value.boxWidth);
        var group_id = `#${r}_${c}`;

        if (oldSelect.value) {
            var group = layer.findOne(oldSelect.value);
            setGroupSelected(group, false);
        }

        var group = layer.findOne(group_id);
        setGroupSelected(group, true);
        oldSelect.value = group_id;
    });
})

function setGroupSelected(group, select) {
    if (!group) {
        return;
    }
    var box = group.findOne("#box");
    if (select) {
        console.log(box.fill());
        box.fill('red');
    }
    else {
        box.fill(null);
    }
}
</script>

<template>
    <Row>
        <Col :span="18">
        <div class="boxborder" ref="boxParentRef">
            <v-stage ref="boxStageRef" :config="{ width: 100, height: 100, draggable: true }">
                <v-layer ref="arrowLayerRef"></v-layer>
                <v-layer ref="boxLayerRef"></v-layer>
            </v-stage>
        </div>
        </Col>
        <Col :span="6">
        <Form :label-width="100">
            <FormItem label="行 / 列" style="width: 100%;">
                <InputNumber v-model="boxConfig.rows"></InputNumber>
                <InputNumber v-model="boxConfig.cols"></InputNumber>
            </FormItem>
            <FormItem label="单元格宽高">
                <InputNumber v-model="boxConfig.boxWidth"></InputNumber>
                <InputNumber v-model="boxConfig.boxHeight"></InputNumber>
            </FormItem>
            <FormItem label="坐标偏移">
                <InputNumber v-model="boxConfig.offsetX"></InputNumber>
                <InputNumber v-model="boxConfig.offsetY"></InputNumber>
            </FormItem>
        </Form>
        </Col>
    </Row>




</template>

<style scoped>
.boxborder {
    border: 1px solid black;
    background-color: aliceblue;
    height: 100vh;
}
</style>