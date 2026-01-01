// Tetris 游戏事件枚举
export const TetrisEvents = {
    // 玩家列表变化事件
    PlayerChanged: 'playerChanged',
};

// 网络自定义事件 ID 枚举
export const NetEventId = {
    StartGame: 1,
    SyncRobots: 2,
};

export const GameStartMode = {
    Single: 'Single', //单人游戏
    RobotMatch: 'RobotMatch', //机器人对战
    PlayerMatch: 'PlayerMatch', //玩家对战
}