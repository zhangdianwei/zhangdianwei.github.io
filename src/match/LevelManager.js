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
        this.levelState = {
            currentScore: 0,
            colorScores: {}, // 每种颜色的当前分数
            timeRemaining: 0,
            isCompleted: false,
            isFailed: false
        };
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
            this.currentTime = 0;
            this.countByColor = {};

            // 初始化颜色分数记录
            this.currentLevelConfig.colorIndex.forEach(colorIndex => {
                this.countByColor[colorIndex] = 0;
            });

            // 生成六边形网格布局
            this.generateHexagonalGridLayout();

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

        this.isGameActive = false;
        this.currentLevelConfig = null;
        this.currentLevelId = null;
    }

    /**
     * 生成六边形网格布局
     * 将屏幕分成相同大小的格子，每个格子生成一个六边形的顶点
     */
    generateHexagonalGridLayout() {
        const config = this.currentLevelConfig;

        // 获取Cell配置
        const cellConfigs = this.getCellConfigs();

        // 为每种颜色分配水滴
        config.colorIndex.forEach((colorIndex, colorArrayIndex) => {
            let dropletCount = config.dropletCount;

            // 如果dropletCount为null，表示所有水滴数量都无限
            if (dropletCount === null) {
                dropletCount = cellConfigs.length; // 使用所有可用的配置
            } else {
                dropletCount = dropletCount[colorArrayIndex];
            }

            // 如果是无限水滴，使用所有配置；否则限制数量
            const actualCount = dropletCount === 0 ? cellConfigs.length : Math.min(dropletCount, cellConfigs.length);

            // 筛选出当前颜色的配置
            const colorConfigs = cellConfigs.filter(config => config.colorIndex === colorIndex).slice(0, actualCount);

            colorConfigs.forEach(cellConfig => {
                const cell = this.createCellFromConfig(cellConfig);
                this.gameApp.addCell(cell);
            });
        });
    }

    /**
     * 获取Cell配置
     * 参考getCellConfigs函数的实现
     * @returns {Array} - Cell配置数组
     */
    getCellConfigs() {
        const cellConfigs = [];
        const screenWidth = this.gameApp.pixi.screen.width;
        const screenHeight = this.gameApp.pixi.screen.height;

        // 简单的网格分布种子点
        const gridSize = 150;
        const cols = Math.floor(screenWidth / gridSize);
        const rows = Math.floor(screenHeight / gridSize);
        const seedPoints = [];

        // 生成种子点
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * gridSize + gridSize / 2;
                const y = row * gridSize + gridSize / 2;
                seedPoints.push({ x, y });
            }
        }

        // 为每个种子点生成一个简单的多边形
        seedPoints.forEach((seedPoint, index) => {
            const points = [];
            const radius = 60;
            const numSides = 6; // 六边形

            for (let i = 0; i < numSides; i++) {
                const angle = (i / numSides) * Math.PI * 2;
                const x = seedPoint.x + Math.cos(angle) * radius;
                const y = seedPoint.y + Math.sin(angle) * radius;
                points.push({ x, y });
            }

            cellConfigs.push({
                points: points,
                colorIndex: Math.floor(index / 3) % this.currentLevelConfig.colorIndex.length
            });
        });

        return cellConfigs.slice(cellConfigs.length / 2); // 只使用一半的配置
    }

    /**
     * 从配置创建Cell
     * @param {Object} cellConfig - Cell配置
     * @returns {Cell} - 创建的Cell
     */
    createCellFromConfig(cellConfig) {
        const cell = new Cell();
        cell.colorIndex = cellConfig.colorIndex;
        cell.setPoints(cellConfig.points);
        return cell;
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.isGameActive = true;
        this.gameStartTime = Date.now();

    // 如果有时间限制，启动计时器
        if (this.currentLevelConfig.timeLimit > 0) {
            this.startTimer();
        }
    }

    /**
     * 启动计时器
     */
    startTimer() {
        const updateTimer = () => {
            if (!this.isGameActive) return;

            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            this.currentTime = elapsed;

            // 检查时间是否用完
            if (this.currentLevelConfig.timeLimit > 0 && elapsed >= this.currentLevelConfig.timeLimit) {
                this.endGame(false); // 时间用完，游戏失败
                return;
            }

            requestAnimationFrame(updateTimer);
        };

        updateTimer();
    }

    /**
     * 更新分数
     * @param {number} score - 增加的分数
     * @param {number} colorIndex - 颜色索引
     */
    updateScore(score, colorIndex) {
        if (!this.isGameActive || !this.currentLevelConfig) return;

        // 更新颜色分数
        if (!this.countByColor[colorIndex]) {
            this.countByColor[colorIndex] = 0;
        }
        this.countByColor[colorIndex] += 1;

        // 更新总分数
        this.currentScore += score;

        // 检查是否完成关卡
        this.checkLevelCompletion();

        return {
            score: score,
            colorIndex: colorIndex,
            currentScore: this.currentScore
        }
    }

    /**
     * 检查关卡完成状态
     */
    checkLevelCompletion() {
        if (!this.currentLevelConfig) return;

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

        // 如果所有颜色都完成，结束游戏
        if (allColorsCompleted) {
            this.endGame(true);
        }
    }

    /**
     * 结束游戏
     * @param {boolean} isWin - 是否胜利
     */
    endGame(isWin) {
        this.isGameActive = false;

        if (isWin) {
            console.log(`关卡 ${this.currentLevelId} 胜利！`);
            // 这里可以添加胜利动画或下一关逻辑
        } else {
            console.log(`关卡 ${this.currentLevelId} 失败！`);
        // 这里可以添加失败动画或重试逻辑
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
            currentTime: this.currentTime,
            timeLimit: this.currentLevelConfig.timeLimit,
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
} 