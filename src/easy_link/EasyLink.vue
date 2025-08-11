<template>
    <iframe :src="props.link" :style="iFrameStyle"></iframe>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
    link: String,
    width: Number,
    height: Number,
})

const iFrameStyle = ref(null);
onMounted(() => {
    var width = props.width ? `${width}px` : `100%`;
    var height = props.height ? `${height}px` : `100vh`;

    iFrameStyle.value = {
        width,
        height,
    }
});



</script>
