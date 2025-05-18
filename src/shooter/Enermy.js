import * as PIXI from 'pixi.js';
import ShooterObjBase, { ShowLayer } from './ShooterObjBase.js';
import * as SAT from "sat";
import { CollisionLayer } from './ShooterObjBase.js';

export default class Enermy extends ShooterObjBase {
    constructor() {
        super();
        this.sprite = null;
        this.speed = 2; // 敌人速度可自定义，已减慢
        this.angle = 0;
        this.radius = 0;
        this.ShowLayer = ShowLayer.ENERMY;
    }

    get collisionLayer() {
        return CollisionLayer.ENERMY;
    }

    // 默认以自身中心和半径为碰撞体
    getCollider() {
        const r = this.sprite ? (this.sprite.width / 2) : (this.radius || 20);
        return new SAT.Circle(new SAT.Vector(this.x, this.y), r);
    }

    async init() {
        this.radius = window.shooterApp.radius;
        this._tickManager = window.shooterApp.tickManager;
        this.sprite = PIXI.Sprite.from('shooter/enemy_B.png');
        this.sprite.anchor.set(0.5);
        this.addChild(this.sprite);
        this.x = 0;
        this.y = 0;
        this.angle = 0;
    }

    // 可自定义敌人AI等方法
    updateAI() {
        // 示例：简单自转
        this.angle += 0.01;
        if (this.sprite) {
            this.sprite.rotation = this.angle;
        }
    }

    onCollide(other){
        if(other.collisionLayer == CollisionLayer.PLAYER || other.collisionLayer == CollisionLayer.PLAYER_BULLET){
            // 玩家被碰撞时掉血
            if(other.collisionLayer == CollisionLayer.PLAYER && other.hp !== undefined){
                other.hp -= 20;
                if(other.hp < 0) other.hp = 0;
                if(other.updateBloodBar) other.updateBloodBar();
            }
            // 增加经验：只有被玩家子弹击败时
            if(other.collisionLayer == CollisionLayer.PLAYER_BULLET && window.shooterApp.player && typeof window.shooterApp.player.addExp === 'function'){
                window.shooterApp.player.addExp(10); // 每击落一架敌机加10点经验
            }
            window.shooterApp.gameObjectManager.remove(this);
        }
    }
}
