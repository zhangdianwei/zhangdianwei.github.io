import { getLevelConfig, getAllLevelConfigs } from './LevelConfig.js';
import Cell from './Cell.js';

/**
 * 关卡管理器类
 * 负责根据关卡ID读取配置并生成关卡
 */
export default class LevelManager {
    constructor(gameApp) {
        this.gameApp = gameApp;
        this.currentLevel = null;
        this.currentLevelConfig = null;
        this.colorPool = {}; // 颜色池，格式：{colorIndex: count}
        this.cols = 6; // 网格列数
        this.rows = 6; // 网格行数
        this.preferedCellCount = this.cols * this.rows; // 预估水滴数量
        this.levelState = {
            currentScore: 0,
            colorScores: {}, // 每种颜色的当前分数
            timeRemaining: 0,
            isCompleted: false,
            isFailed: false
        };
        this.scoreByColor = {}; // 颜色分数统计

        // 游戏状态管理
        this.isGameActive = false; // 游戏是否活跃（可以接受玩家输入）
        this.isLevelCompleted = false; // 关卡是否已完成（数据层面）
        this.isGameEnded = false; // 游戏是否已结束（结算界面已显示）
    }

    /**
     * 加载关卡
     * @param {number} levelId - 关卡ID
     */
    loadLevel(levelId) {
        try {
            // 清理当前关卡
            this.clearCurrentLevel();

            // 获取关卡配置
            this.currentLevelConfig = getLevelConfig(levelId);
            if (!this.currentLevelConfig) {
                throw new Error(`关卡 ${levelId} 不存在`);
            }

            this.currentLevelId = levelId;
            this.currentScore = 0;
            this.countByColor = {};
            this.scoreByColor = {}; // 初始化颜色分数统计

            // 重置游戏状态
            this.isGameActive = false;
            this.isLevelCompleted = false;
            this.isGameEnded = false;

            // 初始化颜色分数记录
            this.currentLevelConfig.colorIndex.forEach(colorIndex => {
                this.countByColor[colorIndex] = 0;
                this.scoreByColor[colorIndex] = 0; // 初始化颜色分数
            });

            // 生成六边形网格布局
            this.initColorPool();

            this.checkAndGenerateCells();

            // 开始游戏
            this.startGame();

            // 初始化关卡信息UI
            if (this.gameApp.uiManager) {
                this.gameApp.uiManager.initLevelInfoUI();
            }

            console.log(`关卡 ${levelId} 加载成功`);
        } catch (error) {
            console.error('加载关卡失败:', error.message);
        }
    }

    /**
     * 清理当前关卡
     */
    clearCurrentLevel() {
        // 移除所有水滴
        if (this.gameApp.cells) {
            const cells = this.gameApp.cells.children.concat([]);
            cells.forEach(cell => {
                this.gameApp.removeCell(cell);
            });
        }

        // 重置所有状态
        this.isGameActive = false;
        this.isLevelCompleted = false;
        this.isGameEnded = false;
        this.currentLevelConfig = null;
        this.currentLevelId = null;
        this.colorPool = null; // 重置颜色池
    }

    getColorPoolRemainCount() {
        // 如果颜色池为null，表示无限模式
        if (this.colorPool === null) {
            return null;
        }

        return Object.values(this.colorPool).reduce((acc, count) => acc + count, 0);
    }

    /**
     * 初始化颜色池
     */
    initColorPool() {
        const config = this.currentLevelConfig;

        if (config.dropletCount === null) {
            // 无限水滴：颜色随机，不限制数量
            this.colorPool = null;
        } else {
            // 有限水滴：根据配置限制数量
            this.colorPool = {};
            config.colorIndex.forEach((colorIndex, colorArrayIndex) => {
                this.colorPool[colorIndex] = config.dropletCount[colorArrayIndex];
            });
        }
    }

    /**
     * 生成指定数量的水滴
     * @param {number} count - 需要生成的水滴数量
     */
    generateCellsByCount(count) {
        const screenWidth = this.gameApp.pixi.screen.width;
        const screenHeight = this.gameApp.pixi.screen.height;

        const gridSize = 150;

        // 计算这批水滴需要的行数
        const rowsNeeded = Math.ceil(count / this.cols);
        const colsNeeded = Math.ceil(count / rowsNeeded);

        // 计算整体区域的尺寸
        const totalWidth = colsNeeded * gridSize;
        const totalHeight = rowsNeeded * gridSize;

        // 计算居中偏移
        const offsetX = (screenWidth - totalWidth) / 2;
        const offsetY = (screenHeight - totalHeight) / 2 - 50;

        // 生成水滴
        for (let i = 0; i < count; i++) {
            // 计算水滴应该放置的位置（这批水滴内部的位置）
            const row = Math.floor(i / this.cols);
            const col = i % this.cols;

            const x = offsetX + col * gridSize + gridSize / 2;
            const y = offsetY + row * gridSize + gridSize / 2;

            // 随机分配颜色
            const colorIndex = this.getRandomColorFromPool();
            if (colorIndex !== null) {
                // 生成水滴的点
                const points = [];
                const radius = Math.floor(gridSize * 0.4);
                const numSides = 6; // 六边形

                for (let j = 0; j < numSides; j++) {
                    const angle = (j / numSides) * Math.PI * 2;
                    const pointX = x + Math.cos(angle) * radius;
                    const pointY = y + Math.sin(angle) * radius;
                    points.push({ x: pointX, y: pointY });
                }

                // 创建并添加水滴
                const cell = new Cell();
                cell.colorIndex = colorIndex;
                cell.setPoints(points);
                this.gameApp.addCell(cell);
            }
        }
    }

    /**
     * 从颜色池中随机获取一种颜色
     * @returns {number|null} - 颜色索引，如果池子为空返回null
     */
    getRandomColorFromPool() {
        // 如果颜色池为null，表示无限模式，从所有颜色中随机选择
        if (this.colorPool === null) {
            const allColors = this.currentLevelConfig.colorIndex;
            const randomIndex = Math.floor(Math.random() * allColors.length);
            return allColors[randomIndex];
        }

        // 有限模式：获取所有还有剩余数量的颜色
        const availableColors = Object.keys(this.colorPool).filter(colorIndex => this.colorPool[colorIndex] > 0);

        if (availableColors.length === 0) {
            return null; // 池子为空
        }

        // 随机选择一个颜色
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        const selectedColor = parseInt(availableColors[randomIndex]);

        // 减少该颜色的剩余数量
        this.colorPool[selectedColor]--;

        return selectedColor;
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.isGameActive = true; // 游戏开始，可以接受玩家输入
    }

    /**
     * 更新分数
     * @param {number} score - 增加的分数
     * @param {number} colorIndex - 颜色索引
     */
    updateScore(score, colorIndex) {
        // 只有在游戏活跃且关卡未完成时才允许更新分数
        if (!this.isGameActive || !this.currentLevelConfig || this.isLevelCompleted) {
            return null;
        }

        // 更新颜色分数
        if (!this.countByColor[colorIndex]) {
            this.countByColor[colorIndex] = 0;
        }
        this.countByColor[colorIndex] += 1;

        // 更新颜色分数统计
        if (!this.scoreByColor[colorIndex]) {
            this.scoreByColor[colorIndex] = 0;
        }
        this.scoreByColor[colorIndex] += score;

        // 更新总分数
        this.currentScore += score;

        // 检查是否完成关卡
        const levelCompleted = this.checkLevelCompletion();

        // 如果关卡完成，记录状态并停止接受玩家输入
        if (levelCompleted && !this.isLevelCompleted) {
            this.isLevelCompleted = true;
            this.isGameActive = false; // 停止接受玩家输入
            console.log('关卡完成！停止接受玩家输入，等待动画播放完毕...');
        }

        return {
            score: score,
            colorIndex: colorIndex,
            count: this.countByColor[colorIndex],
            currentScore: this.currentScore,
            levelCompleted: levelCompleted,
            scoreByColor: { ...this.scoreByColor }
        }
    }

    /**
     * 检查关卡完成状态
     * @returns {boolean} - 是否完成关卡
     */
    checkLevelCompletion() {
        if (!this.currentLevelConfig) return false;

        const config = this.currentLevelConfig;
        let allColorsCompleted = true;

        // 检查每种颜色是否达到目标
        config.colorIndex.forEach((colorIndex, index) => {
            const currentScore = this.countByColor[colorIndex] || 0;
            const targetScore = config.collectCount[index];

            if (currentScore < targetScore) {
                allColorsCompleted = false;
            }
        });

        return allColorsCompleted;
    }

    /**
     * 检查关卡是否已完成（数据层面）
     * @returns {boolean} - 关卡是否已完成
     */
    isLevelFinished() {
        return this.isLevelCompleted;
    }

    /**
     * 检查游戏是否已结束（结算界面已显示）
     * @returns {boolean} - 游戏是否已结束
     */
    isGameFinished() {
        return this.isGameEnded;
    }

    /**
     * 检查是否可以接受玩家输入
     * @returns {boolean} - 是否可以接受玩家输入
     */
    canAcceptInput() {
        return this.isGameActive && !this.isLevelCompleted && !this.isGameEnded;
    }

    /**
     * 结束游戏
     * @param {boolean} isWin - 是否胜利
     */
    endGame(isWin) {
        // 防止重复调用
        if (this.isGameEnded) return;

        // 设置游戏结束状态
        this.isGameEnded = true;
        this.isGameActive = false;
        this.isLevelCompleted = true;

        // 准备结算数据
        const settlementData = {
            isWin: isWin,
            levelId: this.currentLevelId,
            levelName: this.currentLevelConfig.name,
            levelConfig: this.currentLevelConfig, // 传递完整的关卡配置
            currentScore: this.currentScore,
            targetScore: this.currentLevelConfig.targetScore,
            countByColor: { ...this.countByColor },
            scoreByColor: { ...this.scoreByColor }, // 添加颜色分数统计
            targetCounts: { ...this.currentLevelConfig.collectCount }
        };

        // 显示结算界面
        this.gameApp.settlementManager.showSettlement(settlementData);

        if (isWin) {
            console.log(`关卡 ${this.currentLevelId} 胜利！`);
        } else {
            console.log(`关卡 ${this.currentLevelId} 失败！`);
        }
    }

    /**
     * 获取当前关卡信息
     * @returns {Object} - 关卡信息
     */
    getCurrentLevelInfo() {
        if (!this.currentLevelConfig) return null;

        return {
            id: this.currentLevelId,
            name: this.currentLevelConfig.name,
            description: this.currentLevelConfig.description,
            currentScore: this.currentScore,
            targetScore: this.currentLevelConfig.targetScore,
            countByColor: this.countByColor,
            isGameActive: this.isGameActive
        };
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.clearCurrentLevel();
        this.isGameActive = false;
    }

    /**
     * 检查并生成水滴
     * 当场上的水滴数量少于 preferedCellCount 时，生成一批水滴让数量接近 preferedCellCount
     * 同时考虑当前关卡还剩余多少个水滴可以生成
     */
    checkAndGenerateCells() {
        const currentCellCount = this.gameApp.cells.children.length;
        const needToGenerate = this.preferedCellCount - currentCellCount;
        if (needToGenerate <= 0) {
            return;
        }

        let actualGenerateCount = 0;
        if (this.colorPool === null) {
            // 无限池
            actualGenerateCount = needToGenerate;
        }
        else {
            // 有限池
            actualGenerateCount = Math.min(needToGenerate, this.getColorPoolRemainCount());
        }

        if (actualGenerateCount > 0) {
            this.generateCellsByCount(actualGenerateCount);
        }
    }

    /**
     * 生成六边形网格布局
     * 将屏幕分成相同大小的格子，每个格子生成一个六边形的顶点
     */
    generateHexagonalGridLayout() {
    // 初始化颜色池

    }

    /**
     * 计算屏幕能容纳的最大水滴数量
     * @returns {number} - 最大水滴数量
     */
    calculateMaxScreenCapacity() {
        // 使用成员变量的网格布局
        return this.cols * this.rows; // 36个水滴
    }
}

