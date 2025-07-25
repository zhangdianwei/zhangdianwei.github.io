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

const categoryRoutes = [
  {
    name: "我的游戏",
    children: [
      { id: "CoinKnight", title: "金币骑士", comp: EasyLink, link: 'CoinKnight/index.html', img: "preview/CoinKnight.png" },
      { id: "FarmMine", title: "田园扫雷", comp: EasyLink, link: 'FarmMine/index.html', img: "preview/FarmMine.png" },
      { id: "jigsaw", title: "拼图游戏", comp: EasyLink, link: 'jigsaw/index.html', img: "preview/jigsaw.png" },
      { id: "BallGame", title: "抓住狗屎运", comp: BallGame, img: "preview/BallGame.png" },
      { id: "GameMatch", title: "GameMatch", comp: GameMatch, img: "preview/GameMatch.png" },
      { id: "Game2048", title: "Game2048", comp: Game2048, img: "preview/Game2048.png" },
      { id: "tetris", title: "俄罗斯方块", comp: EasyLink, link: 'tetris/index.html', img: "preview/tetris.png" },
      { id: "Shooter", title: "Shooter", comp: Shooter, img: "preview/Shooter.png" },
      { id: "TankMain", title: "坦克大战", comp: TankMain, img: "preview/TankMain.png" },
    ]
  },
  {
    name: "工具合集",
    children: [
      { id: "TrigoCalc", title: "三角函数计算器", comp: TrigoCalc, img: "preview/TrigoCalc.png" },
      { id: "SplitImage", title: "SplitImage", comp: SplitImage, img: "preview/SplitImage.png" },
    ]
  },
  {
    name: "Blender建模展示",
    children: [
      { id: "d-puzzle", title: "拼图演示", comp: ShowVideo, link: 'video/puzzle.mp4' },
      { id: "d-ice", title: "冰块演示", comp: ShowVideo, link: 'video/ice.mp4' },
      { id: "d-door", title: "传送门", comp: ShowVideo, link: 'video/door.mp4' },
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

const curPath = ref(window.location.hash.slice(1))
window.addEventListener('hashchange', () => {
  curPath.value = window.location.hash.slice(1)
  document.title = "Project:" + curPath.value
})

// 统一所有路由，便于查找
const allRoutes = [
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
    <div v-for="cat in categoryRoutes" :key="cat.name" style="margin-top: 32px;">
      <h2 style="margin-bottom: 16px;">{{ cat.name }}</h2>
      <Row :gutter="16">
        <Col v-for="routeData in cat.children" :key="routeData.id" :span="4" :xs="12" :sm="8" :md="6" :lg="4" :xl="4">
        <template v-if="routeData.img">
          <Card :bordered="false"
            style="margin-bottom: 24px; cursor: pointer; min-height: 220px; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box;"
            @click.native="onClickItem(routeData)">
            <div style="text-align:center; width: 100%;">
              <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">{{ routeData.title }}</div>
              <img v-if="routeData.img" :src="routeData.img" alt=""
                style="width: 100%; height: auto; object-fit: contain; margin-bottom: 0; border: 2px solid #e5e6eb; border-radius: 16px; box-sizing: border-box; background: #fafbfc;" />
            </div>
          </Card>
        </template>
        <template v-else>
          <Button long @click="onClickItem(routeData)" style="margin-bottom: 24px; font-size: 16px; min-height: 60px;">
            {{ routeData.title }}
          </Button>
        </template>
        </Col>
      </Row>
    </div>
  </div>
</template>

<style>
.game-container {
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>