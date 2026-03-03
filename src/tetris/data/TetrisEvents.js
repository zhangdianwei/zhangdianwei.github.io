// Tetris 游戏事件枚举
export const TetrisEvents = {
    // 玩家列表变化事件
    PlayerChanged: 'playerChanged',
};

export const GameStartMode = {
    Marathon: 'Marathon', // 经典模式
}

export const GameAction = {
    MoveLeft: 'MoveLeft',
    MoveRight: 'MoveRight',
    Rotate: 'Rotate',
    Drop: 'Drop',
    AutoDrop: 'AutoDrop',
    RemoveDropShape: 'RemoveDropShape',
    CreateNewShape: 'CreateNewShape',
    SwitchShape: 'SwitchShape',
    ApplyBuff: 'ApplyBuff',
}

export const BuffType = {
    Clear1Lines: {
        name: 'Clear1Lines',
        desc: '消除1行',
        lineCount: 1,
        maxCount: 10,
    },
    Clear2Lines: {
        name: 'Clear2Lines',
        desc: '消除2行',
        lineCount: 2,
        maxCount: 20,
    },
    Clear3Lines: {
        name: 'Clear3Lines',
        desc: '消除3行',
        lineCount: 3,
        maxCount: 30,
    },
    Add1Lines: {
        name: 'Add1Lines',
        desc: '增加1垃圾行',
        lineCount: 1,
        maxCount: 10,
    },
    Add2Lines: {
        name: 'Add2Lines',
        desc: '增加2垃圾行',
        lineCount: 2,
        maxCount: 20,
    },
    Add3Lines: {
        name: 'Add3Lines',
        desc: '增加3垃圾行',
        lineCount: 3,
        maxCount: 30,
    },
    SpeedUp: {
        name: 'SpeedUp',
        desc: '加速下落',
        targetDiff: -400,
        timeDiff: 10000, //持续多长时间
        maxCount: 10,
    },
    SpeedDown: {
        name: 'SpeedDown',
        desc: '龟速下落，搞心态',
        targetDiff: 500,
        timeDiff: 10000, //持续多长时间
        maxCount: 10,
    },
}
