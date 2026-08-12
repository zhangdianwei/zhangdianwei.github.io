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
  game-guide/   内置小游戏模板、公共运行能力和重写指南
  pixi/         待迁移、删除的 PixiJS 遗留能力
  其他目录       独立游戏、工具或实验
public/
  preview/      首页预览图
  video/        视频作品
  其他目录       固定 URL 页面和外部构建产物
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

- 一个功能优先放在一个游戏目录内，多个内置游戏共用的运行能力才放入 `game-guide`；新增和修改的代码不得依赖 `src/pixi`。
- 游戏内部优先按界面聚合文件；拆出的文件用界面名前缀区分，避免只按技术类型增加子目录。
- 每个游戏在项目目录内建立 `assets/` 存放独占图片、音频等实体资源，并通过项目根目录的 `XxxAssets.js` 静态导入和导出具名清单；业务代码只使用逻辑键，只有必须保留固定 URL 的资源才放入 `public`。
- `App.vue` 只负责选择当前项目，项目元数据不写入页面组件。
- 页面离开时必须清理定时器、全局事件、Ticker 和渲染实例。
- 未展示的开发中功能保留在源码中，不混入公共项目清单。
