# PIXI 游戏环境搭建指南

本模块提供了基于 PIXI.js 的基础游戏环境搭建工具。

## 模块结构

```
src/pixi/
├── PixiHelper.js      # PIXI 应用创建和DOM初始化工具
├── PixiLoader.vue     # 纹理资源加载组件
├── PixiAction.js      # 常用动画效果
├── PixiUI.js          # UI交互工具
└── readme.md          # 本文档
```

## 核心架构

### GameApp.js - 数据存储容器

```javascript
export class GameApp {
    static _instance;

    constructor() {
        this.pixi = null;
        this.gameContainer = null;
        this.gameObjects = [];
        this.textures = {};
        this.gameLogic = null;
    }

    static get instance() {
        if (!GameApp._instance) {
            GameApp._instance = new GameApp();
        }
        return GameApp._instance;
    }
}
```

### GameLogic.js - 游戏逻辑控制器

```javascript
import * as PIXI from 'pixi.js';
import { createPixi, initDom } from './pixi/PixiHelper';
import * as TWEEN from '@tweenjs/tween.js';
import { GameApp } from './GameApp';

export class GameLogic {
    constructor() {
        this.gameApp = GameApp.instance;
        this.gameObjects = [];
    }

    init(domElement) {
        // 初始化DOM尺寸
        initDom(domElement, {
            designWidth: 1920,
            designHeight: 1080,
            isFullScreen: true
        });
        
        this.gameApp.pixi = createPixi(domElement);
        this.gameApp.gameContainer = new PIXI.Container();
        this.gameApp.pixi.stage.addChild(this.gameApp.gameContainer);
        
        this.gameApp.pixi.ticker.add(() => TWEEN.update());
        this.gameApp.pixi.ticker.add(this.update.bind(this));
    }

    createGameObjects() {
        // 创建游戏对象
    }

    update(delta) {
        // 游戏逻辑更新
    }

    destroy() {
        if (this.gameApp.pixi) {
            this.gameApp.pixi.destroy(true);
        }
    }
}
```

### Game.vue - 游戏组件

```vue
<template>
    <div class="game-container">
        <PixiLoader 
            :textureUrls="textureUrls" 
            @loaded="onTexturesLoaded"
        />
        <canvas ref="gameContainer" v-show="texturesLoaded"></canvas>
    </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import PixiLoader from './pixi/PixiLoader.vue';
import { GameApp } from './GameApp';
import { GameLogic } from './GameLogic';

const gameContainer = ref(null);
const texturesLoaded = ref(false);
const textureUrls = ref(['/public/texture1.png']);

const gameApp = GameApp.instance;
gameApp.gameLogic = new GameLogic();

const onTexturesLoaded = (textures) => {
    texturesLoaded.value = true;
    gameApp.textures = textures;
    gameApp.gameLogic.init(gameContainer.value);
    gameApp.gameLogic.createGameObjects();
};

onUnmounted(() => {
    gameApp.gameLogic.destroy();
});
</script>
```

## 功能模块

### 资源加载

```vue
<PixiLoader 
    :textureUrls="['/public/player.png']" 
    @loaded="onTexturesLoaded"
/>
```

### 动画效果

```javascript
import { appear, disappear, scaleOnce } from './pixi/PixiAction';

await appear(gameObject);
await disappear(gameObject);
await scaleOnce(gameObject);
```

### UI交互

```javascript
import { makeButton } from './pixi/PixiUI';

makeButton(button, () => {
    console.log('按钮被点击');
});
```

## 最佳实践

1. **单例模式**: GameApp 使用单例模式作为数据存储容器
2. **逻辑分离**: 游戏逻辑写在 GameLogic 类中，Vue 组件只负责生命周期管理
3. **资源预加载**: 使用 PixiLoader 预加载所有纹理资源
4. **内存管理**: 及时销毁不需要的游戏对象和纹理
5. **生命周期管理**: 在 Vue 组件的 onUnmounted 中清理资源

## 如何使用本文档
比如我会提示你“参考这个文档，初始化xxx”
你就参考这个文档里的示例代码，在xxx目录下创建各个文件。
但是要注意把GameApp和GameLogic替换为XXXApp何XXXLogic。