<script setup>
import {ref, computed} from "vue"
import AppItem from './components/AppItem.vue'
import TankMain from './tank/TankMain.vue'

// const routes = {
//   'TankMain': TankMain,
// }
const routesArray = [
  {name:"TankMain", title:"坦克大战", comp:TankMain, desc:"坦克大战复刻"},
];

const curPath = ref(window.location.pathname.slice(1))
window.addEventListener('pathchange', () => {
  curPath.value = window.location.pathname.slice(1)
})

const curRouteData = computed(()=>{
  return routesArray.find((item)=>item.name===curPath.value);
});
const curView = computed(() => {
  return curRouteData.value?.comp;
})

</script>

<template>
  <div v-if="curView">
    <component :is="curView" />
  </div>
  <div v-else>
    <AppItem v-for="routeData in routesArray" :routeData="routeData"></AppItem>
  </div>
</template>
