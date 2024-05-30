<script setup>
import { ref, computed } from "vue"
import AppItem from './components/AppItem.vue'
import TankMain from './tank/TankMain.vue'

// const routes = {
//   'TankMain': TankMain,
// }
const routesArray = [
  { name: "TankMain", title: "TankMainTitle", comp: TankMain, desc: `TankMainDescription TankMainDescription` },
  { name: "TankMain", title: "TankMainTitle", comp: TankMain, desc: `TankMainDescription TankMainDescription` },
];

const curPath = ref(window.location.pathname.slice(1))
window.addEventListener('pathchange', () => {
  curPath.value = window.location.pathname.slice(1)
})

const curRouteData = computed(() => {
  return routesArray.find((item) => item.name === curPath.value);
});
const curView = computed(() => {
  return curRouteData.value?.comp;
})

</script>

<template>
  <div v-if="curView">
    <Suspense>
      <component :is="curView" />
    </Suspense>
  </div>
  <div v-else>
    <div class="container">
      <div class="section">
        <AppItem v-for="routeData in routesArray" :routeData="routeData"></AppItem>
      </div>
    </div>
  </div>
</template>
