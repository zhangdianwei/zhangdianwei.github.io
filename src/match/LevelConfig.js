/**
 * 关卡配置
 * 所有关卡都设计为简单易上手的挑战，颜色数量控制在5个以内
 */

export const levelConfigs = [
    // 第1关 - 色彩缤纷
    {
        id: 1,
        name: "色彩缤纷",
        description: "体验多彩世界",
        targetScore: 100,
        minMatchLength: 3,
        colorIndex: [0, 1], // 2种颜色
        dropletCount: [3, 3], // 每种颜色3个水滴
        collectCount: [3, 3] // 每种颜色需要收集3个
    },

    // 第2关 - 长链挑战
    {
        id: 2,
        name: "长链挑战",
        description: "形成更长的匹配链",
        targetScore: 150,
        minMatchLength: 3,
        colorIndex: [0, 1, 2], // 3种颜色
        dropletCount: [4, 4, 4], // 每种颜色4个水滴
        collectCount: [4, 4, 4] // 每种颜色需要收集4个
    },

    // 第3关 - 时间压力
    {
        id: 3,
        name: "时间压力",
        description: "在限定时间内完成目标",
        targetScore: 200,
        minMatchLength: 3,
        colorIndex: [0, 1, 2, 3], // 4种颜色
        dropletCount: [5, 5, 5, 5], // 每种颜色5个水滴
        collectCount: [5, 5, 5, 5] // 每种颜色需要收集5个
    },

    // 第4关 - 大师挑战
    {
        id: 4,
        name: "大师挑战",
        description: "高难度挑战",
        targetScore: 250,
        minMatchLength: 4,
        colorIndex: [0, 1, 2, 3, 4], // 5种颜色
        dropletCount: [6, 6, 6, 6, 6], // 每种颜色6个水滴
        collectCount: [6, 6, 6, 6, 6] // 每种颜色需要收集6个
    },

    // 第5关 - 传奇模式
    {
        id: 5,
        name: "传奇模式",
        description: "传奇级别的挑战",
        targetScore: 300,
        minMatchLength: 4,
        colorIndex: [0, 1, 2, 3, 4], // 5种颜色
        dropletCount: null, // null表示所有水滴数量都无限
        collectCount: [8, 8, 8, 8, 8] // 每种颜色需要收集8个
    },

    // 第6关 - 终极挑战
    {
        id: 6,
        name: "终极挑战",
        description: "终极挑战模式",
        targetScore: 350,
        minMatchLength: 4,
        colorIndex: [0, 1, 2, 3, 4], // 5种颜色
        dropletCount: null,
        collectCount: [10, 10, 10, 10, 10] // 每种颜色需要收集10个
    },

    // 第7关 - 完美风暴
    {
        id: 7,
        name: "完美风暴",
        description: "完美风暴挑战",
        targetScore: 400,
        minMatchLength: 5,
        colorIndex: [0, 1, 2, 3, 4], // 5种颜色
        dropletCount: null,
        collectCount: [12, 12, 12, 12, 12] // 每种颜色需要收集12个
    },

    // 第8关 - 神级挑战
    {
        id: 8,
        name: "神级挑战",
        description: "神级难度挑战",
        targetScore: 450,
        minMatchLength: 5,
        colorIndex: [0, 1, 2, 3, 4], // 5种颜色
        dropletCount: null,
        collectCount: [15, 15, 15, 15, 15] // 每种颜色需要收集15个
    },

    // 第9关 - 无尽挑战
    {
        id: 9,
        name: "无尽挑战",
        description: "无尽挑战模式",
        targetScore: 500,
        minMatchLength: 5,
        colorIndex: [0, 1, 2, 3, 4], // 5种颜色
        dropletCount: null,
        collectCount: [18, 18, 18, 18, 18] // 每种颜色需要收集18个
    },

    // 第10关 - 终极传奇
    {
        id: 10,
        name: "终极传奇",
        description: "终极传奇挑战",
        targetScore: 600,
        minMatchLength: 5,
        colorIndex: [0, 1, 2, 3, 4], // 5种颜色
        dropletCount: null,
        collectCount: [20, 20, 20, 20, 20] // 每种颜色需要收集20个
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