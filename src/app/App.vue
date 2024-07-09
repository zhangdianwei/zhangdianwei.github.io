<script setup>
import { ref, computed } from "vue"
import AppItem from './AppItem.vue'
import TankMain from '../tank/TankMain.vue'
import KonvaMain from '../konva/KonvaMain.vue'
import EasyLink from '../easy_link/EasyLink.vue';

const routesArray = [
  { name: "TankMain", title: "TankMainTitle", comp: TankMain, desc: `TankMainDescription TankMainDescription` },
  { name: "KonvaMain", title: "Konva示例", comp: KonvaMain, desc: `为konva入门写的一些小例子` },
  { name: "CoinKnight", title: "金币骑士", comp: EasyLink, desc: `基于cocos-creator的小游戏`, link: 'CoinKnight/index.html' },
  { name: "FarmMine", title: "田园扫雷", comp: EasyLink, desc: `基于unity的小游戏`, link: 'FarmMine/index.html' },
  { name: "jigsaw", title: "拼图游戏", comp: EasyLink, desc: `动态拼图小游戏`, link: 'jigsaw/index.html' },
  { name: "shader", title: "shader小例子", comp: EasyLink, desc: `shader小例子`, link: 'shader/index.html' },
  // { name: "tetris", title: "俄罗斯方块", comp: EasyLink, desc: ``, link: 'tetris/index.html' },
];

const curPath = ref(window.location.hash.slice(1))
window.addEventListener('hashchange', () => {
  curPath.value = window.location.hash.slice(1)
  document.title = "Project:" + curPath.value
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
      <component :is="curView" :link="curRouteData.link" />
    </Suspense>
  </div>
  <div v-else>
    <Grid :col="2">
      <GridItem v-for="routeData in routesArray">
        <AppItem :routeData="routeData"></AppItem>
      </GridItem>
    </Grid>

  </div>
</template>
