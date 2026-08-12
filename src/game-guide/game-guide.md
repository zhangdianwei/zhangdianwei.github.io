# 内置小游戏框架

本目录用于重写项目内置小游戏。固定结构为：

```text
Vue 入口 -> App -> DialogMgr -> Dialog -> 功能 Mgr
```

金币骑士、田园扫雷、拼图游戏是内嵌网页，不使用本框架。

## 所有权

- Vue 入口只创建和销毁 App。
- App 持有 Pixi 运行环境、资源、公共数据、`dialogMgr` 和少量 App 级通用 Mgr。
- `DialogMgr` 只管理 Dialog 栈和界面切换。
- Dialog 是功能边界，负责创建和销毁当前界面需要的功能 Mgr。
- 功能 Mgr 不能挂到 App，也不能比所属 Dialog 活得更久。

```text
XxxApp
├── audioMgr
├── storageMgr
├── visibilityMgr
├── data
└── dialogMgr
    ├── StartDialog
    ├── PlayDialog
    │   ├── InputMgr
    │   ├── RuleMgr
    │   └── EnemyMgr
    └── ResultDialog
```

`GameApp` 默认提供 `app.data` 普通对象。跨界面保留的分数、配置或进度放在其中，不创建 `DataMgr`。

## 目录结构

```text
src/xxx/
  XxxGame.vue
  XxxApp.js
  XxxData.js              可选
  dialogs/
    StartDialog.js
    PlayDialog.js
    ResultDialog.js
  mgrs/
    InputMgr.js            按需要创建
    RuleMgr.js
```

功能简单时可以减少 Dialog 和 Mgr 文件，不创建空层级。

## Vue 入口

```vue
<script setup>
import { onBeforeUnmount, ref } from 'vue'
import GameCanvas from '../game-guide/GameCanvas.vue'
import XxxApp from './XxxApp.js'

const view = ref(null)
const textureUrls = ['xxx/player.png']
let game

function start(textures) {
  game?.destroy()
  game = new XxxApp(textures)
  game.init(view.value.canvas)
}

onBeforeUnmount(() => game?.destroy())
</script>

<template>
  <GameCanvas ref="view" :texture-urls="textureUrls" @ready="start" />
</template>
```

入口中不写界面切换、输入、规则或定时器。

## App

继承 `GameApp`，通常只需要设置画布参数和打开第一个 Dialog。

```javascript
import { GameApp, gameColors } from '../game-guide/index.js'
import StartDialog from './dialogs/StartDialog.js'

export default class XxxApp extends GameApp {
  constructor(textures) {
    super(textures, {
      shortSide: 640,
      backgroundColor: gameColors.paper,
    })
    this.data.score = 0
  }

  start() {
    this.dialogMgr.push(StartDialog)
  }
}
```

不要把 `inputMgr`、`ruleMgr`、`enemyMgr` 等功能对象放到 App。

## App 级 Mgr

同时满足以下条件才挂到 App：

- 生命周期与整个 App 一致。
- 会被多个 Dialog 共用。
- 不包含具体玩法和界面状态。
- 离开任意一个 Dialog 后仍然有意义。

框架只提供三个模板：

| Mgr | 职责 |
| --- | --- |
| `AudioMgr` | 加载、播放、暂停和关闭音频 |
| `StorageMgr` | 按游戏命名空间读写本地数据 |
| `VisibilityMgr` | 页面进入后台时暂停，回到前台时恢复 |

```javascript
import {
  AudioMgr,
  GameApp,
  StorageMgr,
  VisibilityMgr,
} from '../game-guide/index.js'

export default class XxxApp extends GameApp {
  constructor(textures) {
    super(textures)
    this.audioMgr = this.use(new AudioMgr())
    this.storageMgr = this.use(new StorageMgr('xxx'))
    this.visibilityMgr = this.use(new VisibilityMgr())
  }
}
```

App 级 Mgr 使用 `init(app)`、`pause()`、`resume()`、`destroy()` 生命周期。`app.pause()` 和 `app.resume()` 用于手动暂停；不同暂停原因会分别保留，不会因为页面恢复可见而误取消手动暂停。

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

资源仍由 `GameCanvas` 加载，跨界面数据仍放在 `app.data`。事件总线、输入、规则、关卡、物理、敌人、结算和 HUD 都不是 App 级 Mgr。

## DialogMgr

App 初始化时会自动创建 `dialogMgr`。只使用三个切换方法：

```javascript
this.app.dialogMgr.push(PauseDialog)
this.app.dialogMgr.pop()
this.app.dialogMgr.replace(PlayDialog, { level: 1 })
```

- `push`：隐藏当前界面，打开新界面。
- `pop`：销毁当前界面，显示上一界面。
- `replace`：销毁当前界面并替换为新界面。

只有栈顶 Dialog 每帧更新。尺寸变化时，栈内 Dialog 都会收到 `onResize(screen)`。

## Dialog

Dialog 继承 `GameDialog`，通过生命周期方法组织界面。

```javascript
import { GameDialog } from '../../game-guide/index.js'
import InputMgr from '../mgrs/InputMgr.js'
import RuleMgr from '../mgrs/RuleMgr.js'
import ResultDialog from './ResultDialog.js'

export default class PlayDialog extends GameDialog {
  onCreate(options) {
    this.inputMgr = this.use(new InputMgr())
    this.ruleMgr = this.use(new RuleMgr(options))
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
onCreate -> onResize -> onShow
onHide -> onDestroy
onUpdate
```

Dialog 自身的事件和定时器放入 `this.cleanup`。通过 `this.use(manager)` 登记的功能 Mgr 会在 Dialog 销毁时按创建的反向顺序销毁。

## 输入、事件和数据

简单输入直接写在需要它的 Dialog 中：

```javascript
onCreate() {
  this.onKeyDown = (event) => this.move(event.key)
  this.cleanup.event(window, 'keydown', this.onKeyDown)
}
```

只有按键映射、组合输入、长按或手柄等逻辑明显复杂时，才创建当前 Dialog 持有的 `InputMgr`：

```javascript
this.inputMgr = this.use(new InputMgr())
```

浏览器事件和 Pixi 事件都登记到 `cleanup`，不创建 `EventMgr`：

```javascript
this.cleanup.event(window, 'pointerup', this.onPointerUp)
this.cleanup.pixi(button, 'pointertap', this.onStart)
```

同一 Dialog 内的功能直接调用，界面切换时通过参数传递数据：

```javascript
this.ruleMgr.move(direction)
this.app.dialogMgr.replace(ResultDialog, { score: this.app.data.score })
```

`app.data` 只保存运行数据，`StorageMgr` 只负责需要跨会话保留的数据。两者都不承载规则逻辑。

## 功能 Mgr

Mgr 是某个 Dialog 内相对独立的功能，`init` 和 `destroy` 负责创建与销毁；需要跟随界面启停时再实现 `show` 和 `hide`：

```javascript
export default class InputMgr {
  init(dialog) {
    this.dialog = dialog
    this.onKeyDown = (event) => this.handleKey(event.key)
    dialog.cleanup.event(window, 'keydown', this.onKeyDown)
  }

  handleKey(key) {}

  show() {}

  hide() {}

  destroy() {
    this.dialog = null
  }
}
```

`GameDialog` 会自动转发 `show`、`hide` 和 `destroy`。只有逻辑确实独立时才创建 Mgr，几行代码直接写在 Dialog 内。

Mgr 之间通过 Dialog 协作：

```javascript
this.dialog.ruleMgr.moveLeft()
```

不要互相持有多个全局引用，不使用事件总线解决同一界面内的简单调用。

## 清理

Dialog 内使用：

```javascript
this.cleanup.event(window, 'keydown', this.onKeyDown)
this.cleanup.pixi(button, 'pointertap', this.onStart)
this.cleanup.interval(() => this.spawn(), 2000)
this.cleanup.timeout(() => this.finish(), 500)
this.cleanup.add(() => this.app.pixi.ticker.remove(this.tick, this))
```

所有权决定销毁位置：

- App 创建的运行环境、App 级 Mgr 和 `DialogMgr` 由 App 销毁。
- Dialog 创建的显示对象、事件和功能 Mgr 由 Dialog 销毁。
- Mgr 创建的内部对象由 Mgr 销毁。

`destroy()` 应允许重复调用。

## 视觉约定

复用 `gameTheme.js`：

- 浅纸色背景、深色文字、一个主色和一个强调色。
- 边框约 2px，圆角约 8px，错位阴影约 4px。
- 标题、正文和 HUD 使用 `gameText.title/body/hud`。
- 开始页只放标题、简短玩法说明和一个主按钮。
- 游戏中只显示玩法需要的 HUD。
- 结算页只放结果、关键数据和重开按钮。
- 不使用大面积渐变、发光、长动画或无意义粒子。

每个游戏可以替换主色和强调色，其余层级保持一致。

## 完成检查

- 结构遵循 `App -> DialogMgr -> Dialog -> 功能 Mgr`。
- App 只挂载跨 Dialog 的通用 Mgr，没有挂载具体功能 Mgr。
- 输入按复杂度放在 Dialog 或 Dialog 级 `InputMgr`，没有全局输入 Mgr。
- 使用浏览器或 Pixi 事件，没有 `EventMgr` 或事件总线。
- 运行数据放在 `app.data`，没有 `DataMgr`。
- Dialog 销毁时，其功能 Mgr、事件和定时器全部停止。
- Vue 入口没有业务逻辑。
- 没有单例或挂到 `window` 的游戏实例。
- 横竖屏变化后内容仍在画面内。
- 开始、游戏、结算界面的文字和按钮层级一致。
