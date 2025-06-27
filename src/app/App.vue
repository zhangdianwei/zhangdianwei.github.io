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
import BallGame from "../comp/BallGame.vue"
import ThreeHello from "../comp/ThreeHello.vue"
import CurveRope from "../comp/CurveRope.vue"
import CurveRopePixi from "../comp/CurveRopePixi.vue"
import PixiHello from "../pixi/PixiHello.vue"
import Game2048 from "../game2048/Game2048.vue"
import SplitImage from "../comp/SplitImage.vue"
import Shooter from "../shooter/Shooter.vue"
import GameMatch from "../match/GameMatch.vue"
import { Row, Col } from 'view-ui-plus'

const routesArray = [
  { id: "TankMain", title: "坦克大战", comp: TankMain },
  { id: "KonvaMain", title: "Konva示例", comp: KonvaMain },
  { id: "CoinKnight", title: "金币骑士", comp: EasyLink, link: 'CoinKnight/index.html' },
  { id: "FarmMine", title: "田园扫雷", comp: EasyLink, link: 'FarmMine/index.html' },
  { id: "jigsaw", title: "拼图游戏", comp: EasyLink, link: 'jigsaw/index.html' },
  { id: "tetris", title: "俄罗斯方块", comp: EasyLink, link: 'tetris/index.html' },
  { id: "heart", title: "跳动的爱心", comp: EasyLink, link: 'webui/heart.html' },
  { id: "KonvaStageTest", title: "KonvaStageTest", comp: KonvaStageTest },
  { id: "GridSquare", title: "矩形网格", comp: GridSquare },
  { id: "GridParallelogramH", title: "横向平行四边形网格", comp: GridParallelogramH },
  { id: "GridParallelogramV", title: "纵向平行四边形网格", comp: GridParallelogramV },
  { id: "TrigoCalc", title: "三角函数计算器", comp: TrigoCalc },
  { id: "ShaderFragBase", title: "Shader-函数入门", comp: ShaderFragBase },
  { id: "ShaderImageBase", title: "Shader-图像入门", comp: ShaderImageBase },
  { id: "d-puzzle", title: "d-拼图演示", comp: ShowVideo, link: 'video/puzzle.mp4' },
  { id: "d-ice", title: "d-冰块演示", comp: ShowVideo, link: 'video/ice.mp4' },
  { id: "d-door", title: "d-传送门", comp: ShowVideo, link: 'video/door.mp4' },
  { id: "BallGame", title: "小球碰撞游戏", comp: BallGame },
  { id: "CurveRope", title: "曲线绳子(Three)", comp: CurveRope },
  { id: "CurveRopePixi", title: "曲线绳子(Pixi)", comp: CurveRopePixi },
  { id: "PixiHello", title: "PixiHello", comp: PixiHello },
  { id: "ThreeHello", title: "ThreeHello", comp: ThreeHello },
  { id: "Game2048", title: "Game2048", comp: Game2048 },
  { id: "SplitImage", title: "SplitImage", comp: SplitImage },
  { id: "Shooter", title: "Shooter", comp: Shooter },
  { id: "GameMatch", title: "GameMatch", comp: GameMatch },
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
  <!-- 路由视图 -->
  <Suspense v-if="curView">
    <template #default>
      <component :is="curView" v-bind="curRouteData.link ? { link: curRouteData.link } : {}" />
    </template>
    <template #fallback>
      <div class="loading">加载中...</div>
    </template>
  </Suspense>

  <!-- 项目列表 -->
  <div v-else>
    <Row :gutter="16">
      <Col v-for="routeData in routesArray" :key="routeData.id" :span="4" :xs="12" :sm="8" :md="6" :lg="4" :xl="4">
      <div @click="onClickItem(routeData)">
        <AppItem :routeData="routeData" />
      </div>
      </Col>
    </Row>
  </div>
</template>
