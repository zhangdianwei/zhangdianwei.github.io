<script setup>
import KonvaStage from "./KonvaStage.vue"
import { onMounted, ref, shallowRef } from "vue"

const shapes = ref([
    {
        type: "Rect",
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        fill: "red",
        draggable: true,
    }
]);
const stageConfig = ref({
    type: 'Stage',
    container: 'container',
    'wheel': true,
    children: [
        {
            type: "Layer",
            children: shapes,
        }
    ]
});
const stageRef = shallowRef(null);

function onClickAddShape(name) {
    if (name == "Rect") {
        shapes.value.push({
            type: "Rect",
            width: 200,
            height: 100,
            fill: "green",
            draggable: true,
        })
    }
    else if (name == "Circle") {
        shapes.value.push({
            type: "Circle",
            radius: 80,
            fill: "green",
            draggable: true,
        })
    }
    else if (name == "Star") {
        shapes.value.push({
            type: "Star",
            innerRadius: 40,
            outerRadius: 70,
            fill: 'yellow',
            stroke: 'black',
            strokeWidth: 4,
            draggable: true,
        })
    }
    console.log(name)
}

onMounted(() => {
    var stage = stageRef.value.getObject(stageConfig.value);
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

        var scaleBy = 1.1;
        var newScale = direction < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        stage.scale({ x: newScale, y: newScale });

        var newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };
        stage.position(newPos);
    });
});

</script>

<template>
    <Row>
        <Col :span="12">
        <div id="container" style="background-color: antiquewhite; height: 80vh;">
            <KonvaStage ref="stageRef" v-model="stageConfig"></KonvaStage>
        </div>
        </Col>
        <Col :span="12">
        <Form :label-width="100">
            <FormItem label="添加">
                <Space>
                    <Dropdown @on-click="onClickAddShape">
                        <Button type="primary">
                            添加图形
                            <Icon type="ios-arrow-down"></Icon>
                        </Button>
                        <template #list>
                            <DropdownMenu>
                                <DropdownItem name="Rect">矩形</DropdownItem>
                                <DropdownItem name="Circle">圆形</DropdownItem>
                                <DropdownItem name="Star">星形</DropdownItem>
                            </DropdownMenu>
                        </template>
                    </Dropdown>
                    <!-- <Button type="primary">删除图形</Button> -->
                </Space>
            </FormItem>
            <Divider></Divider>
            <FormItem label="x/y" v-for="child in shapes">
                <InputNumber v-model="child.x"></InputNumber>
                <InputNumber v-model="child.y"></InputNumber>
            </FormItem>
        </Form>
        </Col>
    </Row>
</template>