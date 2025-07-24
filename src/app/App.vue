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
import { Row, Col, Card, Divider, Button } from 'view-ui-plus'

const imageRoutes = [
  { id: "CoinKnight", title: "金币骑士", comp: EasyLink, link: 'CoinKnight/index.html', img: "preview/CoinKnight.png" },
  { id: "FarmMine", title: "田园扫雷", comp: EasyLink, link: 'FarmMine/index.html', img: "preview/FarmMine.png" },
  { id: "jigsaw", title: "拼图游戏", comp: EasyLink, link: 'jigsaw/index.html', img: "preview/jigsaw.png" },
  { id: "tetris", title: "俄罗斯方块", comp: EasyLink, link: 'tetris/index.html', img: "preview/tetris.png" },
  { id: "BallGame", title: "抓住狗屎运", comp: BallGame, img: "preview/BallGame.png" },
  { id: "Game2048", title: "Game2048", comp: Game2048, img: "preview/Game2048.png" },
  { id: "GameMatch", title: "GameMatch", comp: GameMatch, img: "preview/GameMatch.png" },
  { id: "Shooter", title: "Shooter", comp: Shooter, img: "preview/Shooter.png" },
  { id: "TankMain", title: "坦克大战", comp: TankMain, img: "preview/TankMain.png" },
]

const categoryRoutes = [
  {
    name: "工具合集",
    children: [
      { id: "TrigoCalc", title: "三角函数计算器", comp: TrigoCalc },
      { id: "SplitImage", title: "SplitImage", comp: SplitImage },
    ]
  },
  {
    name: "特效合集",
    children: [
      { id: "heart", title: "跳动的爱心", comp: EasyLink, link: 'webui/heart.html' },
      { id: "d-puzzle", title: "d-拼图演示", comp: ShowVideo, link: 'video/puzzle.mp4' },
      { id: "d-ice", title: "d-冰块演示", comp: ShowVideo, link: 'video/ice.mp4' },
      { id: "d-door", title: "d-传送门", comp: ShowVideo, link: 'video/door.mp4' },
    ]
  },
  {
    name: "shader展示",
    children: [
      { id: "ShaderFragBase", title: "Shader-函数入门", comp: ShaderFragBase },
      { id: "ShaderImageBase", title: "Shader-图像入门", comp: ShaderImageBase },
    ]
  },
  {
    name: "网格展示",
    children: [
      { id: "GridSquare", title: "矩形网格", comp: GridSquare },
      { id: "GridParallelogramH", title: "横向平行四边形网格", comp: GridParallelogramH },
      { id: "GridParallelogramV", title: "纵向平行四边形网格", comp: GridParallelogramV },
    ]
  },
  {
    name: "曲线展示",
    children: [
      { id: "CurveRope", title: "曲线绳子(Three)", comp: CurveRope },
      { id: "CurveRopePixi", title: "曲线绳子(Pixi)", comp: CurveRopePixi },
    ]
  },
  {
    name: "其他杂项",
    children: [
      { id: "KonvaMain", title: "Konva示例", comp: KonvaMain },
      { id: "KonvaStageTest", title: "KonvaStageTest", comp: KonvaStageTest },
      { id: "PixiHello", title: "PixiHello", comp: PixiHello },
      { id: "ThreeHello", title: "ThreeHello", comp: ThreeHello },
    ]
  }
]

const otherRoutes = [

];

const curPath = ref(window.location.hash.slice(1))
window.addEventListener('hashchange', () => {
  curPath.value = window.location.hash.slice(1)
  document.title = "Project:" + curPath.value
})

// 统一所有路由，便于查找
const allRoutes = [
  ...imageRoutes,
  ...categoryRoutes.flatMap(cat => cat.children)
];

const curRouteData = computed(() => {
  return allRoutes.find((item) => item.id === curPath.value);
});
const curView = computed(() => {
  return curRouteData.value?.comp;
});

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

  <!-- 首页内容 -->
  <div v-else style="padding: 24px;">
    <h2 style="margin-bottom: 16px;">游戏/应用</h2>
    <Row :gutter="16">
      <Col v-for="routeData in imageRoutes" :key="routeData.id" :span="4" :xs="12" :sm="8" :md="6" :lg="4" :xl="4">
      <Card :bordered="true"
        style="margin-bottom: 24px; cursor: pointer; min-height: 260px; padding: 32px 0; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #e5e6eb; box-sizing: border-box;"
        @click.native="onClickItem(routeData)">
        <div style="text-align:center; width: 100%;">
          <div style="font-size: 20px; font-weight: 500; margin-bottom: 8px;">{{ routeData.title }}</div>
          <img v-if="routeData.img" :src="routeData.img" alt=""
            style="width: 100%; max-width: 220px; height: auto; aspect-ratio: 1/1; object-fit: contain; margin-bottom: 0;" />
        </div>
      </Card>
      </Col>
    </Row>

    <Divider />

    <div v-for="cat in categoryRoutes" :key="cat.name" style="margin-top: 32px;">
      <h2 style="margin-bottom: 16px;">{{ cat.name }}</h2>
      <Row :gutter="16">
        <Col v-for="routeData in cat.children" :key="routeData.id" :span="4" :xs="12" :sm="8" :md="6" :lg="4" :xl="4">
        <Button long @click="onClickItem(routeData)" style="margin-bottom: 16px; font-size: 15px;">
          {{ routeData.title }}
        </Button>
        </Col>
      </Row>
    </div>
  </div>
</template>
