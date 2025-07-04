import * as PIXI from 'pixi.js';

export default class DragManager {
    constructor(gameApp) {
        this.gameApp = gameApp;
        this.isDragging = false;
        this.currentDragCell = null;
        this.dragCellQueue = [];
        this.initDragSystem();
    }

    initDragSystem() {
        this.gameApp.cells.eventMode = 'static';
        this.gameApp.cells.hitArea = new PIXI.Rectangle(0, 0, this.gameApp.pixi.screen.width, this.gameApp.pixi.screen.height);

        this.gameApp.cells.on('pointerdown', this.startDrag.bind(this));
        this.gameApp.cells.on('pointermove', this.updateDrag.bind(this));
        this.gameApp.cells.on('pointerup', this.endDrag.bind(this));
        this.gameApp.cells.on('pointerupoutside', this.endDrag.bind(this));
    }

    startDrag(event) {
        // 检查是否可以接受玩家输入
        if (!this.gameApp.levelManager.canAcceptInput()) {
            return;
        }

        const point = event.global;
        this.isDragging = true;
        this.currentDragCell = null;
        this.dragCellQueue = [];

        // 找到起始位置的Cell
        this.currentDragCell = this.findCellAtPoint(point);
        if (this.currentDragCell) {
            this.dragCellQueue.push(this.currentDragCell);
            this.currentDragCell.setHighlight(true); // 设置高亮
        }
    }

    updateDrag(event) {
        // 检查是否可以接受玩家输入
        if (!this.gameApp.levelManager.canAcceptInput()) {
            return;
        }

        const point = event.global;
        if (!this.isDragging) return;

        // 保存旧的currentDragCell用于比较
        const oldCell = this.currentDragCell;

        // 找到当前位置的Cell
        this.currentDragCell = this.findCellAtPoint(point);

        if (this.currentDragCell && this.currentDragCell !== oldCell) {
            // 获取队列中的最后一个Cell作为颜色比较基准
            const lastCellOfQueue = this.dragCellQueue.length > 0 ? this.dragCellQueue[this.dragCellQueue.length - 1] : null;

            // 检查颜色是否相同
            if (lastCellOfQueue && this.currentDragCell.colorIndex === lastCellOfQueue.colorIndex) {
                // 检查是否已经在队列中
                if (!this.dragCellQueue.includes(this.currentDragCell)) {
                    this.dragCellQueue.push(this.currentDragCell);
                    this.currentDragCell.setHighlight(true); // 设置高亮
                }
            } else if (!lastCellOfQueue || (this.currentDragCell && !this.dragCellQueue.includes(this.currentDragCell))) {
                // 如果队列为空或者颜色不同，清空队列并重新开始
                this.clearDragQueue();
                this.dragCellQueue.push(this.currentDragCell);
                this.currentDragCell.setHighlight(true); // 设置高亮
            }
        }
    }

    endDrag(event) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.currentDragCell = null;

        if (this.dragCellQueue.length === 0) return;

        const firstCell = this.dragCellQueue[0];
        const remainingCellsOfColor = this.countRemainingCellsOfColor(firstCell.colorIndex);

        // 处理匹配结果
        if (this.dragCellQueue.length >= 3 || remainingCellsOfColor < 3) {
            this.processDragMatch();
        } else {
            // 清除高亮
            this.clearDragQueue();
        }
    }

    clearDragQueue() {
        // 清除所有cell的高亮状态
        this.dragCellQueue.forEach(cell => {
            if (cell && !cell.isDestroyed) {
                cell.setHighlight(false);
            }
        });
        this.dragCellQueue = [];
    }

    findCellAtPoint(point) {
        // 从后往前查找，找到最上层的Cell
        for (let i = this.gameApp.cells.children.length - 1; i >= 0; i--) {
            const cell = this.gameApp.cells.children[i];
            const bounds = cell.getDisplayPoints();
            if (!cell.isDestroyed && this.isPointInPolygon([point.x, point.y], bounds.map(p => [p.x, p.y]))) {
                return cell;
            }
        }
        return null;
    }

    isPointInPolygon(point, polygon) {
        let inside = false;
        const x = point[0], y = point[1];

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];

            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }

    /**
     * 处理拖拽匹配
     */
    processDragMatch() {
        // 在方法一开始就标记所有相关的 cell 为已移除状态
        this.dragCellQueue.forEach(cell => {
            if (cell && !cell.isDestroyed) {
                cell.isRemoved = true; // 标记为已移除
                cell.setHighlight(false); // 清除高亮
            }
        });

        let levelCompleted = false; // 记录关卡是否完成

        // 按顺序处理每个Cell
        this.dragCellQueue.forEach((cell, index) => {
            const score = index + 1; // 第一个1分，第二个2分，以此类推

            // 延迟处理，创造连锁效果
            setTimeout(() => {
                if (cell && !cell.isDestroyed && cell.isRemoved) {
                    // 先更新分数，获取返回值
                    const result = this.gameApp.levelManager.updateScore(score, cell.colorIndex);

                    // 检查关卡是否完成
                    if (result && result.levelCompleted) {
                        levelCompleted = true;
                    }

                    // 播放破碎动画
                    this.gameApp.animationManager.playCellBreakAnim(cell, result);

                    // 立即移除Cell
                    this.gameApp.removeCell(cell);
                }
            }, index * 150); // 每个Cell延迟150ms
        });

        // 清空队列
        this.dragCellQueue = [];

        // 如果关卡完成，延迟结束游戏；否则生成新水滴
        if (levelCompleted) {
            setTimeout(() => {
                this.gameApp.levelManager.endGame(true);
            }, 500);
        } else {
            setTimeout(() => {
                this.gameApp.levelManager.checkAndGenerateCells();
            }, 500);
        }
    }

    /**
     * 计算场上剩余的指定颜色的水滴数量
     * @param {number} colorIndex - 颜色索引
     * @returns {number} - 剩余水滴数量
     */
    countRemainingCellsOfColor(colorIndex) {
        let count = 0;
        for (let i = 0; i < this.gameApp.cells.children.length; i++) {
            const cell = this.gameApp.cells.children[i];
            if (!cell.isDestroyed && cell.colorIndex === colorIndex) {
                count++;
            }
        }
        return count;
    }

    destroy() {
        // 清理事件监听器
        if (this.gameApp.cells) {
            this.gameApp.cells.off('pointerdown', this.startDrag.bind(this));
            this.gameApp.cells.off('pointermove', this.updateDrag.bind(this));
            this.gameApp.cells.off('pointerup', this.endDrag.bind(this));
            this.gameApp.cells.off('pointerupoutside', this.endDrag.bind(this));
        }
    }
} 