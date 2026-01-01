import RandGenerator from './RandGenerator.js';
import * as TetrisShape from '../TetrisShape.js';

/**
 * 7-bag system 随机生成器
 * 保证每 7 个方块中，每种类型都会出现一次
 * 参考: https://codemyroad.wordpress.com/2013/04/14/tetris-ai-the-near-perfect-player/
 */
export default class Tetris7BagGenerator {
    constructor(seed) {
        this.rng = new RandGenerator(seed);
        this.bag = [];
        this.shapeTypes = Object.values(TetrisShape.TetrisShapeType);
        this.refillBag();
    }

    /**
     * 重新填充袋子（7 种方块打乱）
     */
    refillBag() {
        // 创建包含所有 7 种方块的数组
        this.bag = [...this.shapeTypes];
        
        // Fisher-Yates 洗牌算法
        for (let i = this.bag.length - 1; i > 0; i--) {
            const j = this.rng.nextInt(i + 1);
            [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
    }

    /**
     * 获取下一个方块类型
     */
    next() {
        // 如果袋子空了，重新填充
        if (this.bag.length === 0) {
            this.refillBag();
        }
        
        // 从袋子中取出一个
        const shapeType = this.bag.pop();
        
        // 返回形状类型和对应的颜色索引
        const colorIndex = this.shapeTypes.indexOf(shapeType);
        return {
            shapeType: shapeType,
            colorIndex: colorIndex
        };
    }

    /**
     * 重置生成器
     */
    reset(seed) {
        if (seed !== undefined) {
            this.rng.reset(seed);
        } else {
            this.rng.reset();
        }
        this.bag = [];
        this.refillBag();
    }
}

