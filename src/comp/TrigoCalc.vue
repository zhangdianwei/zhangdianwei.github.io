<script setup>
import { computed, onMounted, ref, nextTick, watch } from "vue";

const std_value = ref(0);
const data_angle = ref(0);
const data_radian = ref(0);
const data_sin = ref(0);
const data_cos = ref(0);
const data_tan = ref(0);
const data_cot = ref(0);
let std_value_changing = false;

watch(data_angle, () => {
    onDataChanged(data_angle, (src) => {
        return src;
    });
});
watch(data_radian, () => {
    onDataChanged(data_radian, (src) => {
        return src * 180 / Math.PI;
    });
});
watch(data_sin, () => {
    onDataChanged(data_sin, (src) => {
        return Math.asin(src);
    });
});
watch(data_cos, () => {
    onDataChanged(data_cos, (src) => {
        return Math.acos(src);
    });
});
watch(data_tan, () => {
    onDataChanged(data_tan, (src) => {
        return Math.atan(src);
    });
});
watch(data_cot, () => {
    onDataChanged(data_cot, (src) => {
        return Math.atan(1 / src);
    });
});

function onDataChanged(data, parseFunc) {
    if (std_value_changing) {
        return;
    }

    const value = formatValue(data.value);
    std_value.value = parseFunc(value);
}

function formatValue(src) {
    let value = parseFloat(src);
    if (!value) {
        value = 0;
    }
    if (Math.abs(value) < 0.001) {
        value = 0;
    }
    // value = value.toFixed(3);
    // value = parseFloat(value);
    return value;
}

watch(std_value, onStdValueChanged);
async function onStdValueChanged() {
    std_value_changing = true;

    const radians = std_value.value * Math.PI / 180;
    data_angle.value = std_value.value;
    data_radian.value = radians;
    data_sin.value = Math.sin(radians);
    data_cos.value = Math.cos(radians);
    data_tan.value = Math.tan(radians);
    if (data_tan.value) {
        data_cot.value = 1 / data_tan.value;
    }
    else {
        data_cot.value = 0;
    }

    data_angle.value = parseFloat(data_angle.value.toFixed(3));
    data_radian.value = parseFloat(data_radian.value.toFixed(3));
    data_sin.value = parseFloat(data_sin.value.toFixed(3));
    data_cos.value = parseFloat(data_cos.value.toFixed(3));
    data_tan.value = parseFloat(data_tan.value.toFixed(3));
    data_cot.value = parseFloat(data_cot.value.toFixed(3));

    await nextTick();
    std_value_changing = false;
}

onMounted(() => {
    std_value.value = 30;
})

</script>

<template>
    <Row justify="center">
        <Col :xs="24" :sm="16" :md="10" :lg="8" :xl="6">
        <div
            style="margin-top:32px; padding:24px 12px; background:#fff; border-radius:12px; box-shadow:0 2px 8px #f0f1f2;">
            <h1 style="text-align:center;">三角函数计算器</h1>
            <Input type="number" v-model="data_angle" style="margin-bottom: 12px;"><template
                #prepend>角度</template></Input>
            <Input type="number" v-model="data_radian" style="margin-bottom: 12px;"><template
                #prepend>弧度</template></Input>
            <Input type="number" v-model="data_sin" style="margin-bottom: 12px;"><template
                #prepend>正弦</template></Input>
            <Input type="number" v-model="data_cos" style="margin-bottom: 12px;"><template
                #prepend>余弦</template></Input>
            <Input type="number" v-model="data_tan" style="margin-bottom: 12px;"><template
                #prepend>正切</template></Input>
            <Input type="number" v-model="data_cot"><template #prepend>余切</template></Input>
        </div>
        </Col>
    </Row>
</template>
