<script setup>
import { onMounted, ref, nextTick, watch } from "vue";

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
    <div class="calculator-page">
        <Card dis-hover class="calculator-card">
            <div class="tool-heading">
                <span class="tool-icon"><Icon type="md-calculator" size="21" /></span>
                <div>
                    <h2>三角函数换算</h2>
                    <p>数值工具</p>
                </div>
            </div>
            <div class="input-list">
                <Input v-model="data_angle" type="number"><template #prepend>角度</template></Input>
                <Input v-model="data_radian" type="number"><template #prepend>弧度</template></Input>
                <Input v-model="data_sin" type="number"><template #prepend>正弦</template></Input>
                <Input v-model="data_cos" type="number"><template #prepend>余弦</template></Input>
                <Input v-model="data_tan" type="number"><template #prepend>正切</template></Input>
                <Input v-model="data_cot" type="number"><template #prepend>余切</template></Input>
            </div>
        </Card>
    </div>
</template>

<style scoped>
.calculator-page {
    display: flex;
    justify-content: center;
    padding: 36px 0;
}

.calculator-card {
    width: min(440px, 100%);
    border-color: var(--border-color);
}

.tool-heading {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
}

.tool-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex: none;
    border-radius: var(--radius);
    background: var(--surface-muted);
    color: var(--accent-color);
}

.tool-heading h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.tool-heading p {
    margin: 3px 0 0;
    color: var(--text-muted);
    font-size: 13px;
}

.input-list {
    display: grid;
    gap: 12px;
}

@media (max-width: 640px) {
    .calculator-page { padding: 12px 0; }
}
</style>
