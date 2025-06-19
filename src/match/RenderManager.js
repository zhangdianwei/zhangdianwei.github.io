import * as PIXI from 'pixi.js';

export default class RenderManager {
    constructor(gameApp) {
        this.gameApp = gameApp;
    }

    // 清除Cell图形
    clearCellGraphics() {
        if (this.gameApp.normalCellGraphic) {
            this.gameApp.normalCellGraphic.clear();
        }
        if (this.gameApp.highlightBorderGraphic) {
            this.gameApp.highlightBorderGraphic.clear();
        }
        if (this.gameApp.highlightCellGraphic) {
            this.gameApp.highlightCellGraphic.clear();
        }
        if (this.gameApp.effectGraphic) {
            this.gameApp.effectGraphic.clear();
        }
    }

    // 更新所有Cell的图形
    drawAllCellGraphics() {
        this.gameApp.normalCellGraphic.clear();
        this.gameApp.highlightBorderGraphic.clear();
        this.gameApp.highlightCellGraphic.clear();

        // 遍历所有Cell并绘制
        this.gameApp.cells.children.forEach(child => {
            if (!child.isDestroyed) {
                this.drawCell(child);
            }
        });
    }

    // 绘制单个Cell
    drawCell(cell) {
        const disPoints = cell.getDisplayPoints();
        if (disPoints.length < 3) return;

        // 选择绘制方式
        const drawMethod = 'catmull'; // 可选: 'line', 'quadratic', 'cubic', 'catmull', 'smooth'

        if (cell.highlighted) {
            // 高亮cell：绘制到高亮cell层
            this.gameApp.highlightCellGraphic.lineStyle(0);
            this.gameApp.highlightCellGraphic.beginFill(cell.color);

            this.drawPath(this.gameApp.highlightCellGraphic, disPoints, drawMethod);
            this.gameApp.highlightCellGraphic.closePath();
            this.gameApp.highlightCellGraphic.endFill();

            // 高亮边界：绘制到高亮边界层
            this.gameApp.highlightBorderGraphic.lineStyle(20, 0xFFFFFF, 1);
            this.gameApp.highlightBorderGraphic.beginFill(0xFFFFFF, 0.1);

            this.drawPath(this.gameApp.highlightBorderGraphic, disPoints, drawMethod);
            this.gameApp.highlightBorderGraphic.closePath();
            this.gameApp.highlightBorderGraphic.endFill();
        } else {
            // 普通cell：绘制到普通cell层
            this.gameApp.normalCellGraphic.lineStyle(0);
            this.gameApp.normalCellGraphic.beginFill(cell.color);

            this.drawPath(this.gameApp.normalCellGraphic, disPoints, drawMethod);
            this.gameApp.normalCellGraphic.closePath();
            this.gameApp.normalCellGraphic.endFill();
        }
    }

    // 绘制路径
    drawPath(graphics, bounds, method) {
        switch (method) {
            case 'line':
                this.drawLinePath(graphics, bounds);
                break;
            case 'quadratic':
                this.drawQuadraticPath(graphics, bounds);
                break;
            case 'cubic':
                this.drawCubicPath(graphics, bounds);
                break;
            case 'smooth':
                this.drawSmoothPath(graphics, bounds);
                break;
            case 'catmull':
            default:
                this.drawCatmullPath(graphics, bounds);
                break;
        }
    }

    // 直线绘制
    drawLinePath(graphics, bounds) {
        graphics.moveTo(bounds[0].x, bounds[0].y);
        for (let i = 1; i < bounds.length; i++) {
            graphics.lineTo(bounds[i].x, bounds[i].y);
        }
    }

    // 二次贝塞尔曲线绘制
    drawQuadraticPath(graphics, bounds) {
        const points = bounds;
        const len = points.length;

        if (len < 3) {
            this.drawLinePath(graphics, bounds);
            return;
        }

        graphics.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < len; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % len];
            const p3 = points[(i + 2) % len];

            // 计算控制点（中点）
            const controlX = (p1.x + p2.x) / 2;
            const controlY = (p1.y + p2.y) / 2;

            graphics.quadraticCurveTo(controlX, controlY, p2.x, p2.y);
        }
    }

    // 三次贝塞尔曲线绘制
    drawCubicPath(graphics, bounds) {
        const points = bounds;
        const len = points.length;

        if (len < 4) {
            this.drawQuadraticPath(graphics, bounds);
            return;
        }

        graphics.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < len; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % len];
            const p3 = points[(i + 2) % len];
            const p4 = points[(i + 3) % len];

            // 计算控制点
            const cp1x = p1.x + (p2.x - p1.x) * 0.5;
            const cp1y = p1.y + (p2.y - p1.y) * 0.5;
            const cp2x = p2.x + (p3.x - p2.x) * 0.5;
            const cp2y = p2.y + (p3.y - p2.y) * 0.5;

            graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
    }

    // 平滑曲线绘制
    drawSmoothPath(graphics, bounds) {
        const points = bounds;
        const len = points.length;

        graphics.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < len; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[(i + 1) % len];

            // 计算平滑控制点
            const tension = 0.3;
            const cp1x = prev.x + (curr.x - prev.x) * (1 - tension);
            const cp1y = prev.y + (curr.y - prev.y) * (1 - tension);
            const cp2x = curr.x + (next.x - curr.x) * tension;
            const cp2y = curr.y + (next.y - curr.y) * tension;

            graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, curr.x, curr.y);
        }
    }

    // Catmull-Rom曲线绘制
    drawCatmullPath(graphics, bounds) {
        const points = bounds;
        const len = points.length;
        graphics.moveTo(points[0].x, points[0].y);

        const subdivisions = 10;
        for (let i = 0; i < len; i++) {
            const p0 = points[(i - 1 + len) % len];
            const p1 = points[i];
            const p2 = points[(i + 1) % len];
            const p3 = points[(i + 2) % len];

            for (let j = 1; j <= subdivisions; j++) {
                const t = j / subdivisions;
                const t2 = t * t;
                const t3 = t2 * t;

                const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
                const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

                graphics.lineTo(x, y);
            }
        }
    }

    destroy() {
        // 渲染层由GameApp统一管理，这里不需要重复清理
    }
} 