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
  <div class="app-item">
    <Button type="success" size="large" @click="onClick">
      <Icon type="md-eye" />
      {{ routeData.title }}
    </Button>
  </div>
</template>
<style scoped>
.app-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 10px;
}
</style>
