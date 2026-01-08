<script setup>
import { ref, computed, watch } from "vue"
import AppItem from './AppItem.vue'
import { Row, Col, Card, Divider, Button, Message } from 'view-ui-plus'
import TankGame from '../tank2/TankGame.vue'
import EasyLink from '../easy_link/EasyLink.vue'
import TrigoCalc from "../comp/TrigoCalc.vue"
import ShaderFragBase from "../shader/ShaderFragBase.vue"
import ShaderImageBase from "../shader/ShaderImageBase.vue"
import ShowVideo from "../easy_link/ShowVideo.vue"
import BallGame from "../comp/BallGame.vue"
import ThreeHello from "../comp/ThreeHello.vue"
import CurveRope from "../comp/CurveRope.vue"
import CurveRopePixi from "../comp/CurveRopePixi.vue"
import Game2048 from "../game2048/Game2048.vue"
import SplitImage from "../comp/SplitImage.vue"
import GameMatch from "../match/GameMatch.vue"
import ImagePacker from "../comp/ImagePacker.vue"
import TetrisMain from "../tetris/TetrisMain.vue"

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function getCurrentPlatform() {
  return isMobile() ? 'mobile' : 'desktop';
}

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
      { id: "TankGame", title: "坦克大战", comp: TankGame, img: "preview/TankMain.png", platforms: ["desktop"] },
      { id: "TetrisMain", title: "俄罗斯方块", comp: TetrisMain, img: "preview/tetris.png" },
    ]
  },
  {
    name: "工具合集",
    children: [
      { id: "TrigoCalc", title: "三角函数计算器", comp: TrigoCalc, img: "preview/TrigoCalc.png" },
      { id: "SplitImage", title: "SplitImage", comp: SplitImage, img: "preview/SplitImage.png" },
      // { id: "ImagePacker", title: "ImagePacker", comp: ImagePacker, img: "preview/SplitImage.png" },
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
    name: "曲线展示",
    children: [
      { id: "CurveRope", title: "曲线绳子(Three)", comp: CurveRope },
      { id: "CurveRopePixi", title: "曲线绳子(Pixi)", comp: CurveRopePixi },
    ]
  },
  {
    name: "其他杂项",
    children: [
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

watch(curRouteData, (route) => {
  if (route && !isPlatformSupported(route)) {
    const currentPlatform = getCurrentPlatform();
    const platformNames = {
      mobile: '移动端',
      desktop: '桌面端'
    };
    const supportedNames = route.platforms?.map(p => platformNames[p] || p).join('、') || '未知';
    Message.warning({
      content: `该游戏不支持${platformNames[currentPlatform]}，仅支持：${supportedNames}`,
      duration: 3
    });
    window.location.hash = '';
  }
}, { immediate: true });
const curView = computed(() => {
  return curRouteData.value?.comp;
});

function isPlatformSupported(routeData) {
  if (!routeData.platforms) return true;
  const currentPlatform = getCurrentPlatform();
  return routeData.platforms.includes(currentPlatform);
}

function getPlatformIcons(platforms) {
  if (!platforms) return null;
  return {
    mobile: platforms.includes('mobile'),
    desktop: platforms.includes('desktop')
  };
}

function onClickItem(routeData) {
  if (!isPlatformSupported(routeData)) {
    const currentPlatform = getCurrentPlatform();
    const platformNames = {
      mobile: '移动端',
      desktop: '桌面端'
    };
    const supportedNames = routeData.platforms?.map(p => platformNames[p] || p).join('、') || '未知';
    Message.warning({
      content: `该游戏不支持${platformNames[currentPlatform]}，仅支持：${supportedNames}`,
      duration: 3
    });
    return;
  }
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
  <div v-else class="home-container">
    <div v-for="cat in categoryRoutes" :key="cat.name" class="category-section">
      <h2 class="category-title">{{ cat.name }}</h2>
      <Row :gutter="16">
        <Col v-for="routeData in cat.children" :key="routeData.id" :span="4" :xs="12" :sm="8" :md="6" :lg="4" :xl="4">
          <template v-if="routeData.img">
            <Card :bordered="false" class="game-card" @click.native="onClickItem(routeData)">
              <div class="game-card-content">
                <div class="game-title">
                  <span>{{ routeData.title }}</span>
                  <span v-if="routeData.platforms" class="platform-icons">
                    <span v-if="routeData.platforms.includes('mobile')" title="支持移动端">📱</span>
                    <span v-if="routeData.platforms.includes('desktop')" title="支持桌面端">💻</span>
                  </span>
                </div>
                <img :src="routeData.img" alt="" class="game-image" />
              </div>
            </Card>
          </template>
          <template v-else>
            <Button long @click="onClickItem(routeData)" class="game-button">
              <span>{{ routeData.title }}</span>
              <span v-if="routeData.platforms" class="platform-icons">
                <span v-if="routeData.platforms.includes('mobile')" title="支持移动端">📱</span>
                <span v-if="routeData.platforms.includes('desktop')" title="支持桌面端">💻</span>
              </span>
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
  background: linear-gradient(135deg, #e5e8f7 0%, #c7f5e7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.home-container {
  padding: 24px;
}

.category-section {
  margin-top: 32px;
}

.category-title {
  margin-bottom: 16px;
}

.game-card {
  margin-bottom: 24px;
  cursor: pointer;
  min-height: 220px;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.game-card-content {
  text-align: center;
  width: 100%;
}

.game-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.game-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  margin-bottom: 0;
  border: 2px solid #e5e6eb;
  border-radius: 16px;
  box-sizing: border-box;
  background: #fafbfc;
}

.game-button {
  margin-bottom: 24px;
  font-size: 16px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.platform-icons {
  display: flex;
  gap: 4px;
}
</style>

