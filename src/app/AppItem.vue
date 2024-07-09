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
  location.hash = props.routeData.name;
}

</script>

<template>

  <Card :bordered="false" :dis-hover="true">
    <template #title>

      <a @click="onClick">
        <Icon type="md-eye" />
        {{ routeData.title }}
      </a>

    </template>

    {{ routeData.desc }}
  </Card>

</template>
