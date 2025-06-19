/**
 * 关卡配置
 * 简化版本：去除布局策略和难度设置，使用统一的六边形网格生成
 */

export const levelConfigs = [
// 第1关 - 新手入门
    {
        id: 1,
        name: "新手入门",
        description: "学习基本操作",
        timeLimit: 0, // 0表示不限时
        targetScore: 50,
        minMatchLength: 2,
        colorIndex: [0, 1], // 使用前两种颜色
        dropletCount: [3, 3], // 每种颜色3个水滴
        collectCount: [3, 3] // 每种颜色需要收集3个
    },

    // 第2关 - 基础练习
    {
        id: 2,
        name: "基础练习",
        description: "掌握匹配技巧",
        timeLimit: 0,
        targetScore: 100,
        minMatchLength: 2,
        colorIndex: [0, 1, 2],
        dropletCount: [2, 2, 2],
        collectCount: [2, 2, 2]
    },

    // 第3关 - 技巧提升
    {
        id: 3,
        name: "技巧提升",
        description: "提高匹配效率",
        timeLimit: 0,
        targetScore: 150,
        minMatchLength: 3,
        colorIndex: [0, 1, 2, 3],
        dropletCount: [2, 2, 2, 2],
        collectCount: [2, 2, 2, 2]
    },

    // 第4关 - 时间挑战
    {
        id: 4,
        name: "时间挑战",
        description: "在限定时间内完成目标",
        timeLimit: 120, // 2分钟
        targetScore: 200,
        minMatchLength: 3,
        colorIndex: [0, 1, 2, 3, 4],
        dropletCount: null, // null表示所有水滴数量都无限
        collectCount: [5, 5, 5, 5, 5]
    },

    // 第5关 - 颜色大师
    {
        id: 5,
        name: "颜色大师",
        description: "处理更多颜色",
        timeLimit: 100,
        targetScore: 300,
        minMatchLength: 3,
        colorIndex: [0, 1, 2, 3, 4, 5],
        dropletCount: null, // null表示所有水滴数量都无限
        collectCount: [4, 4, 4, 4, 4, 4]
    },

    // 第6关 - 长链挑战
    {
        id: 6,
        name: "长链挑战",
        description: "形成更长的匹配链",
        timeLimit: 90,
        targetScore: 400,
        minMatchLength: 4,
        colorIndex: [0, 1, 2, 3, 4, 5, 6],
        dropletCount: null, // null表示所有水滴数量都无限
        collectCount: [3, 3, 3, 3, 3, 3, 3]
    },

    // 第7关 - 速度测试
    {
        id: 7,
        name: "速度测试",
        description: "快速匹配挑战",
        timeLimit: 80,
        targetScore: 500,
        minMatchLength: 4,
        colorIndex: [0, 1, 2, 3, 4, 5, 6, 7],
        dropletCount: null, // null表示所有水滴数量都无限
        collectCount: [3, 3, 3, 3, 3, 3, 3, 3]
    },

    // 第8关 - 专家模式
    {
        id: 8,
        name: "专家模式",
        description: "高难度挑战",
        timeLimit: 70,
        targetScore: 600,
        minMatchLength: 4,
        colorIndex: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        dropletCount: null, // null表示所有水滴数量都无限
        collectCount: [2, 2, 2, 2, 2, 2, 2, 2, 2]
    },

    // 第9关 - 大师挑战
    {
        id: 9,
        name: "大师挑战",
        description: "终极挑战",
        timeLimit: 60,
        targetScore: 700,
        minMatchLength: 5,
        colorIndex: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        dropletCount: null, // null表示所有水滴数量都无限
        collectCount: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    },

    // 第10关 - 传奇模式
    {
        id: 10,
        name: "传奇模式",
        description: "传奇级别的挑战",
        timeLimit: 50,
        targetScore: 800,
        minMatchLength: 5,
        colorIndex: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        dropletCount: null, // null表示所有水滴数量都无限
        collectCount: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    }
];

/**
 * 获取关卡配置
 * @param {number} levelId - 关卡ID
 * @returns {Object|null} - 关卡配置对象，如果不存在返回null
 */
export function getLevelConfig(levelId) {
    return levelConfigs.find(config => config.id === levelId) || null;
}

/**
 * 获取所有关卡配置
 * @returns {Array} - 所有关卡配置数组
 */
export function getAllLevelConfigs() {
    return levelConfigs;
} 