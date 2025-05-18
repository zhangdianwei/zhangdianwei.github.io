// 玩家等级数据类
export default class PlayerLevelData {
    // 可根据需要扩展更多属性
    // 每个等级的数据以数组或对象形式存储
    static levels = [
        // Lv.1
        {
            maxHp: 100,
            weaponFireInterval: 100, // ms
            expToLevel: 100
        },
        // Lv.2
        {
            maxHp: 120,
            weaponFireInterval: 85,
            expToLevel: 120
        },
        // Lv.3
        {
            maxHp: 140,
            weaponFireInterval: 72,
            expToLevel: 144
        },
        // Lv.4
        {
            maxHp: 160,
            weaponFireInterval: 61,
            expToLevel: 173
        },
        // Lv.5
        {
            maxHp: 180,
            weaponFireInterval: 52,
            expToLevel: 207
        },
        // Lv.6
        {
            maxHp: 200,
            weaponFireInterval: 44,
            expToLevel: 248
        },
        // Lv.7
        {
            maxHp: 220,
            weaponFireInterval: 38,
            expToLevel: 298
        },
        // Lv.8
        {
            maxHp: 240,
            weaponFireInterval: 33,
            expToLevel: 358
        },
        // Lv.9
        {
            maxHp: 260,
            weaponFireInterval: 30,
            expToLevel: 430
        },
        // Lv.10及以后
        {
            maxHp: 280,
            weaponFireInterval: 30,
            expToLevel: 516
        }
    ];

    // 获取指定等级的数据（等级从1开始）
    static getLevelData(level) {
        if (level <= 0) return this.levels[0];
        if (level > this.levels.length) return this.levels[this.levels.length - 1];
        return this.levels[level - 1];
    }
}
