import * as PIXI from 'pixi.js';
import TetrisTile from './TetrisTile.js';
import * as TetrisShape from './TetrisShape.js';

class TetrisGameView extends PIXI.Container {
    
    constructor(game) {
        super();
        this.game = game;
        this.initBgCenter();
        this.initBg();
        this.initGameLogic();
    }

    initGameLogic() {
        this.rowCount = 20;
        this.colCount = 10;
        this.tileSize = 25;
        this.dropSpeed = 500; // 多少毫秒下落一次
        this.dropSpeedTimer = 0;

        this.tiles = [];
        for (let r = 0; r < this.rowCount+4; r++) {
            this.tiles[r] = [];
            for (let c = 0; c < this.colCount; c++) {
                this.tiles[r][c] = null;
            }
        }

        // debug
        // for (let r = 0; r < 17; r++) {
        //     for (let c = 0; c < this.colCount; c++) {
        //         let tile = new TetrisTile(this.game, 0);
        //         this.addChild(tile);
        //         let pos = this.getPosByRC(r, c);
        //         tile.position.set(pos.x, pos.y);
        //         this.tiles[r][c] = tile;
        //     }
        // }

        this.tagUpdate = this.update.bind(this);
        this.game.pixi.ticker.add(this.tagUpdate, this);

        this.initKeyboard();
        this.checkTotalDrop();
    }

    initKeyboard() {
        this.onKeyDown = (e) => {
            if (!this.dropingInfo) return;
            
            const key = e.key.toLowerCase();
            if (key === 'w') {
                this.handleRotate();
            } else if (key === 's') {
                this.handleDrop();
            } else if (key === 'a') {
                this.handleMoveLeft();
            } else if (key === 'd') {
                this.handleMoveRight();
            }
        };
        
        window.addEventListener('keydown', this.onKeyDown);
    }

    handleRotate() {
        
    }

    handleDrop() {
        this.checkTotalDrop();
    }

    handleMoveLeft() {
        if (this.canMoveLeft()) {
            this.moveDropingInfo({r: 0, c: -1});
        }
    }

    handleMoveRight() {
        if (this.canMoveRight()) {
            this.moveDropingInfo({r: 0, c: 1});
        }
    }

    canMoveLeft() {
        if (!this.dropingInfo) return false;
        for (let i = 0; i < this.dropingInfo.rcs.length; i++) {
            let rc = this.dropingInfo.rcs[i];
            if (rc.c <= 0) return false;
            if (this.tiles[rc.r][rc.c - 1]) return false;
        }
        return true;
    }

    canMoveRight() {
        if (!this.dropingInfo) return false;
        for (let i = 0; i < this.dropingInfo.rcs.length; i++) {
            let rc = this.dropingInfo.rcs[i];
            if (rc.c >= this.colCount - 1) return false;
            if (this.tiles[rc.r][rc.c + 1]) return false;
        }
        return true;
    }

    destroy() {
        if (this.onKeyDown) {
            window.removeEventListener('keydown', this.onKeyDown);
        }
        if (this.tagUpdate) {
            this.game.pixi.ticker.remove(this.tagUpdate);
        }
        super.destroy();
    }

    update(delta) {
        const deltaMS = this.game.pixi.ticker.deltaMS;
        this.dropSpeedTimer += deltaMS;
        if (this.dropSpeedTimer >= this.dropSpeed) {
            this.dropSpeedTimer = 0;
            this.checkTotalDrop();
        }
    }

    checkTotalDrop() {
        if (this.isAtBottom(this.dropingInfo)) {
            this.removeDropingShape();
        }
        else if (this.dropingInfo) {
            this.doDrop();
        }
        else {
            this.createNewShape();
        }
    }

    removeDropingShape() {
        for (let i = 0; i < this.dropingInfo.rcs.length; i++) {
            let rc = this.dropingInfo.rcs[i];
            this.tiles[rc.r][rc.c] = this.dropingInfo.tiles[i];
        }
        this.dropingInfo = null;
    }

    doDrop() {
        this.moveDropingInfo({r: -1, c: 0});
    }

    moveDropingInfo(diffRC) {
        for (let i = 0; i < this.dropingInfo.rcs.length; i++) {
            let rc = this.dropingInfo.rcs[i];
            rc.r += diffRC.r;
            rc.c += diffRC.c;
            this.dropingInfo.tiles[i].position.x += diffRC.c * this.tileSize;
            this.dropingInfo.tiles[i].position.y -= diffRC.r * this.tileSize;

            // if (rc.r < 0 || rc.r >= this.rowCount || rc.c < 0 || rc.c >= this.colCount) {
            //     console.error('rc不合法', diffRC, rc);
            // }
        }
    }

    createNewShape() {
        this.dropingInfo = {};
        this.dropingInfo.shapeType = TetrisShape.getRandomShapeType();
        this.dropingInfo.rcs = [];
        this.dropingInfo.tiles = [];

        let row = 19;
        let col = 0;

        let shapeDef = TetrisShape.TetrisShapeDef[this.dropingInfo.shapeType];
        let shapeTiles = shapeDef.tiles;
        let colorIndex = TetrisShape.getRandomColorIndex();
        for (let r = 0; r < shapeTiles.length; r++) {
            for (let c = 0; c < shapeTiles[r].length; c++) {
                let tileType = shapeTiles[r][c];
                if (tileType > 0) {
                    let tile = new TetrisTile(this.game, colorIndex);
                    // this.tiles[row + r][col + c] = tile;
                    this.addChild(tile);
                    let pos = this.getPosByRC(row + r, col + c);
                    tile.position.set(pos.x, pos.y);
                    // console.log('tile', tile.position.x, tile.position.y);

                    this.dropingInfo.rcs.push({r: row + r, c: col + c});
                    this.dropingInfo.tiles.push(tile);
                }
            }
        }

    }

    getPosByRC(row, col) {
        let pos = {x: col * this.tileSize, y: - row * this.tileSize};
        pos.x += this.tileSize / 2;
        pos.y -= this.tileSize / 2;
        pos.x -= this.colCount * this.tileSize / 2;
        pos.y += this.rowCount * this.tileSize / 2;
        return pos;
    }

    isAtBottom(dropingInfo) {
        if (!dropingInfo) {
            dropingInfo = this.dropingInfo;
        }
        if (!dropingInfo) return false;

        for (let i = 0; i < dropingInfo.rcs.length; i++) {
            let rc = dropingInfo.rcs[i];
            if (rc.r == 0)
                return true;
            let topRC = this.getNextTileRCByRC(rc);
            if (topRC && rc.r - topRC.r == 1) {
                return true;
            }
        }
        return false;
    }

    getNextTileRCByRC(fromRC) {
        for (let r = fromRC.r - 1; r >= 0; r--) {
            if (this.tiles[r] && this.tiles[r][fromRC.c]) {
                return {r, c: fromRC.c};
            }
        }
        return null;
    }

    initBg() {
        const texture = this.game.textures['tetris/bg_total.png'];
        
        const screenWidth = this.game.pixi.screen.width;
        const screenHeight = this.game.pixi.screen.height;
        
        const leftWidth = 50;
        const topHeight = 50;
        const rightWidth = 50;
        const bottomHeight = 50;
        
        this.bg = new PIXI.Container();
        
        const textureWidth = texture.width;
        const textureHeight = texture.height;
        const centerWidth = textureWidth - leftWidth - rightWidth;
        const centerHeight = textureHeight - topHeight - bottomHeight;
        
        const targetWidth = screenWidth;
        const targetHeight = screenHeight;
        const scaleX = (targetWidth - leftWidth - rightWidth) / centerWidth;
        const scaleY = (targetHeight - topHeight - bottomHeight) / centerHeight;
        
        const regions = {
            topLeft: new PIXI.Rectangle(0, 0, leftWidth, topHeight),
            topRight: new PIXI.Rectangle(textureWidth - rightWidth, 0, rightWidth, topHeight),
            bottomLeft: new PIXI.Rectangle(0, textureHeight - bottomHeight, leftWidth, bottomHeight),
            bottomRight: new PIXI.Rectangle(textureWidth - rightWidth, textureHeight - bottomHeight, rightWidth, bottomHeight),
            top: new PIXI.Rectangle(leftWidth, 0, centerWidth, topHeight),
            bottom: new PIXI.Rectangle(leftWidth, textureHeight - bottomHeight, centerWidth, bottomHeight),
            left: new PIXI.Rectangle(0, topHeight, leftWidth, centerHeight),
            right: new PIXI.Rectangle(textureWidth - rightWidth, topHeight, rightWidth, centerHeight),
            center: new PIXI.Rectangle(leftWidth, topHeight, centerWidth, centerHeight),
        };
        
        let x = -targetWidth / 2;
        let y = -targetHeight / 2;
        
        this.addSprite(texture, regions.topLeft, x, y, leftWidth, topHeight);
        this.addSprite(texture, regions.top, x + leftWidth, y, centerWidth * scaleX, topHeight);
        this.addSprite(texture, regions.topRight, x + targetWidth - rightWidth, y, rightWidth, topHeight);
        
        y += topHeight;
        this.addSprite(texture, regions.left, x, y, leftWidth, centerHeight * scaleY);
        this.addSprite(texture, regions.center, x + leftWidth, y, centerWidth * scaleX, centerHeight * scaleY);
        this.addSprite(texture, regions.right, x + targetWidth - rightWidth, y, rightWidth, centerHeight * scaleY);
        
        y += centerHeight * scaleY;
        this.addSprite(texture, regions.bottomLeft, x, y, leftWidth, bottomHeight);
        this.addSprite(texture, regions.bottom, x + leftWidth, y, centerWidth * scaleX, bottomHeight);
        this.addSprite(texture, regions.bottomRight, x + targetWidth - rightWidth, y, rightWidth, bottomHeight);
        
        this.addChild(this.bg);
    }
    
    initBgCenter() {
        const bgCenterUpTexture = this.game.textures['tetris/bg_center_up.png'];
        this.bgCenterUp = new PIXI.Sprite(bgCenterUpTexture);
        this.bgCenterUp.anchor.set(0.5, 0.5);
        this.bgCenterUp.x = 0;
        this.bgCenterUp.y = 0;
        this.addChild(this.bgCenterUp);
    }
    
    addSprite(texture, region, x, y, width, height) {
        const sprite = new PIXI.Sprite(new PIXI.Texture(texture.baseTexture, region));
        sprite.x = x;
        sprite.y = y;
        sprite.width = width;
        sprite.height = height;
        this.bg.addChild(sprite);
    }

    safeRemoveSelf(){
        window.removeEventListener('keydown', this.onKeyDown);
        this.game.pixi.ticker.remove(this.tagUpdate);
        this.parent.removeChild(this);
    }
}

export default TetrisGameView;