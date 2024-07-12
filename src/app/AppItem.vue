<script setup>
const props = defineProps({
  routeData: {
    id: "",
    title: "",
    comp: null,
    desc: "",
  }
})

function onClick() {
  location.hash = props.routeData.id;
}

</script>

<template>

  <div style="width: 100%; text-align: center; ">
    <Button type="success" size="large" @click="onClick">
      <Icon type="md-eye" />
      {{ routeData.title }}
    </Button>
  </div>


</template>
