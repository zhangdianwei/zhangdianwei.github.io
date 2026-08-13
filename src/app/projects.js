import { defineAsyncComponent } from 'vue'

const lazy = (loader) => defineAsyncComponent(loader)

export const projectCategories = [
  {
    id: 'games',
    title: '我的游戏',
    icon: 'md-game-controller-b',
    projects: [
      { id: 'CoinKnight', title: '金币骑士', image: 'preview/CoinKnight.png', component: lazy(() => import('../easy_link/EasyLink.vue')), props: { src: 'CoinKnight/index.html' }, layout: 'fullscreen' },
      { id: 'FarmMine', title: '田园扫雷', image: 'preview/FarmMine.png', component: lazy(() => import('../easy_link/EasyLink.vue')), props: { src: 'FarmMine/index.html' }, layout: 'fullscreen' },
      { id: 'jigsaw', title: '拼图游戏', image: 'preview/jigsaw.png', component: lazy(() => import('../easy_link/EasyLink.vue')), props: { src: 'jigsaw/index.html' }, layout: 'fullscreen' },
      { id: 'BallGame', title: '抓住狗屎运', image: 'preview/BallGame.png', component: lazy(() => import('../ballgame/BallGame.vue')), layout: 'fullscreen' },
      { id: 'GameMatch', title: '色彩连线', image: 'preview/GameMatch.png', component: lazy(() => import('../match/GameMatch.vue')), layout: 'fullscreen' },
      { id: 'Game2048', title: '数字贪吃蛇', image: 'preview/Game2048.png', component: lazy(() => import('../game2048/Game2048.vue')), layout: 'fullscreen' },
      { id: 'TankGame', title: '坦克大战', image: 'preview/TankMain.png', component: lazy(() => import('../tank2/TankGame.vue')), layout: 'fullscreen', platforms: ['desktop'] },
      { id: 'TetrisMain', title: '俄罗斯方块', image: 'preview/tetris.png', component: lazy(() => import('../tetris/TetrisMain.vue')), layout: 'fullscreen' },
      { id: 'MahjongGame', title: '青雀麻将', image: 'preview/mahjong.png', component: lazy(() => import('../majiang/MahjongGame.vue')), layout: 'fullscreen' },
    ],
  },
  {
    id: 'tools',
    title: '工具合集',
    icon: 'md-build',
    projects: [
      { id: 'TrigoCalc', title: '三角函数计算器', image: 'preview/TrigoCalc.png', component: lazy(() => import('../comp/TrigoCalc.vue')) },
      { id: 'SplitImage', title: '图片拆分', image: 'preview/SplitImage.png', component: lazy(() => import('../comp/SplitImage.vue')) },
    ],
  },
  {
    id: 'renders',
    title: 'Blender建模展示',
    icon: 'md-cube',
    projects: [
      { id: 'd-puzzle', title: '拼图演示', icon: 'md-videocam', component: lazy(() => import('../easy_link/ShowVideo.vue')), props: { src: 'video/puzzle.mp4' }, layout: 'fullscreen' },
      { id: 'd-ice', title: '冰块演示', icon: 'md-videocam', component: lazy(() => import('../easy_link/ShowVideo.vue')), props: { src: 'video/ice.mp4' }, layout: 'fullscreen' },
      { id: 'd-door', title: '传送门', icon: 'md-videocam', component: lazy(() => import('../easy_link/ShowVideo.vue')), props: { src: 'video/door.mp4' }, layout: 'fullscreen' },
      { id: 'd-turret', title: '炮塔演示', icon: 'md-videocam', component: lazy(() => import('../easy_link/ShowVideo.vue')), props: { src: 'video/turret.mp4' }, layout: 'fullscreen' },
    ],
  },
  {
    id: 'shaders',
    title: 'shader展示',
    icon: 'md-code-working',
    projects: [
      { id: 'ShaderFragBase', title: 'Shader 函数', icon: 'md-code-working', component: lazy(() => import('../shader/ShaderFragBase.vue')) },
      { id: 'ShaderImageBase', title: 'Shader 图像', icon: 'md-image', component: lazy(() => import('../shader/ShaderImageBase.vue')) },
    ],
  },
  {
    id: 'misc',
    title: '其他杂项',
    icon: 'md-flask',
    projects: [
      { id: 'ThreeHello', title: 'Three.js 场景', icon: 'md-cube', component: lazy(() => import('../comp/ThreeHello.vue')), layout: 'fullscreen' },
      { id: 'CurveRopePixi', title: '曲线绳带', icon: 'md-git-commit', component: lazy(() => import('../comp/CurveRopePixi.vue')) },
    ],
  },
]

export const projects = projectCategories.flatMap((category) =>
  category.projects.map((project) => ({ ...project, category: category.title }))
)
