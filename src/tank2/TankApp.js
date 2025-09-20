export class TankApp {
    static _instance;

    constructor() {
        this.pixi = null;
        this.gameContainer = null;
        this.textures = {};

        // 全局时钟（在 TankLogic 中初始化）
        this.ticker = null;
        
        this.logic = null;
        
        // 关卡游戏对象
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        
        // 关卡数据
        this.levelData = null;
        
        // 渲染层
        this.renderLayers = {
            background: null,
            tiles: null,
            tank: null,
            bullets: null,
            grass: null,
            effect: null
        };
    }

    static get instance() {
        if (!TankApp._instance) {
            TankApp._instance = new TankApp();
        }
        return TankApp._instance;
    }

    clear(){
        this.ticker.stop();
    }

    addBullet(bullet) {
        this.bullets.push(bullet);
        this.renderLayers.bullets.addChild(bullet);
    }
    
    removeBullet(bullet) {
        this.renderLayers.bullets.removeChild(bullet);
        let index = this.bullets.indexOf(bullet);
        if (index === -1) return;
        this.bullets.splice(index, 1);
    }

    addEnemy(enemy) {
        this.enemies.push(enemy);
        this.renderLayers.tank.addChild(enemy);
    }

    removeEnemy(enemy) {
        this.renderLayers.tank.removeChild(enemy);
        let index = this.enemies.indexOf(enemy);
        if (index === -1) return;
        this.enemies.splice(index, 1);
    }

    addEffect(effectName, x, y, callback) {
        import('./SpriteSeqAnim.js').then(({ createSpriteSeqAnim }) => {
            const effect = createSpriteSeqAnim(effectName, callback);
            effect.x = x;
            effect.y = y;
            this.renderLayers.effect.addChild(effect);
        });
    }
} 