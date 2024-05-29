<script setup>
const props = defineProps({
  routeData: {
    name: "",
    title: "",
    comp: null,
    desc: "",
  }
})

function onClick() {
  location.href = props.routeData.name;
}

</script>

<template>
  <div class="panel">
    <div class="panel-heading">
      <p class="is-family-monospace">{{ routeData.title }}</p>
    </div>
    <div class="panel-block">
      {{ routeData.desc }}
    </div>

    <button @click="onClick" class="button">体验</button>
  </div>

</template>
