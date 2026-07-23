# 小游戏开发示例文档

本文档描述本项目里小游戏的标准写法，照着做即可新增一个基于 PIXI 的小游戏。

## 整体结构

一个游戏由四层组成，职责单一：

```
XxxGame.vue   # 入口：只管 Vue 生命周期、加载资源、创建/销毁 App
XxxApp.js     # 主控：单例，持有 pixi/ticker/textures/data，负责界面切换
XxxData.js    # 数据：纯游戏数据(分数/关卡/玩家状态)，无渲染，挂在 app.data
XxxUI.js      # 界面：一个 PIXI.Container 就是一个界面(开始/游戏/结算)
```

数据流：`XxxGame.vue` 加载完纹理 → 调 `XxxApp.instance.init()` → App 用 `pushDialog` 挂第一个界面 → 界面之间通过 `pushDialog/popDialog/replaceDialog` 切换。

---

## 入口 XxxGame.vue

只做三件事：预加载纹理、初始化 App、卸载时销毁 App。业务逻辑一律不写在这里。

```vue
<template>
    <div class="game-container">
        <TextureLoader :textureUrls="textureUrls" @loaded="onTexturesLoaded" />
        <canvas ref="gameContainer"></canvas>
    </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import TextureLoader from '../game-common/TextureLoader.vue';
import { XxxApp } from './XxxApp.js';

const gameContainer = ref(null);
const textureUrls = ref([
    'xxx/player.png',
    'xxx/enemy.png',
]);

const app = XxxApp.instance;

const onTexturesLoaded = (textures) => {
    app.textures = textures;
    app.init(gameContainer.value);
};

onUnmounted(() => {
    app.makeDead();
});
</script>
```

- 纹理路径相对 `public/`，例如 `'xxx/player.png'` 指向 `public/xxx/player.png`。
- `canvas` 用 `ref` 拿到后传给 `app.init`。

---

## 主控 XxxApp.js

单例，是整个游戏的“全局对象”。持有 pixi、ticker、纹理、玩家数据，并负责界面切换。

```javascript
import * as PIXI from 'pixi.js';
import { createGameApp } from '../game-common/createGameApp.js';
import XxxData from './XxxData.js';
import XxxStartUI from './XxxStartUI.js';
import XxxGameUI from './XxxGameUI.js';
import XxxEndUI from './XxxEndUI.js';

export class XxxApp {
    static _instance;

    constructor() {
        this.pixi = null;
        this.textures = {};
        this.data = null;          // 游戏数据(XxxData)
        this.dialogs = [];         // 界面栈，栈顶是当前界面
        this.uiContainer = null;   // 界面容器，原点在屏幕中心
    }

    static get instance() {
        if (!XxxApp._instance) {
            XxxApp._instance = new XxxApp();
        }
        return XxxApp._instance;
    }

    init(domElement) {
        // 屏幕适配 + 创建 PIXI 应用
        this.pixi = createGameApp(domElement, 640);

        // 界面容器放到屏幕中心，界面内部坐标以中心为原点
        this.uiContainer = new PIXI.Container();
        this.pixi.stage.addChild(this.uiContainer);
        this.uiContainer.position.set(this.winW / 2, this.winH / 2);

        // 主循环，转发给当前界面
        this.pixi.ticker.add(this.update, this);

        // 创建游戏数据
        this.data = new XxxData();

        // 挂第一个界面
        this.pushDialog(new XxxStartUI());
    }

    get topDialog() {
        return this.dialogs[this.dialogs.length - 1];
    }

    // 压栈：新界面盖在上面，旧界面隐藏
    pushDialog(dialog) {
        if (this.topDialog) this.topDialog.visible = false;
        this.dialogs.push(dialog);
        this.uiContainer.addChild(dialog);
    }

    // 弹栈：移除栈顶，回到上一个界面
    popDialog() {
        const dialog = this.dialogs.pop();
        if (dialog) dialog.removeFromParent();
        if (this.topDialog) this.topDialog.visible = true;
    }

    // 替换栈顶：弹掉当前再压入新界面
    replaceDialog(dialog) {
        this.popDialog();
        this.pushDialog(dialog);
    }

    update(dt) {
        if (this.topDialog && this.topDialog.update) this.topDialog.update(dt);
    }

    get winW() { return this.pixi.screen.width; }
    get winH() { return this.pixi.screen.height; }

    makeDead() {
        if (this.pixi) {
            this.pixi.destroy(true);
            this.pixi = null;
        }
        this.dialogs = [];
        this.data = null;
        this.uiContainer = null;
    }
}
```

要点：

- **单例**：`XxxApp.instance` 全局唯一，`window.app = app` 方便调试(可选)。
- **init 顺序固定**：先用 `createGameApp` 适配屏幕并创建 PIXI 应用，再建容器，最后挂界面。
- **界面切换只走 `pushDialog/popDialog/replaceDialog`**：`push` 压栈盖新界面(旧的隐藏)、`pop` 回上一个、`replace` 替换栈顶(开始→游戏这种整屏切换用它)。
- **`makeDead` 必须清干净**：`pixi.destroy(true)` 会连带销毁子节点，Vue 卸载时调用，避免内存泄漏。

---

## 界面 XxxUI.js

一个界面 = 一个继承 `PIXI.Container` 的类。

```javascript
import * as PIXI from 'pixi.js';

export default class XxxStartUI extends PIXI.Container {
    constructor() {
        super();
    }
  	update() {
      
    }
}
```

要点：

- 界面尺寸都基于 `app.winW / winH` 按比例算，天然适配不同屏幕。
- 需要每帧更新的界面(如游戏界面)实现 `update(dt)`，`XxxApp.update` 会自动转发给栈顶界面。

---

## 数据 XxxData.js

纯数据类，存分数、关卡、玩家状态等，不碰渲染。由 App 在 `init` 时创建并持有(`app.data`)，各界面通过 `this.app.data` 读写。

```javascript
export default class XxxData {
    constructor() {
        this.reset();
    }

    reset() {
        this.score = 0;
        this.level = 1;
    }
}
```

- 数据和界面分离：界面切换、重开游戏时数据仍在，只需 `app.data.reset()`。

---

## 公共组件速查

`src/game-common/` 下的公共组件，直接复用，不要重写：

### 屏幕适配 + 创建应用（createGameApp.js）

```javascript
import { createGameApp } from '../game-common/createGameApp.js';

this.pixi = createGameApp(domElement, 640);
```

- `designNum` 是正方形基准分辨率：不管横屏竖屏，短边恒等于 `designNum`，长边按实际屏幕比例伸展，不裁剪、不留黑边。
- 用 `this.pixi.screen.width / this.pixi.screen.height` 读实际逻辑宽高（即 `winW/winH`）。
- 横竖屏的具体布局怎么摆，由各游戏自己判断 `winW/winH` 的比值（>1 横屏，<1 竖屏）决定，公共代码不做假设。

### 纹理预加载（TextureLoader.vue）

```vue
<TextureLoader :textureUrls="['xxx/a.png', 'xxx/b.png']" @loaded="onTexturesLoaded" />
```

- `@loaded` 回调收到 `{ url: PIXI.Texture }` 映射；`textureUrls` 传 `[]` 会立即触发 `loaded`。
- 加载失败或超时(默认 15s)会显示错误信息和"重试"按钮，不会卡死。

---

## 接入首页

游戏做好后，在 `src/app/App.vue` 的 `categoryRoutes` 里加一项，即可出现在首页：

```javascript
import XxxGame from "../xxx/XxxGame.vue";

// 在某个分类的 children 里：
{ id: "XxxGame", title: "我的游戏", comp: XxxGame, img: "preview/XxxGame.png" },
// 只支持桌面端时加：platforms: ["desktop"]
```

- `img` 是首页封面，放在 `public/preview/` 下。
- `id` 是路由 hash，点击后 URL 变成 `#XxxGame`。

---

## 新建游戏步骤清单

1. 新建目录 `src/xxx/`，把游戏资源放到 `public/xxx/`。
2. 写 `XxxApp.js`：单例 + `init` + `pushDialog/popDialog/replaceDialog` + `makeDead`。
3. 写 `XxxData.js`：纯数据 + `reset`，在 `XxxApp.init` 里 new 出来挂到 `app.data`。
4. 写各界面 `XxxStartUI.js / XxxGameUI.js / XxxEndUI.js`(继承 `PIXI.Container`)。
5. 写入口 `XxxGame.vue`：`TextureLoader` 加载纹理 → `app.init` → `onUnmounted` 里 `app.makeDead`。
6. 在 `src/app/App.vue` 的 `categoryRoutes` 注册路由，放好封面图。
