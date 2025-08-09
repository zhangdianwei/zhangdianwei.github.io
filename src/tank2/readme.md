# 要求
这是一个坦克大战游戏。
资源在public/tank2里面。

# 地图配置
一个标准的地图配置是24行x26列。
最小单位是Tile:
0=空地
1=砖块(Brick)=bigtile_1_tile_1.png=占1个tile
2=铁块(Iron)=bigtile_2_tile_1.png=占1个tile
3=草地(Grass)=bigtile_3_tile_1.png=占1个tile
4=水面(Water)=bigtile_4_tile_1.png=占1个tile
5=暂时留空
6=老窝(Home)=bigtile_6.png=占4个tile组成一个BigTile

渲染层级（从下到上）：
RenderLayer1=空地
RenderLayer2=砖块，铁块，水面，老窝
RenderLayer3=敌人坦克
RenderLayer4=玩家坦克
RenderLayer5=子弹层
RenderLayer6=草地

# 坦克配置
每个坦克都有静止状态和行走状态两种。
每个坦克都由2张图片组成，静止状态就用图片1，行走时就两张图片切换。
有2种玩家坦克+4种敌人坦克。但是现在只考虑1种玩家坦克。
玩家坦克=player1_run_1.png,player1_run_2.png
敌人坦克1=enermys/enermy_1_run_1.png,enermys/enermy_1_run_2.png
敌人坦克2=enermys/enermy_2_run_1.png,enermys/enermy_2_run_2.png

# 关卡配置
关卡配置由以下组成：
地图配置
这一关有多少个敌人
场上最多能有多少个敌人
随机出每种敌人的概率是多少
每个敌人掉落道具的概率是多少


# 道具系统
1=Bonus_Life=加命
2=Bonus_Stop=暂停敌人行动一段时间(6秒)
3=Bonus_Iron=把老窝周围一圈变成铁块
4=Bonus_Bomb=炸掉场上所有敌人
5=Bonus_Star=升级武器
6=Bonus_Shief=玩家无敌一段时间(6秒)

# 界面布局
    title_and_levelinfo
            map
move_control|shoot_control

# 游戏流程
加载游戏地图
播放玩家出现动画
不断生成敌人
播放结算界面
进入下一关

# 动画
出现动画：轮流播放born_1.png到born_6.png
爆炸动画：explode_1.png到explode_3.png

# 代码结构



