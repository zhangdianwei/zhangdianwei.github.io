# ZhangDW Projects

个人游戏、工具与图形实验集合，使用 Vue 3、Vite、View UI Plus、PixiJS 和 Three.js 构建。

## 开发

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 结构

```text
src/
  app/          首页、项目清单和公共页面外壳
  assets/       全局基础样式
  game-common/  内置小游戏模板、公共运行能力和重写指南
  pixi/         PixiJS 公共能力
  其他目录       独立游戏、工具或实验
public/
  preview/      首页预览图
  video/        视频作品
  其他目录       游戏运行资源和外部构建产物
```

项目入口统一配置在 `src/app/projects.js`。页面使用现有哈希地址，不额外引入路由库；组件使用异步加载，避免首页打包全部项目代码。

## 新增项目

1. 在 `src` 下建立独立目录或组件。
2. 将预览图放入 `public/preview`，推荐使用 16:10 或接近比例的图片。
3. 在 `src/app/projects.js` 对应分类中增加配置。
4. 全屏游戏设置 `layout: 'fullscreen'`，普通工具页使用默认留白。
5. 限制平台时设置 `platforms: ['desktop']` 或 `platforms: ['mobile']`。

外部页面和视频分别复用 `EasyLink.vue` 与 `ShowVideo.vue`，通过 `props.src` 传入资源地址。

## 视觉约定

- 首页使用浅色绘图纸背景、手绘线条和少量分类色。
- 间距以 8px 为基本节奏，面板圆角控制在 6px 至 8px。
- 表单、按钮、卡片、提示和图标优先使用 View UI Plus。
- 子项目统一使用无导航空壳，首页负责项目入口。
- 游戏内部可以保留自己的视觉风格，不强制套用公共页面样式。
- 全局视觉变量集中在 `src/assets/app.css`，组件只保留自身布局样式。

## 代码约定

- 一个功能优先放在一个目录内，公共能力才放入 `game-common` 或 `pixi`。
- `App.vue` 只负责选择当前项目，项目元数据不写入页面组件。
- 页面离开时必须清理定时器、全局事件、Ticker 和渲染实例。
- 未展示的开发中功能保留在源码中，不混入公共项目清单。
