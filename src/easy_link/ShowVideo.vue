<template>
    <!-- <video :src="props.link"></video> -->
    <video :src="props.link" :style="iFrameStyle" controls autoplay loop></video>
</template>

<script setup>
import { ref, defineProps, onMounted } from 'vue';

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
