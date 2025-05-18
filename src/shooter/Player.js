import * as PIXI from 'pixi.js';
import ShooterObjBase, { ShowLayer } from './ShooterObjBase.js';
import PlayerLevelData from './PlayerLevelData.js';
import WeaponRifle from './WeaponRifle.js';
import * as SAT from "sat"
import { CollisionLayer } from './ShooterObjBase.js';

export default class Player extends ShooterObjBase {
    // 经验与等级相关属性
    exp = 0;
    level = 1;
    expToLevel = 100;

    constructor() {
        super();
        this.sprite = null;
        this.speed = 6; // 每帧最大移动速度
        this.turnSpeed = 0.15; // 每帧最大转向弧度
        this.angle = 0; // 当前朝向
        this.radius = 0; // 活动范围
        this.weapon = null;
        this.ShowLayer = ShowLayer.PLAYER;
        // 经验和等级初始化
        this.level = 1;
        this.exp = 0;
        // 属性从数据类获取
        const levelData = PlayerLevelData.getLevelData(this.level);
        this.maxHp = levelData.maxHp;
        this.hp = this.maxHp;
        this.expToLevel = levelData.expToLevel;
        // 血条容器和精灵
        this.bloodBarContainer = null;
        this.bloodBarBg = null;
        this.bloodBar = null;
    }

    get collisionLayer() {
        return CollisionLayer.PLAYER;
    }

    // 默认以自身中心和半径为碰撞体
    getCollider() {
        if(!this.colObj){
            let r = this.sprite.width / 4;
            this.colObj = new SAT.Circle(new SAT.Vector(this.x, this.y), r);
        }
        if (this.colObj) {
            this.colObj.pos.x = this.x;
            this.colObj.pos.y = this.y;
        }
        return this.colObj;
    }

    async init() {
        // 经验和属性初始化
        this.level = 1;
        this.exp = 0;
        const levelData = PlayerLevelData.getLevelData(this.level);
        this.maxHp = levelData.maxHp;
        this.hp = this.maxHp;
        this.expToLevel = levelData.expToLevel;

        this.radius = window.shooterApp.radius;
        this._tickManager = window.shooterApp.tickManager;
        this.sprite = PIXI.Sprite.from('shooter/ship_E.png');
        this.sprite.anchor.set(0.5);
        this.addChild(this.sprite);
        // 创建血条容器和精灵
        this.bloodBarContainer = new PIXI.Container();
        this.bloodBarBg = PIXI.Sprite.from('shooter/player_blood_bg.png');
        this.bloodBar = PIXI.Sprite.from('shooter/player_blood_bar.png');
        this.bloodBarBg.anchor.set(0, 1.0);
        this.bloodBar.anchor.set(0, 1.0);
        this.bloodBarContainer.addChild(this.bloodBarBg);
        this.bloodBarContainer.addChild(this.bloodBar);
        this.bloodBarContainer.x = -this.sprite.width/2-5;
        this.bloodBarContainer.y = -this.bloodBar.width/2;
        this.bloodBarContainer.rotation = Math.PI/2;
        this.sprite.addChild(this.bloodBarContainer);

        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.weapon = new WeaponRifle(this);
        this.addChild(this.weapon);
        this.updateBloodBar();

    }

    // 增加经验，满则升级
    addExp(amount) {
        this.exp += amount;
        while (this.exp >= this.expToLevel) {
            this.exp -= this.expToLevel;
            this.levelUp();
        }

        if (window.shooterApp && window.shooterApp.updatePlayerStatusUI) {
            window.shooterApp.updatePlayerStatusUI(this.level, this.exp, this.expToLevel);
        }
    }

    // 升级后提升血量和武器威力
    levelUp() {
        this.level += 1;
        // 属性全部从数据类获取
        const levelData = PlayerLevelData.getLevelData(this.level);
        this.maxHp = levelData.maxHp;
        this.hp = this.maxHp;
        this.expToLevel = levelData.expToLevel;
        if (this.weapon && typeof this.weapon.levelUp === 'function') {
            this.weapon.levelUp(levelData);
        }
        // 可加特效/提示

        if (window.shooterApp && window.shooterApp.updatePlayerStatusUI) {
            window.shooterApp.updatePlayerStatusUI(this.level, this.exp, this.expToLevel);
        }
    }

    updateWeapon(radius) {
        if (this.weapon) this.weapon.update(radius);
    }

    updateBloodBar() {
        if (!this.bloodBar) return;
        let percent = Math.max(0, Math.min(1, this.hp / this.maxHp));
        this.bloodBar.scale.x = percent;
    }

    lookAt(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const targetAngle = Math.atan2(dy, dx);

        // 计算最短角度差，保持在[-π, π]
        let delta = targetAngle - this.angle;
        delta = ((delta + Math.PI) % (2 * Math.PI)) - Math.PI;

        //     this.angle = targetAngle;
        // } else {
        //     this.angle += Math.sign(delta) * this.turnSpeed;
        // }
        this.angle = targetAngle;

        if (this.sprite) {
            this.sprite.rotation = this.angle;
        }
    }

    moveByKeys(keys, limitRadius) {
        // 血条实时刷新
        this.updateBloodBar();
        let dx = 0, dy = 0;
        if (keys.w) dy -= 1;
        if (keys.s) dy += 1;
        if (keys.a) dx -= 1;
        if (keys.d) dx += 1;
        if (dx !== 0 || dy !== 0) {
            // 归一化方向
            let len = Math.sqrt(dx*dx + dy*dy);
            dx /= len; dy /= len;
            let moveX = dx * this.speed;
            let moveY = dy * this.speed;
            let nextX = this.x + moveX;
            let nextY = this.y + moveY;
            // 限制在圆内
            let r = Math.sqrt(nextX * nextX + nextY * nextY);
            let maxR = limitRadius !== undefined ? limitRadius : this.radius;
            if (r > maxR) {
                let scale = maxR / r;
                nextX *= scale;
                nextY *= scale;
            }
            this.x = nextX;
            this.y = nextY;
        }
    }
}
