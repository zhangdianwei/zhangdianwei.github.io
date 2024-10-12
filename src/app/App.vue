<script setup>
import { ref, computed } from "vue"
import AppItem from './AppItem.vue'
import TankMain from '../tank/TankMain.vue'
import KonvaMain from '../konva/KonvaMain.vue'
import EasyLink from '../easy_link/EasyLink.vue'
import GridSquare from "../comp/GridSquare.vue"
import GridParallelogramH from "../comp/GridParallelogramH.vue"
import GridParallelogramV from "../comp/GridParallelogramV.vue"
import KonvaStageTest from "../konva/KonvaStageTest.vue"
import TrigoCalc from "../comp/TrigoCalc.vue"
import ShaderFragBase from "../shader/ShaderFragBase.vue"
import ShaderImageBase from "../shader/ShaderImageBase.vue"
import ShowVideo from "../easy_link/ShowVideo.vue"

const routesArray = [
  { id: "TankMain", title: "坦克大战", comp: TankMain },
  { id: "KonvaMain", title: "Konva示例", comp: KonvaMain },
  { id: "CoinKnight", title: "金币骑士", comp: EasyLink, link: 'CoinKnight/index.html' },
  { id: "FarmMine", title: "田园扫雷", comp: EasyLink, link: 'FarmMine/index.html' },
  { id: "jigsaw", title: "拼图游戏", comp: EasyLink, link: 'jigsaw/index.html' },
  { id: "shader", title: "shader小例子", comp: EasyLink, link: 'shader/index.html' },
  { id: "tetris", title: "俄罗斯方块", comp: EasyLink, link: 'tetris/index.html' },
  { id: "KonvaStageTest", title: "KonvaStageTest", comp: KonvaStageTest },
  { id: "GridSquare", title: "矩形网格", comp: GridSquare },
  { id: "GridParallelogramH", title: "横向平行四边形网格", comp: GridParallelogramH },
  { id: "GridParallelogramV", title: "纵向平行四边形网格", comp: GridParallelogramV },
  { id: "TrigoCalc", title: "三角函数计算器", comp: TrigoCalc },
  { id: "ShaderFragBase", title: "Shader-函数入门", comp: ShaderFragBase },
  { id: "ShaderImageBase", title: "Shader-图像入门", comp: ShaderImageBase },
  { id: "v-puzzle", title: "拼图演示", comp: ShowVideo, link: 'video/puzzle.mkv' },
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
      <component v-if="curRouteData.link" :is="curView" :link="curRouteData.link" />
      <component v-else="!curRouteData.link" :is="curView" />
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
