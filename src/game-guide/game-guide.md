# 普通游戏开发指南

本指南规定仓库内游戏的基础代码结构和通用工程边界。它不规定具体玩法；简单游戏只采用需要的部分，实时、多界面游戏再使用完整结构。

## 项目结构

### 依赖边界

- 游戏运行代码不得导入 `game-guide` 或其他游戏目录中的运行代码。
- `src/pixi/` 是待删除的遗留目录，新增或修改的游戏代码不得扩大对它的依赖。
- 每个游戏完整持有自己的画布、生命周期、界面、输入、资源和布局能力。
- 可以共享项目级字体等真正通用的基础资源，但共享资源不承载具体游戏逻辑。
- 新游戏可以复制已有实现作为起点，只复制实际需要的能力，复制后独立维护。

### 结构等级

简单 Vue 游戏可以只包含：

```text
src/xxx/
  XxxGame.vue
  XxxAssets.js
  assets/
```

包含实时渲染、多界面或独立生命周期的游戏使用：

```text
src/xxx/
  XxxGame.vue
  XxxAssets.js
  XxxApp.js
  GameCanvas.vue
  TextureLoader.vue
  GameApp.js
  Dialog.js
  DialogMgr.js
  createGameApp.js
  createCleanup.js
  AudioMgr.js             可选
  StorageMgr.js           可选
  theme.js                可选
  StartDialog.js
  PlayDialog.js
  PlayGameView.js         可选
  PlayHudView.js          可选
  PlayInputMgr.js         可选
  PlaySettingsDialog.js   可选
  ResultDialog.js
  assets/
```

项目代码默认保持单层。拆出的文件使用所属界面前缀，例如 `Start`、`Play`、`Result`；只有单层文件已经难以浏览时才增加子目录，不为 `dialogs`、`components`、`mgrs` 机械分层。

### 基础所有权

```text
XxxGame.vue
└── XxxApp
    ├── runtime
    ├── data
    ├── App 级 Mgr
    └── DialogMgr
        ├── StartDialog
        ├── PlayDialog
        │   └── 当前界面的功能 Mgr
        └── ResultDialog
```

- Vue 入口负责浏览器页面外壳、Canvas 挂载、DOM 控件和组件组合。
- Vue 入口不得承载玩法规则、界面流转和游戏内部状态机。
- App 持有运行环境、资源、跨界面数据、`DialogMgr` 和少量 App 级通用 Mgr。
- `DialogMgr` 只管理 Dialog 栈和界面切换。
- Dialog 是界面边界，持有当前界面的显示对象、状态和功能 Mgr。
- 功能 Mgr 不得比所属 Dialog 活得更久。
- 不要求游戏建立统一的规则链；游戏按实际复杂度决定是否拆分地图、相机、物理、敌人或其他模块。

### 技术选择

- Vue 适合页面外壳、DOM UI、表单、设置、调试面板和低频更新的游戏界面。
- PixiJS 适合 2D 实时世界、大量 Sprite、粒子和逐帧动画。
- Three.js 适合 3D 场景、模型、灯光和摄像机交互。
- Vue 与渲染引擎混合时，Vue 负责外壳，游戏 App 负责玩法；双方通过少量语义命令和只读展示状态通信。
- Vue 层已经集成 View UI Plus 时，按钮、抽屉、弹窗、表单和提示优先使用默认组件。

## Vue 入口与 App

入口创建和销毁 App，并可以组合属于浏览器外壳的 DOM UI：

```vue
<script setup>
import { onBeforeUnmount, ref } from 'vue'
import GameCanvas from './GameCanvas.vue'
import { textures } from './XxxAssets.js'
import XxxApp from './XxxApp.js'

const view = ref(null)
let game

function start(loadedTextures) {
  game?.destroy()
  game = new XxxApp(loadedTextures)
  game.init(view.value.canvas)
}

onBeforeUnmount(() => game?.destroy())
</script>

<template>
  <GameCanvas ref="view" :textures="textures" @ready="start" />
</template>
```

App 通常只设置运行参数、初始化跨界面数据并打开首个 Dialog：

```javascript
export default class XxxApp extends GameApp {
  constructor(textures) {
    super(textures, { shortSide: 640 })
    this.data.score = 0
  }

  start() {
    this.dialogMgr.push(StartDialog)
  }
}
```

同时满足以下条件的能力才挂到 App：

- 生命周期与 App 一致。
- 被多个 Dialog 共用。
- 不包含具体玩法和界面状态。
- 离开任意一个 Dialog 后仍然有意义。

`AudioMgr`、`StorageMgr` 通常符合这些条件；输入、关卡、敌人、碰撞和 HUD 通常不符合。

## Dialog 与功能模块

所有场景和前景界面使用同一个 Dialog 栈：

```javascript
this.app.dialogMgr.replace(PlayDialog, { level: 1 })
this.app.dialogMgr.push(PlaySettingsDialog)
this.app.dialogMgr.pop()
```

- `push`：保留当前 Dialog，在其上打开前景界面；底层保持可见但停止更新和受管交互。
- `pop`：销毁栈顶 Dialog，恢复其下方 Dialog。
- `replace`：销毁当前 Dialog 并进入新界面。
- 始终只有栈顶 Dialog 接收更新和受管输入；尺寸变化发送给栈内全部 Dialog。
- 不需要多界面的简单游戏可以不使用 DialogMgr。

Dialog 生命周期为：

```text
onCreate -> onResize -> onShow -> onActivate
                         ↓
                    onDeactivate
                         ↓
                 onActivate / onHide
                         ↓
                     onDestroy
```

简单逻辑直接放在 Dialog 中。只有功能具有独立状态、生命周期或明显复杂度时才创建 Mgr：

```javascript
export default class PlayDialog extends Dialog {
  onCreate(options) {
    this.inputMgr = this.use(new PlayInputMgr(options))
  }

  onUpdate(delta) {
    this.inputMgr.update?.(delta)
  }
}
```

Mgr 使用 `init(dialog)` 和 `destroy()`；需要跟随界面启停时再实现 `show()` 和 `hide()`。同一 Dialog 内优先直接调用，不使用事件总线解决简单协作。

## 屏幕适配

### 坐标和尺寸

必须区分：

- 游戏逻辑坐标。
- Canvas 内部渲染尺寸。
- Canvas 的 CSS 显示尺寸。
- 浏览器视口和设备像素比。

视口变化只负责布局，不应意外改变游戏速度、关卡数据或碰撞参数。项目必须明确选择等比包含、等比覆盖、自适应扩展世界或 DOM 响应式重排中的一种策略；默认不对游戏世界进行非等比拉伸。

### 固定核心区域与浮动 UI

实时游戏默认使用：

```text
PlayDialog
├── background
├── gameView       游戏核心区域
├── hudView        屏幕状态信息
└── controlsView   可选触控控制器
```

- `gameView` 在可用区域内居中并按项目策略缩放。
- HUD、控制器和前景 Dialog 独立于世界相机布局。
- 横竖屏可以重排 UI；是否改变世界可视范围由游戏明确决定，不能由素材尺寸偶然决定。
- 背景可以填满屏幕，多余空间可以留白、延展背景或放低干扰装饰。
- Dialog 负责分配区域，组件负责自身内部排版。

### 浏览器和移动端

- 处理横竖屏、全屏、`visualViewport` 和安全区变化。
- 浏览器地址栏伸缩不得导致控件跳出可视区域。
- 触控控件尺寸和位置稳定，不遮挡关键内容。
- Resize 只做布局，不播放无意义的过渡，也不重复创建玩法对象。
- 文本、按钮、棋盘和计数器设置稳定尺寸，动态内容不能破坏整体排版。

## 输入规范

- 设备事件先转换为游戏理解的语义动作，再交给当前界面。
- 简单输入可以直接写在 Dialog 中；组合输入、长按、多指或手柄明显复杂时再建立 `PlayInputMgr`。
- 按下、持续和松开是不同状态；需要持续状态的动作不能只使用 `click`。
- 键盘、触控和手柄同时存在时，应分别记录来源；一个来源释放不能错误释放其他来源仍保持的动作。
- 页面失焦、指针取消、失去捕获、Dialog 停用和销毁时释放对应输入。
- 表单和可编辑元素聚焦时，不拦截其键盘输入。
- 相邻触控热区不得重叠；触摸区域应至少达到 `44 × 44` CSS 像素。

Dialog 内的浏览器和 Pixi 事件使用受管方法：

```javascript
this.event(window, 'keydown', this.onKeyDown)
this.pixi(button, 'pointertap', this.onStart)
```

## 时间、暂停与更新

- 实时游戏只保留一个主要玩法时钟。
- 持续更新由 App 的 Ticker 驱动并转发给当前 Dialog。
- 玩法参数使用秒或毫秒，不使用每帧固定增量。
- 必须限制异常大的 `delta`；是否使用固定时间步由具体游戏需要决定。
- Dialog 被覆盖、游戏暂停或页面隐藏后，玩法时间不得继续累计。
- 不在显示对象或功能 Mgr 内启动独立的 `requestAnimationFrame` 玩法循环。
- 有限时长动画由所属组件或 Dialog 管理，并在销毁时停止。

暂停优先通过前景 Dialog 或当前界面的明确暂停能力实现。暂停后必须释放持续输入并停止循环音效。

## 数据与存储

- `app.data` 保存需要跨 Dialog 或跨关卡保留的运行数据。
- 当前界面的临时状态由 Dialog 或其 Mgr 持有。
- `StorageMgr` 只保存设置、纪录和进度等跨会话数据，不承载玩法逻辑。
- HUD 和表现对象读取状态，不应成为游戏数据的第二来源。
- 持久化数据包含版本，并在读取失败时回退到默认值。
- 调试状态不得改变正常模式的默认数据。

## 资源管理

每个游戏必须建立独立的 `XxxAssets.js`，统一使用“静态导入、具名清单、逻辑键访问”：

```javascript
import clickUrl from './assets/StartClick.mp3'
import playerUrl from './assets/PlayPlayer.png'

export const textures = { player: playerUrl }
export const audioFiles = { click: clickUrl }
```

- 独占图片、音频和字体放在游戏自己的 `assets/`。
- 文件 URL 只出现在资源清单或明确管理动态资源的模块中。
- 业务代码使用 `this.app.textures.player`、`audioMgr.play('click')` 等逻辑键。
- 资源键使用项目内唯一的 `camelCase` 语义名，不表达文件路径和扩展名。
- 必须保留固定 URL 的独立页面或外部构建产物才放入 `public`。
- 服务端地址和用户上传内容可以动态加载，但由创建它的模块管理生命周期。
- 加载界面需要处理加载中、失败、超时和页面提前离开。

`GameCanvas` 加载的纹理通常由资源缓存共享。销毁显示对象时不销毁共享纹理，也不在游戏运行期间按公共 URL 批量卸载资源。

### 字体

自定义字体必须在创建依赖它的 Canvas 或 Pixi 文字前加载完成，并保留合理的系统字体兜底链。多个游戏共用的字体可以放在项目级 `src/font/`；单个游戏独占的字体仍放在自身 `assets/`。

## 音频

- 图片和音频一样通过资源清单和逻辑键访问。
- 音频播放由 App 级 `AudioMgr` 统一管理。
- 高频音效应限制并发数量，持续音效必须有明确停止入口。
- 浏览器首次交互前不假定音频可以自动播放。
- 暂停、页面失焦、Dialog 销毁和 App 销毁时停止对应持续音频。
- 需要音量、静音或分类控制时，由 AudioMgr 提供统一状态并按需持久化。

## 主题、UI 与动效

- 每个游戏拥有自己的视觉主题，不要求不同游戏使用相同画风。
- 简单游戏可以在组件内定义少量样式；复杂游戏使用 `theme.js` 集中颜色、字体、间距、圆角和动效令牌。
- 开始、玩法、暂停和结算界面应复用同一套语义角色，避免视觉割裂。
- Vue UI 优先使用 View UI Plus；Pixi 内自绘控件也应具有可用、按下、禁用和处理中等必要状态。
- 图标按钮提供可访问名称，关键信息不能只依赖颜色表达。
- 动效语义、时长、缓动、组件状态和减弱动效遵循 [游戏动效、缓动与 UI 设计指南](./motion-ui-guide.md)。

## 调试与测试

复杂游戏可以提供当前 Dialog、FPS、逻辑坐标、输入状态、关卡切换等调试能力。调试 UI 属于浏览器外壳或所属 Dialog，不应污染正式玩法默认状态。

至少验证：

- 生产构建可以完成。
- 页面反复进入、退出和重开后没有残留更新。
- 桌面和目标移动端尺寸下没有滚动、裁切、控件重叠或文字溢出。
- 横竖屏、全屏和页面失焦后布局与输入正常。
- 加载失败、暂停、恢复和销毁状态可控。
- 控制台没有新增错误。

## 清理

Dialog 内的事件、定时器和额外 Ticker 使用受管方法或登记到 `cleanup`：

```javascript
this.event(window, 'keydown', this.onKeyDown)
this.pixi(button, 'pointertap', this.onStart)
this.interval(() => this.spawn(), 2000)
this.timeout(() => this.finish(), 500)
this.cleanup.add(() => this.app.pixi.ticker.remove(this.tick, this))
```

所有权决定销毁位置：

- App 销毁运行环境、App 级 Mgr 和 `DialogMgr`。
- Dialog 销毁显示对象、事件、动画和功能 Mgr。
- Mgr 销毁自己创建的内部对象。
- Vue 组件销毁 DOM 事件、观察器和浏览器外壳状态。
- `destroy()` 应允许重复调用。

## 完成检查

- 游戏没有导入 `game-guide`、其他游戏运行代码或新增 `src/pixi` 依赖。
- 项目选择了与复杂度匹配的基础结构，没有机械创建空模块。
- Vue、App、Dialog 和 Mgr 的所有权边界清晰。
- 项目资源位于自身 `assets/`，业务代码通过 `XxxAssets.js` 的逻辑键访问。
- 屏幕缩放、横竖屏和安全区策略明确。
- 输入在失焦、覆盖、暂停和销毁后不会卡住。
- Dialog 销毁时，其功能 Mgr、事件、定时器、动画和持续音频全部停止。
- 页面反复进入和退出后没有单例、全局游戏实例或残留渲染循环。
- 开始、玩法、暂停和结算界面的主题与交互层级一致。
- FC-like 游戏额外完成 [FC-like 游戏指南](./fc-like-guide.md) 的检查。
