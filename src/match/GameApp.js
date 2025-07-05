import * as PIXI from 'pixi.js';
import * as planck from 'planck-js';
import AnimationManager from './AnimationManager.js';
import LevelManager from './LevelManager.js';
import DragManager from './DragManager.js';
import UIManager from './UIManager.js';
import RenderManager from './RenderManager.js';
import SettlementManager from './SettlementManager.js';

class GameApp {

    // PIXI相关
    pixi = null;
    cells = null;

    // Planck.js 相关
    physicsWorld = null;
    timeStep = 1 / 60;
    velocityIterations = 8;
    positionIterations = 3;
    PPM = 50; // Pixels Per Meter

    colors = [
        0x4A90E2, // 天空蓝
        0x7ED321, // 清新绿
        0xF5A623, // 温暖橙
        0xE74C3C, // 珊瑚红
        0x9B59B6, // 优雅紫
        0x1ABC9C, // 青翠绿
        0xE67E22, // 深橙色
        0x3498DB, // 深蓝色
        0x2ECC71, // 翠绿色
        0xF39C12, // 金黄色
        0xE91E63, // 粉红色
        0x00BCD4  // 青色
    ];

    // 管理器
    animationManager = null;
    levelManager = null;
    dragManager = null;
    uiManager = null;
    renderManager = null;
    settlementManager = null;

    // 渲染层
    normalCellGraphic = null; // 普通cell层
    highlightBorderGraphic = null; // 高亮边界层
    highlightCellGraphic = null; // 高亮cell层
    effectGraphic = null; // 特效层
    ui = null; // UI容器

    init(domElement) {
        this.pixi = new PIXI.Application({
            width: domElement.clientWidth,
            height: domElement.clientHeight,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            view: domElement // 直接用 pixiContainer 作为 canvas
        });

        // 创建渲染层
        this.initRenderLayers();

        // 初始化 Planck.js
        this.initPlanck();
        this.initBounds();

        // 设置物理更新循环
        this.pixi.ticker.add(this.updatePhysics.bind(this));

        // 初始化管理器
        this.renderManager = new RenderManager(this);
        this.animationManager = new AnimationManager(this);
        this.levelManager = new LevelManager(this);
        this.dragManager = new DragManager(this);
        this.uiManager = new UIManager(this);
        this.settlementManager = new SettlementManager(this);
    }

    // 初始化渲染层
    initRenderLayers() {
        this.cells = new PIXI.Container();
        this.pixi.stage.addChild(this.cells);

        // 创建3层图形容器
        this.normalCellGraphic = new PIXI.Graphics(); // 普通cell层
        this.pixi.stage.addChild(this.normalCellGraphic);

        this.highlightBorderGraphic = new PIXI.Graphics(); // 高亮边界层
        this.pixi.stage.addChild(this.highlightBorderGraphic);

        this.highlightCellGraphic = new PIXI.Graphics(); // 高亮cell层
        this.pixi.stage.addChild(this.highlightCellGraphic);

        this.effectGraphic = new PIXI.Graphics(); // 特效层
        this.pixi.stage.addChild(this.effectGraphic);

        // 创建UI容器
        this.ui = new PIXI.Container();
        this.pixi.stage.addChild(this.ui);
    }

    initPlanck() {
        // 创建 Planck.js 物理世界，使用标准重力
        this.physicsWorld = new planck.World({
            gravity: new planck.Vec2(0, 9.8)
        });
    }

    // 物理更新循环
    updatePhysics() {
        // 更新物理世界
        this.physicsWorld.step(1 / 60, 2, 1);

        // 更新所有Cell的图形
        this.renderManager.drawAllCellGraphics();
    }

    // 创建屏幕边界
    initBounds() {
        const thickness = 50; // in pixels

        const screenWidth = this.pixi.screen.width;
        const screenHeight = this.pixi.screen.height;

        // 创建一个静态的 ground body 来容纳所有的墙
        const ground = this.physicsWorld.createBody();

        // 上边界
        ground.createFixture(new planck.Edge(
            new planck.Vec2(0, 0),
            new planck.Vec2(screenWidth / this.PPM, 0)
        ));

        // 下边界
        ground.createFixture(new planck.Edge(
            new planck.Vec2(0, screenHeight / this.PPM),
            new planck.Vec2(screenWidth / this.PPM, screenHeight / this.PPM)
        ));

        // 左边界
        ground.createFixture(new planck.Edge(
            new planck.Vec2(0, 0),
            new planck.Vec2(0, screenHeight / this.PPM)
        ));

        // 右边界
        ground.createFixture(new planck.Edge(
            new planck.Vec2(screenWidth / this.PPM, 0),
            new planck.Vec2(screenWidth / this.PPM, screenHeight / this.PPM)
        ));

        this.bounds = ground;
    }

    // 获取边界信息
    getBounds() {
        return this.bounds;
    }

    // 检查物体是否在边界内
    isInBounds(body) {
        if (!this.bounds || !body) return true;

        const pos = body.getPosition();
        const screenWidth = this.pixi.screen.width;
        const screenHeight = this.pixi.screen.height;

        return pos.x * this.PPM >= 0 &&
            pos.x * this.PPM <= screenWidth &&
            pos.y * this.PPM >= 0 &&
            pos.y * this.PPM <= screenHeight;
    }

    // 添加物理体到世界
    addBody(body) {
        // Planck.js 中，物理体在创建时就已经添加到世界中了
        // 这个方法保留是为了兼容性
        return body;
    }

    // 从世界移除物理体
    removeBody(body) {
        if (body && body.getWorld()) {
            body.getWorld().destroyBody(body);
        }
    }

    // 添加关节到世界
    addJoint(joint) {
        // Planck.js 中，关节在创建时就已经添加到世界中了
        // 这个方法保留是为了兼容性
        return joint;
    }

    // 从世界移除关节
    removeJoint(joint) {
        if (joint && joint.getWorld()) {
            joint.getWorld().destroyJoint(joint);
        }
    }

    // 为了向后兼容，保留这些方法名
    addConstraint(constraint) {
        return this.addJoint(constraint);
    }

    removeConstraint(constraint) {
        return this.removeJoint(constraint);
    }

    addCell(cell) {
        if (!cell) return;

        // 添加到显示容器
        this.cells.addChild(cell);

    }

    removeCell(cell) {
        if (!cell || cell.isDestroyed) return;

        // 标记为已销毁
        cell.isDestroyed = true;

        // 移除物理体
        cell.bodies.forEach(body => {
            this.physicsWorld.destroyBody(body);
        });

        // 移除关节
        cell.joints.forEach(joint => {
            this.physicsWorld.destroyJoint(joint);
        });

        // 从显示容器中移除
        this.cells.removeChild(cell);

    }

    findAndRemoveMatches(startCell) {
        if (!startCell) return;

        const cells = this.cells.children.concat([]);
        const toCheck = [startCell];
        const matches = [startCell];
        const checked = new Set([startCell]);

        while (toCheck.length > 0) {
            const currentCell = toCheck.pop();

            for (const otherCell of cells) {
                if (checked.has(otherCell)) continue;

                if (this.areCellsConnected(currentCell, otherCell) && currentCell.colorIndex === otherCell.colorIndex) {
                    checked.add(otherCell);
                    matches.push(otherCell);
                    toCheck.push(otherCell);
                }
            }
        }

        if (matches.length >= 2) {
            matches.forEach(cell => this.removeCell(cell));
        }
    }

    areCellsConnected(cellA, cellB) {
        // 检查两个Cell是否通过物理体连接
        const bodiesA = cellA.bodies;
        const bodiesB = cellB.bodies;

        for (const bodyA of bodiesA) {
            for (const bodyB of bodiesB) {
                if (bodyA === bodyB) {
                    return true;
                }
            }
        }
        return false;
    }

    initDom(domElement, options = {}) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const scale = Math.min(windowWidth / options.designWidth, windowHeight / options.designHeight) * options.scale;
        const width = options.designWidth * scale;
        const height = options.designHeight * scale;
        domElement.style.width = options.designWidth + 'px';
        domElement.style.height = options.designHeight + 'px';
        domElement.style.transform = `scale(${scale})`;

        this.windowWidth = windowWidth; // 屏幕大小
        this.windowHeight = windowHeight;
        this.scale = scale;
        this.designWidth = options.designWidth;
        this.designHeight = options.designHeight;
        this.width = options.designWidth;
        this.height = options.designHeight;
    }

    destroy() {
        // 清理物理同步
        if (this.pixi && this.pixi.ticker) {
            this.pixi.ticker.remove(this.updatePhysics);
        }

        // 销毁管理器
        if (this.dragManager) {
            this.dragManager.destroy();
        }
        if (this.uiManager) {
            this.uiManager.destroy();
        }
        if (this.renderManager) {
            this.renderManager.destroy();
        }
        if (this.settlementManager) {
            this.settlementManager.destroy();
        }

        // 清理渲染层
        if (this.cells) {
            this.cells.destroy();
            this.cells = null;
        }
        if (this.ui) {
            this.ui.destroy();
            this.ui = null;
        }
        if (this.normalCellGraphic) {
            this.normalCellGraphic.destroy();
            this.normalCellGraphic = null;
        }
        if (this.highlightBorderGraphic) {
            this.highlightBorderGraphic.destroy();
            this.highlightBorderGraphic = null;
        }
        if (this.highlightCellGraphic) {
            this.highlightCellGraphic.destroy();
            this.highlightCellGraphic = null;
        }
        if (this.effectGraphic) {
            this.effectGraphic.destroy();
            this.effectGraphic = null;
        }

        // 清理 Planck.js 资源
        if (this.physicsWorld) {
            // Planck.js 会自动清理所有物理体和关节
            this.physicsWorld = null;
        }

        // 清理边界
        if (this.bounds) {
            if (this.bounds && this.bounds.getWorld()) {
                this.bounds.getWorld().destroyBody(this.bounds);
            }
            this.bounds = null;
        }

        // 清理 PIXI 资源
        if (this.pixi) {
            this.pixi.destroy(true, { children: true, texture: true, baseTexture: true });
            this.pixi = null;
        }
    }
}

const gameApp = new GameApp();
export default gameApp;