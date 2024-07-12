<script setup>
import { ref, computed } from "vue"
import AppItem from './AppItem.vue'
import TankMain from '../tank/TankMain.vue'
import KonvaMain from '../konva/KonvaMain.vue'
import EasyLink from '../easy_link/EasyLink.vue';

const routesArray = [
  { id: "TankMain", title: "坦克大战", comp: TankMain },
  { id: "KonvaMain", title: "Konva示例", comp: KonvaMain },
  { id: "CoinKnight", title: "金币骑士", comp: EasyLink, link: 'CoinKnight/index.html' },
  { id: "FarmMine", title: "田园扫雷", comp: EasyLink, link: 'FarmMine/index.html' },
  { id: "jigsaw", title: "拼图游戏", comp: EasyLink, link: 'jigsaw/index.html' },
  { id: "shader", title: "shader小例子", comp: EasyLink, link: 'shader/index.html' },
  { id: "tetris", title: "俄罗斯方块", comp: EasyLink, link: 'tetris/index.html' },
];

const curPath = ref(window.location.hash.slice(1))
window.addEventListener('hashchange', () => {
  curPath.value = window.location.hash.slice(1)
  document.title = "Project:" + curPath.value
})

const curRouteData = computed(() => {
  return routesArray.find((item) => item.id === curPath.value);
});
const curView = computed(() => {
  return curRouteData.value?.comp;
})

function onClickItem(routeData) {
  window.location.hash = routeData.id;
}

</script>

<template>
  <div v-if="curView">
    <Suspense>
      <component :is="curView" :link="curRouteData.link" />
    </Suspense>
  </div>
  <div v-else>
    <Grid :col="5">
      <GridItem v-for="routeData in routesArray">
        <AppItem :routeData="routeData"></AppItem>
      </GridItem>
    </Grid>
  </div>
</template>
