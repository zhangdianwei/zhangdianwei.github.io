<script setup>
import * as Konva from "konva";
import { onMounted, defineModel, watch, onUnmounted, defineExpose, computed } from "vue";

let _uuid = 0;
function getUUID() {
    _uuid += 1;
    return _uuid;
}

let uuid2konvaObj = {};

function getObject(data) {
    return uuid2konvaObj[data.uuid];
}
function getDataByUUID(data, uuid) {
    if (data.uuid == uuid) {
        return data;
    }
    if (data.children) {
        for (let i = 0; i < data.children.length; i++) {
            const child = data.children[i];
            var cdata = getDataByUUID(child, uuid);
            if (cdata) {
                return cdata;
            }
        }
    }
    return null;
}
defineExpose({
    getObject
});

const model = defineModel();

function createKonvaObj(type, parent, data) {
    var konvaClass = Konva[type];
    var konvaObj = new konvaClass(data);

    konvaObj.uuid = data.uuid;
    uuid2konvaObj[data.uuid] = konvaObj;
    // console.log("createKonvaObj", type);

    if (parent) {
        parent.add(konvaObj);
    }

    bindKonvaObjAndData(konvaObj, data);
    return konvaObj;
}
function bindKonvaObjAndData(konvaObj, data) {
    let attrs = [
        "x",
        "y",
        "width",
        "height",
        "offsetX",
        "offsetY",
        "fill",
        "opacity",
        "stroke",
        "name",
        "rotation",
        "scaleX",
        "scaleY",
        "shadowColor",
        "shadowOffset",
        "shadowBlur",
        "lineJoin",
        "draggable",
    ];

    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        const changeName = `${attr}Change`;
        konvaObj.on(changeName, (evt) => {
            data[attr] = evt.newVal;
        });
    }
}


function createKonvaObjRecursive(type, konvaObjParent, dataParent) {

    var konvaObj = uuid2konvaObj[dataParent.uuid];
    if (!konvaObj) {
        konvaObj = createKonvaObj(type, konvaObjParent, dataParent);
    }
    else {
        konvaObj.setAttrs(dataParent);
    }

    if (dataParent.children) {
        for (let i = 0; i < dataParent.children.length; i++) {
            const data = dataParent.children[i];
            createKonvaObjRecursive(data.type, konvaObj, data);
        }
    }

    return konvaObj;
}

function ensureDataUUID(data) {
    if (!data.uuid) {
        data.uuid = getUUID();
    }
    if (data.children) {
        for (let i = 0; i < data.children.length; i++) {
            const child = data.children[i];
            ensureDataUUID(child);
        }
    }
}

function removeInvalidKonvaObj(konvaObj) {
    var record = getDataByUUID(model.value, konvaObj.uuid);
    if (!record) {
        konvaObj.remove();
        return;
    }

    var child_removes = [];
    if (konvaObj.getChildren) {
        var children = konvaObj.getChildren();
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            var child_record = getDataByUUID(model.value, child.uuid);
            if (!child_record) {
                child_removes.push(child);
            }
        }
    }

    for (let i = 0; i < child_removes.length; i++) {
        const child = child_removes[i];
        child.remove();
    }

    if (konvaObj.getChildren) {
        var children = konvaObj.getChildren();
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            removeInvalidKonvaObj(child);
        }
    }
}

function fillStage(stage) {
    let div = document.getElementById(model.value.container);
    var width = model.value.width || div.clientWidth;
    var height = model.value.height || div.clientHeight;
    stage.width(width);
    stage.height(height);
}

function onModelChange() {
    ensureDataUUID(model.value);
    var stage = createKonvaObjRecursive('Stage', null, model.value);
    fillStage(stage)
    removeInvalidKonvaObj(stage);
}

watch(model.value, () => {
    onModelChange();
});

onMounted(() => {
    onModelChange();
});

onUnmounted(() => {

})

</script>

<template>
</template>