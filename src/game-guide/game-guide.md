# 内置小游戏开发指南

本目录只提供开发建议和参考结构，不提供任何运行时代码。每个游戏都在自己的目录内完整实现所需能力，可以从其他游戏复制起点，但复制后独立演进。

推荐结构为：

```text
Vue 入口 -> App -> DialogMgr -> Dialog -> 功能 Mgr
```

金币骑士、田园扫雷、拼图游戏是内嵌网页，不使用这套结构。

## 依赖边界

`src/pixi/` 是待删除的遗留目录。新增或修改游戏代码时不得从该目录导入任何内容；这项限制不影响直接使用 `pixi.js`。

- 游戏运行所需的画布、生命周期、界面栈、资源加载、音频、存储、输入和布局能力全部放在当前游戏目录中。
- 业务代码不得导入 `game-guide`，也不得跨游戏目录导入运行代码。
- 新游戏可以复制现有实现作为起点，但只复制实际需要的能力，复制后由新游戏独立维护。
- 修改仍依赖 `src/pixi/` 的旧代码时，不得扩大依赖范围；如果本次改动涉及所依赖的能力，应迁移到当前游戏目录。
- 删除 `src/pixi/` 后，相关游戏应保持正常编译。

这条边界针对游戏运行代码，不禁止共享项目级基础资源。字体等确实通用、体积不大的静态资源可以放在 `src/font/` 这样的目录里，由各游戏自行静态导入，用法见下方“字体”一节。

## 所有权

- Vue 入口只创建和销毁 App。
- App 持有 Pixi 运行环境、资源、公共数据、`dialogMgr` 和少量 App 级通用 Mgr。
- `DialogMgr` 只管理 Dialog 栈和界面切换。
- `Dialog` 是所有场景和前景界面的基类，也是 `DialogMgr` 使用的统一接口。
- 具体 Dialog 是功能边界，负责创建和销毁当前界面需要的功能 Mgr。
- 功能 Mgr 不能挂到 App，也不能比所属 Dialog 活得更久。

```text
XxxApp
├── audioMgr
├── storageMgr
├── data
└── dialogMgr
    ├── StartDialog
    ├── PlayDialog
    │   ├── PlayInputMgr
    │   ├── PlayRuleMgr
    │   ├── PlayEnemy
    │   └── PlaySettingsDialog
    └── ResultDialog
```

`GameApp` 默认提供 `app.data` 普通对象。跨界面保留的分数、配置或进度放在其中，不创建 `DataMgr`。

## 目录结构

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
  theme.js                可选，当前游戏的颜色、字体和组件样式
  XxxData.js              可选
  assets/
    StartClick.mp3        按需要创建
    PlayPlayer.png        按需要创建
  StartDialog.js
  PlayDialog.js
  PlayGameView.js          按需要创建
  PlayHudView.js           按需要创建
  PlayInputMgr.js          按需要创建
  PlayRuleMgr.js           按需要创建
  PlaySettingsDialog.js    按需要创建，覆盖在游戏场景上
  ResultDialog.js
```

项目代码默认保持单层，`assets/` 是固定的资源目录。同一界面的布局、交互和状态优先放在一起；内容较多时再拆文件，并统一使用界面名作为前缀，例如 `PlayGameView.js`、`PlayInputMgr.js`，资源文件也保留 `PlayPlayer.png` 这样的界面前缀。只有代码文件过多、单层目录已经难以浏览时才增加其他子目录，不为 `dialogs`、`components`、`mgrs` 机械分层。

## Vue 入口

```vue
<script setup>
import { onBeforeUnmount, ref } from 'vue'
import GameCanvas from './GameCanvas.vue'
import { textures } from './XxxAssets.js'
import XxxApp from './XxxApp.js'

const view = ref(null)
let game

function start(textures) {
  game?.destroy()
  game = new XxxApp(textures)
  game.init(view.value.canvas)
}

onBeforeUnmount(() => game?.destroy())
</script>

<template>
  <GameCanvas ref="view" :textures="textures" @ready="start" />
</template>
```

入口中不写界面切换、输入、规则或定时器。

## App

继承 `GameApp`，通常只需要设置画布参数和打开第一个 Dialog。

```javascript
import GameApp from './GameApp.js'
import { theme } from './theme.js'
import StartDialog from './StartDialog.js'

export default class XxxApp extends GameApp {
  constructor(textures) {
    super(textures, {
      shortSide: 640,
      backgroundColor: theme.background,
    })
    this.data.score = 0
  }

  start() {
    this.dialogMgr.push(StartDialog)
  }
}
```

不要把 `inputMgr`、`ruleMgr`、`enemyMgr` 等功能对象放到 App。

## 资源引用

资源统一使用“静态导入、具名清单、逻辑键访问”：

每个游戏都必须建立独立的 `XxxAssets.js`，无论资源多少。该文件只负责静态导入资源并导出具名清单：

```javascript
import clickUrl from './assets/StartClick.mp3'
import playerUrl from './assets/PlayPlayer.png'

export const textures = { player: playerUrl }
export const audioFiles = { click: clickUrl }
```

- 文件 URL 只出现在资源清单中。业务代码使用 `this.app.textures.player`、`audioMgr.play('click')`，不写文件路径、文件名或扩展名。
- 资源清单使用普通对象，键为项目内唯一的 `camelCase` 语义名，值为静态导入得到的 URL。
- 键表达用途而不是文件位置，例如 `player`、`backgroundMusic`、`resultWin`；不要使用 `PlayPlayer.png`、`assets/player` 作为键。
- 图片、音频等实体资源统一放在项目的 `assets/` 中，不再散落在代码文件之间。
- 所有资源清单都放在项目根目录的 `XxxAssets.js`；`XxxApp.js`、Vue 入口和业务文件不直接导入图片、音频等资源文件。
- 没有某类资源时可以不导出对应清单；游戏暂时没有任何资源时仍保留 `XxxAssets.js`，导出 `textures = {}`。
- `GameCanvas` 接收 `:textures="textures"`，加载完成后返回同键的 Pixi 纹理对象；`GameApp` 原样保存为 `app.textures`。
- 音频使用同样的具名清单交给 `AudioMgr.loadAll(audioFiles)`，播放时只传逻辑键。
- 不在业务代码中调用 `PIXI.Texture.from(url)`、`PIXI.Sprite.from(url)` 或再次执行 `PIXI.Assets.load(url)`。
- 只有服务端地址、用户上传内容等运行时资源可以动态生成 URL，并应在所属 Mgr 内明确管理生命周期。

## 字体

`PIXI.Text` 用 Canvas 渲染文字，字体没加载完就创建文字会先用兜底字体画一帧，之后不会自动补画，所以自定义字体必须在创建任何用到它的 `PIXI.Text` 之前加载完成。

真正跨游戏通用的字体文件放在项目级共享目录 `src/font/`（不是某个游戏独占资源，不放进游戏自己的 `assets/`）。在游戏的 `theme.js` 里静态导入、注册并导出一个加载完成的 Promise：

```javascript
import patrickHandUrl from '../font/PatrickHand-Regular.ttf'

export const theme = {
  fontFamily: 'Patrick Hand, Comic Sans MS, Chalkduster, sans-serif',
}

const patrickHandFace = new FontFace('Patrick Hand', `url(${patrickHandUrl})`)
export const fontReady = patrickHandFace.load().then((loadedFace) => {
  document.fonts.add(loadedFace)
})
```

Vue 入口在创建 App 之前 `await fontReady`：

```javascript
async function start(textures) {
  game?.destroy()
  await fontReady
  game = new XxxApp(textures)
  game.init(view.value.canvas)
}
```

- `fontFamily` 保留系统字体兜底链（如 `Comic Sans MS, Chalkduster, sans-serif`），字体文件加载失败时仍有合理的降级效果，不依赖某个操作系统一定装了同一款字体——这也是引入自定义字体的主要原因：系统字体在不同系统上差异很大，很难做到观感一致。
- 只有多个游戏都会用到的字体才放 `src/font/`；某个游戏独占的字体放该游戏自己的 `assets/`，导入方式不变，仍需 `FontFace` 加载并 `await`。

## App 级 Mgr

同时满足以下条件才挂到 App：

- 生命周期与整个 App 一致。
- 会被多个 Dialog 共用。
- 不包含具体玩法和界面状态。
- 离开任意一个 Dialog 后仍然有意义。

游戏可以按需实现以下 App 级能力，不使用时无需保留对应文件：

| Mgr | 职责 |
| --- | --- |
| `AudioMgr` | 加载、播放和关闭音频 |
| `StorageMgr` | 按游戏命名空间读写本地数据 |

```javascript
import AudioMgr from './AudioMgr.js'
import GameApp from './GameApp.js'
import StorageMgr from './StorageMgr.js'

export default class XxxApp extends GameApp {
  constructor(textures) {
    super(textures)
    this.audioMgr = this.use(new AudioMgr())
    this.storageMgr = this.use(new StorageMgr('xxx'))
  }
}
```

App 级 Mgr 使用 `init(app)`、`destroy()` 生命周期。

```javascript
await this.audioMgr.loadAll({ click: 'audio/click.mp3' })
this.audioMgr.play('click')

const best = this.storageMgr.get('best', 0)
this.storageMgr.set('best', Math.max(best, score))
```

新增通用 Mgr 时直接使用普通类，只实现需要的生命周期：

```javascript
export default class XxxMgr {
  init(app) {
    this.app = app
  }

  destroy() {
    this.app = null
  }
}
```

项目独占资源放在项目源码目录下的 `assets/`，通过静态导入交给 `GameCanvas` 加载；跨界面数据仍放在 `app.data`。事件总线、输入、规则、关卡、物理、敌人、结算和 HUD 都不是 App 级 Mgr。

## DialogMgr

App 初始化时会自动创建 `dialogMgr`。所有场景和前景界面都使用同一个 Dialog 栈：

```javascript
this.app.dialogMgr.replace(PlayDialog, { level: 1 })
this.app.dialogMgr.push(PlaySettingsDialog)
this.app.dialogMgr.pop()
```

- `push`：让当前 Dialog 保持可见但进入非激活态，在其上压入新 Dialog。用于设置、背包、商店、确认框等前景界面。
- `pop`：销毁栈顶 Dialog，重新激活其下方 Dialog。关闭前景界面后，底层游戏场景直接继续。
- `replace`：销毁栈顶 Dialog 并替换为新 Dialog。用于开始页进入游戏、切换关卡、游戏进入结算等不保留旧界面的完整切换。
- 可以连续 `push` 多层前景界面；所有场景和界面都直接继承 `Dialog`，不增加场景专用基类或第二个管理器。
- 游戏场景通常是栈中长期存在的底层 `PlayDialog`。它被覆盖时仍会渲染，但停止更新和受管交互。
- 始终只有栈顶 Dialog 接收更新和受管输入。尺寸变化时，栈内全部 Dialog 都会收到 `onResize(screen)`。
- 这是 Dialog 栈内的激活态切换，不引入 App 级暂停状态；底层场景只是在栈位置上特殊，不需要新增 `SceneDialog` 类型。

## Dialog

具体界面继承 `Dialog`，通过统一生命周期接口组织界面。`DialogMgr` 只调用 `mount/show/hide/activate/deactivate/update/layout/destroy`，不依赖具体游戏实现。

```javascript
import Dialog from './Dialog.js'
import PlayInputMgr from './PlayInputMgr.js'
import PlayRuleMgr from './PlayRuleMgr.js'
import ResultDialog from './ResultDialog.js'

export default class PlayDialog extends Dialog {
  onCreate(options) {
    this.inputMgr = this.use(new PlayInputMgr())
    this.ruleMgr = this.use(new PlayRuleMgr(options))
  }

  onUpdate(delta) {
    this.ruleMgr.update(delta)
  }

  onResize(screen) {
    this.position.set(screen.width / 2, screen.height / 2)
  }

  finish(result) {
    this.app.dialogMgr.replace(ResultDialog, result)
  }
}
```

可用生命周期：

```text
首次打开：onCreate -> onResize -> onShow -> onActivate
被覆盖：onDeactivate
关闭覆盖：onActivate
销毁：onDeactivate -> onHide -> onDestroy
激活期间：onUpdate
```

- `onShow/onHide` 表示是否可见。覆盖界面打开时，底层 Dialog 不会触发 `onHide`。
- `onActivate/onDeactivate` 表示是否拥有更新和交互权。覆盖界面打开时底层触发 `onDeactivate`，关闭后触发 `onActivate`。
- 通过 `this.use(manager)` 登记的功能 Mgr 会随激活态调用 `show/hide`，并在 Dialog 销毁时按创建的反向顺序销毁。

Dialog 本身就是界面模块。简单开始页、结算页的显示对象和按钮直接写在 `StartDialog.js`、`ResultDialog.js` 中，不再额外创建只有该 Dialog 使用的 `StartScreen`、`ResultScreen`。拆分的依据是单个文件的复杂度，不是代码所属的技术类型。

## 横竖屏布局

游戏界面统一采用“固定核心区域 + 浮动 UI”：

```text
PlayDialog
├── background
├── gameView       固定逻辑尺寸和比例
├── hudView        浮动状态信息
└── controlsView   浮动触屏控制器
```

- `gameView` 使用固定逻辑坐标、镜头范围和宽高比，横竖屏不改变玩法空间。
- `gameView` 默认在可用区域内居中，只允许等比缩放，不拉伸或裁切。
- `hudView`、`controlsView` 等 UI 独立于游戏世界，锚定到屏幕边缘或 `gameView` 边缘。
- 竖屏可以先为触屏控制器预留底部区域，再让 `gameView` 在剩余区域居中。
- 横屏可以让 `gameView` 居中，将控制器放在两侧空余区域。
- 背景铺满整个屏幕，多出的空间允许留白或放简单装饰。
- 横竖屏只改变组件的位置和可见性，不改变规则、碰撞、速度、关卡或镜头范围。
- 所有方向判断和组件摆放集中在 Dialog 的 `onResize(screen)`，不散落到功能 Mgr。
- 只区分横屏和竖屏，不再为手机、平板和桌面维护不同玩法布局。

Dialog 负责组合组件和分配区域，组件负责自身内部排版：

```javascript
onResize(screen) {
  const portrait = screen.height > screen.width
  const controlsHeight = portrait ? 220 : 0
  const viewport = {
    x: 0,
    y: 0,
    width: screen.width,
    height: screen.height - controlsHeight,
  }

  this.gameView.layout(viewport)
  this.hudView.layout(screen, viewport)
  this.controlsView.layout(screen, viewport, portrait)
}
```

组件只在确实具有独立布局或交互时拆分。纯装饰和几行文字直接留在 Dialog，避免为了结构完整创建空组件。

## 输入、事件和数据

简单输入直接写在需要它的 Dialog 中：

```javascript
onCreate() {
  this.onKeyDown = (event) => this.move(event.key)
  this.event(window, 'keydown', this.onKeyDown)
}
```

只有按键映射、组合输入、长按或手柄等逻辑明显复杂时，才创建当前 Dialog 持有的 `InputMgr`：

```javascript
this.inputMgr = this.use(new InputMgr())
```

浏览器事件、Pixi 事件和玩法定时器使用 Dialog 的受管方法，不创建 `EventMgr`：

```javascript
this.event(window, 'pointerup', this.onPointerUp)
this.pixi(button, 'pointertap', this.onStart)
this.interval(() => this.spawn(), 2000)
this.timeout(() => this.finish(), 500)
```

这些回调只在 Dialog 激活时执行。`interval` 在非激活期间跳过；`timeout` 到期时若界面被覆盖，会在重新激活后执行。纯清理登记或不受激活态影响的底层任务才直接使用 `this.cleanup`。

同一 Dialog 内的功能直接调用，界面切换时通过参数传递数据：

```javascript
this.ruleMgr.move(direction)
this.app.dialogMgr.replace(ResultDialog, { score: this.app.data.score })
```

`app.data` 只保存运行数据，`StorageMgr` 只负责需要跨会话保留的数据。两者都不承载规则逻辑。

## 功能 Mgr

Mgr 是某个 Dialog 内相对独立的功能，`init` 和 `destroy` 负责创建与销毁；需要跟随界面启停时再实现 `show` 和 `hide`：

```javascript
export default class PlayInputMgr {
  init(dialog) {
    this.dialog = dialog
    this.onKeyDown = (event) => this.handleKey(event.key)
    dialog.event(window, 'keydown', this.onKeyDown)
  }

  handleKey(key) {}

  show() {}

  hide() {}

  destroy() {
    this.dialog = null
  }
}
```

`Dialog` 会自动转发 `show`、`hide` 和 `destroy`。只有逻辑确实独立时才创建 Mgr，几行代码直接写在 Dialog 内。

Mgr 中的输入和玩法定时器同样通过所属 `dialog.event/pixi/interval/timeout` 登记，确保覆盖界面打开后随 Dialog 停止；只有与激活态无关的清理任务才直接使用 `dialog.cleanup`。

Mgr 之间通过 Dialog 协作：

```javascript
this.dialog.ruleMgr.moveLeft()
```

不要互相持有多个全局引用，不使用事件总线解决同一界面内的简单调用。

## 清理

Dialog 内使用：

```javascript
this.event(window, 'keydown', this.onKeyDown)
this.pixi(button, 'pointertap', this.onStart)
this.interval(() => this.spawn(), 2000)
this.timeout(() => this.finish(), 500)
this.cleanup.add(() => this.app.pixi.ticker.remove(this.tick, this))
```

所有权决定销毁位置：

- App 创建的运行环境、App 级 Mgr 和 `DialogMgr` 由 App 销毁。
- Dialog 创建的显示对象、事件和功能 Mgr 由 Dialog 销毁。
- Mgr 创建的内部对象由 Mgr 销毁。
- 项目独占图片、音频等实体资源放在项目的 `assets/`，由根目录的 `XxxAssets.js` 统一静态导入；`public` 只用于必须保留固定 URL 的独立页面或外部构建产物。
- `GameCanvas` 加载的纹理由 `PIXI.Assets` 缓存共享；销毁显示对象时不销毁纹理，游戏运行时也不调用 `PIXI.Assets.unload()`。
- 确实需要释放某个独占资源时，由创建它的项目使用独立资源键并自行卸载，不能按公共 URL 批量卸载。

`destroy()` 应允许重复调用。

## 主题与画风

`game-guide` 只描述颜色、字体、圆角、阴影和动效的建议，不提供对应运行时，也不要求不同游戏保持相同画风。

动效语义、缓动、组件状态和 UI 层级统一参考 [游戏动效、缓动与 UI 设计指南](./motion-ui-guide.md)。该指南规定行为基线，各游戏仍在自己的 `theme.js` 中定义具体视觉令牌。

- 主题属于游戏项目，在项目目录内定义；简单游戏可以直接写在自身组件中，复杂游戏可以建立 `theme.js`。
- 同一游戏的开始、游戏、结算界面应复用自己的主题，避免各界面视觉割裂。
- `GameCanvas` 默认透明，可通过 `GameApp` 的 `backgroundColor`、`backgroundAlpha` 或 `--game-background` 设置游戏背景。
- 资源加载层继承当前游戏样式，可按需设置 `--game-loading-background` 和 `--game-loading-color`。
- 本指南只建议运行环境、生命周期、布局边界和资源所有权，不参与具体美术方向。

## 完成检查

- 新增和修改的代码没有导入 `src/pixi/`。
- 游戏没有导入 `game-guide` 或其他游戏目录中的运行代码。
- 结构遵循 `App -> DialogMgr -> Dialog -> 功能 Mgr`。
- 同一界面的代码优先聚合，拆出的文件使用 `Start`、`Play`、`Result` 等界面前缀，避免无必要的分类子目录。
- 项目实体资源全部位于项目内的 `assets/`，业务代码只通过 `XxxAssets.js` 导出的逻辑键访问。
- App 只挂载跨 Dialog 的通用 Mgr，没有挂载具体功能 Mgr。
- 输入按复杂度放在 Dialog 或 Dialog 级 `InputMgr`，没有全局输入 Mgr。
- 使用浏览器或 Pixi 事件，没有 `EventMgr` 或事件总线。
- 运行数据放在 `app.data`，没有 `DataMgr`。
- Dialog 销毁时，其功能 Mgr、事件和定时器全部停止。
- 游戏场景上打开覆盖 Dialog 时，底层保持可见但停止更新、受管输入和玩法定时器，关闭后恢复。
- Vue 入口没有业务逻辑。
- 没有单例或挂到 `window` 的游戏实例。
- 核心游戏区保持固定坐标和比例，横竖屏只重排浮动 UI。
- 横竖屏变化后核心内容和交互控件仍在画面内。
- 开始、游戏、结算界面的文字和按钮层级一致。
