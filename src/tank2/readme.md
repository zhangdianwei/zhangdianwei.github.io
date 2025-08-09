# 坦克大战游戏

## 项目概述
基于HTML5 Canvas的坦克大战游戏，复刻经典FC游戏《坦克大战》。

## 资源文件
游戏资源位于 `public/tank2/` 目录下：
- 地图瓦片：`bigtile_*.png`
- 玩家坦克：`player1_run_*.png`
- 敌人坦克：`enermys/enermy_*_run_*.png`
- 动画资源：`born_*.png`, `explode_*.png`

## 地图系统

### 地图规格
- **尺寸**：24行 × 26列
- **瓦片大小**：32×32像素

### 地图元素类型
| 类型 | 数值 | 名称 | 图片资源 | 说明 |
|------|------|------|----------|------|
| 0 | 空地 | - | 可通行区域 |
| 1 | 砖块 | `bigtile_1_tile_1.png` | 可被子弹摧毁 |
| 2 | 铁块 | `bigtile_2_tile_1.png` | 不可摧毁 |
| 3 | 草地 | `bigtile_3_tile_1.png` | 装饰性，不影响移动 |
| 4 | 水面 | `bigtile_4_tile_1.png` | 不可通行 |
| 5 | 预留 | - | 暂时未使用 |
| 6 | 老窝 | `bigtile_6.png` | 4个tile组成，需要保护 |

### 渲染层级
1. **RenderLayer1**：空地背景
2. **RenderLayer2**：砖块、铁块、水面、老窝
3. **RenderLayer3**：敌人坦克
4. **RenderLayer4**：玩家坦克
5. **RenderLayer5**：子弹层
6. **RenderLayer6**：草地（装饰层）

## 坦克系统

### 坦克状态
- **静止状态**：使用第一帧图片
- **行走状态**：两张图片交替播放实现动画

### 坦克类型
- **玩家坦克**：`player1_run_1.png`, `player1_run_2.png`
- **敌人坦克**：`enermys/enermy_*_run_*.png`（4种类型）

## 关卡配置
```javascript
{
  map: [],           // 地图配置数组
  totalEnemies: 20,  // 关卡总敌人数量
  maxEnemiesOnScreen: 4,  // 场上最大敌人数量
  enemySpawnRates: {      // 各类型敌人生成概率
    type1: 0.4,
    type2: 0.3,
    type3: 0.2,
    type4: 0.1
  },
  itemDropRates: {        // 道具掉落概率
    life: 0.1,
    stop: 0.15,
    iron: 0.1,
    bomb: 0.05,
    star: 0.1,
    shield: 0.1
  }
}
```

## 道具系统
| 道具 | 效果 | 持续时间 | 说明 |
|------|------|----------|------|
| Bonus_Life | 增加生命值 | 永久 | 玩家生命+1 |
| Bonus_Stop | 暂停敌人 | 6秒 | 所有敌人停止移动 |
| Bonus_Iron | 基地保护 | 永久 | 基地周围变成铁块 |
| Bonus_Bomb | 全屏爆炸 | 瞬间 | 清除场上所有敌人 |
| Bonus_Star | 武器升级 | 永久 | 提升子弹威力 |
| Bonus_Shield | 无敌状态 | 6秒 | 玩家暂时无敌 |

## 控制方式
- **移动**：方向键（↑↓←→）
- **射击**：空格键
- **暂停**：P键
- **重新开始**：R键

## 游戏流程
1. 加载游戏地图
2. 播放玩家出现动画
3. 不断生成敌人
4. 播放结算界面
5. 进入下一关

## 动画系统
- **出现动画**：`born_1.png` 到 `born_6.png`（6帧循环）
- **爆炸动画**：`explode_1.png` 到 `explode_3.png`（3帧播放）

## 代码结构


## 技术栈
参考pixi/readme.md



