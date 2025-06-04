import * as PIXI from 'pixi.js';
import * as SAT from "sat"

import { ShowLayer, CollisionLayer } from './ShooterObjBase.js';

// 碰撞矩阵：collisionMatrix[A][B]为true时才检测A、B碰撞
export const collisionMatrix = [
    // ALL, PLAYER, PLAYER_BULLET, ENERMY, ENERMY_BULLET, BGCIRCLE
    /*ALL*/          [true, true,  true,  true,  true,  true],
    /*PLAYER*/       [true, false, false, true,  true,  true ],
    /*PLAYER_BULLET*/[true, false, false, true,  false, true ],
    /*ENERMY*/        [true, true,  true,  false, false, true ],
    /*ENERMY_BULLET*/ [true, true,  false, false, false, false],
    /*BGCIRCLE*/     [true, true, true, true, false, false]
];

export default class GameObjectManager extends PIXI.Container {
    constructor() {
        super();
        this.app = window.shooterApp;
        this.objects = [];
        this.layerContainers = {};
        // 创建每个显示层的container
        for (const key in ShowLayer) {
            const idx = ShowLayer[key];
            const layer = new PIXI.Container();
            this.layerContainers[idx] = layer;
            this.addChild(layer);
        }
    }
    add(obj) {
        if (!this.objects.includes(obj)) {
            this.objects.push(obj);
            // 自动放到对应层
            if (typeof obj.ShowLayer === 'number' && this.layerContainers[obj.ShowLayer]) {
                this.layerContainers[obj.ShowLayer].addChild(obj);
            } else if (obj instanceof PIXI.DisplayObject && obj.parent !== this) {
                this.addChild(obj);
            }
        }
    }
    remove(obj) {
        const idx = this.objects.indexOf(obj);
        if (idx !== -1) {
            this.objects.splice(idx, 1);
            // 从各层container移除
            for (const layer of Object.values(this.layerContainers)) {
                if (obj.parent === layer) layer.removeChild(obj);
            }
            if (obj.parent === this) this.removeChild(obj);
        }
    }
    updateAll() {
        // 统一update，自动移除出界对象
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (obj.isOutOfCircle(window.shooterApp.radius)) {
                window.shooterApp.bg.onCollide(obj);
                obj.onCollide(window.shooterApp.bg);
            }
        }

        // 检测碰撞
        let collisions = this.getCollisions();
        console.log('collisions', collisions);
        for (const [a,b] of collisions) {
            if (typeof a.onCollide === 'function') a.onCollide(b);
            if (typeof b.onCollide === 'function') b.onCollide(a);
        }
    }

    // 检查所有对象的两两碰撞，返回碰撞对数组，并调用 onCollide
    getCollisions() {
        const collisions = [];
        const objs = this.objects;
        for (let i = 0; i < objs.length; i++) {
            for (let j = i + 1; j < objs.length; j++) {
                const a = objs[i];
                const b = objs[j];
                // 只检测配置允许的层对
                if (!collisionMatrix[a.collisionLayer]?.[b.collisionLayer]) continue;
                // SAT.js 碰撞检测（默认圆形，可扩展）
                const colliderA = a.getCollider && a.getCollider();
                const colliderB = b.getCollider && b.getCollider();
                let collided = null;
                
                if (colliderA && colliderB) {
                    if (colliderA instanceof SAT.Circle && colliderB instanceof SAT.Circle) {
                        collided = SAT.testCircleCircle(colliderA, colliderB);
                    }
                    // 可扩展多边形等
                }
                console.log('collider', colliderA instanceof SAT.Circle, collided);

                if (collided) {
                    collisions.push([a, b]);
                }
            }
        }
        return collisions;
    }
}

