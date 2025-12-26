import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import TetrisTile from './TetrisTile.js';
import * as TetrisShape from './TetrisShape.js';
import RandGenerator from './RandGenerator.js';

class TetrisGameView extends PIXI.Container {
    
    constructor(game) {
        super();
        this.game = game;
    }

    init(){
        this.initBgCenter();
        this.initBg();
        this.initGameLogic();
        this.initNextShapePreview();
    }

    initGameLogic() {
        this.rowCount = 20;
        this.colCount = 10;
        this.tileSize = 25;
        this.dropSpeed = 500;
        this.dropSpeedTimer = 0;
        this.dropPaused = false;

        this.tiles = [];
        for (let r = 0; r < this.rowCount+4; r++) {
            this.tiles[r] = [];
            for (let c = 0; c < this.colCount; c++) {
                this.tiles[r][c] = null;
            }
        }

        // 初始化粒子缓存池
        this.particlePool = [];
        this.particlePoolSize = 100; // 缓存池大小
        this.initParticlePool();

        // 初始化随机数生成器和形状队列
        this.shapeGenerator = new RandGenerator();
        this.nextShapInfos = [];
        this.initShapeQueue();

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

    get moveAnimationDuration() {
        return this.dropSpeed / 3;
    }

    initShapeQueue() {
        // 初始化队列，包含 2 个随机形状信息对象 {shapeType, colorIndex}
        this.nextShapInfos = [];
        const shapeTypes = Object.values(TetrisShape.TetrisShapeType);
        for (let i = 0; i < 2; i++) {
            const shapeIndex = this.shapeGenerator.nextInt(TetrisShape.TetrisShapeCount);
            const shapeType = shapeTypes[shapeIndex];
            const colorIndex = shapeIndex; // shapeType 的索引直接作为 colorIndex
            this.nextShapInfos.push({shapeType, colorIndex});
        }
    }

    getNextShapeInfo() {
        // 从队列头部取出一个形状信息对象
        const shapeInfo = this.nextShapInfos.shift();
        
        // 生成新的形状信息对象并添加到队列尾部，保持队列长度为 2
        const shapeTypes = Object.values(TetrisShape.TetrisShapeType);
        const newShapeIndex = this.shapeGenerator.nextInt(TetrisShape.TetrisShapeCount);
        const newShapeType = shapeTypes[newShapeIndex];
        const newColorIndex = newShapeIndex; // shapeType 的索引直接作为 colorIndex
        this.nextShapInfos.push({shapeType: newShapeType, colorIndex: newColorIndex});
        
        // 更新下一个形状预览
        this.updateNextShapePreview();
        
        return shapeInfo;
    }

    initKeyboard() {
        this.onKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (key === ' ') {
                e.preventDefault();
                this.dropPaused = !this.dropPaused;
                return;
            }
            
            if (!this.dropInfo) return;
            
            if (key === 'w') {
                this.handleRotate();
            } else if (key === 's') {
                this.handleDrop();
            } else if (key === 'a') {
                this.handleMoveLeft();
            } else if (key === 'd') {
                this.handleMoveRight();
            }
            else if (key === 'q') {
                this.playBreakAnim();
            }
        };
        
        window.addEventListener('keydown', this.onKeyDown);
    }

    handleRotate() {
        if (!this.dropInfo) return;
        
        const rotationOrder = [0, 'R', 2, 'L'];
        const currentIndex = rotationOrder.indexOf(this.dropInfo.rotation);
        const nextRotation = rotationOrder[(currentIndex + 1) % 4];
        
        this.tryRotate(this.dropInfo.rotation, nextRotation);
    }

    tryRotate(fromRotation, toRotation) {
        const shapeDef = TetrisShape.TetrisShapeDef[this.dropInfo.shapeType];
        const fromTiles = shapeDef.rotations[fromRotation];
        const toTiles = shapeDef.rotations[toRotation];
        
        const kickKey = `${fromRotation}->${toRotation}`;
        const kickTable = shapeDef.kickTable[kickKey] || [[0, 0]];
        
        const currentMinRC = this.getShapeBaseRC();
        
        const fromPositions = [];
        for (let r = 0; r < fromTiles.length; r++) {
            for (let c = 0; c < fromTiles[r].length; c++) {
                if (fromTiles[r][c] > 0) {
                    fromPositions.push({r, c});
                }
            }
        }
        
        const toPositions = [];
        for (let r = 0; r < toTiles.length; r++) {
            for (let c = 0; c < toTiles[r].length; c++) {
                if (toTiles[r][c] > 0) {
                    toPositions.push({r, c});
                }
            }
        }
        
        if (fromPositions.length !== toPositions.length) {
            return false;
        }
        
        const fromMinR = Math.min(...fromPositions.map(p => p.r));
        const fromMinC = Math.min(...fromPositions.map(p => p.c));
        const toMinR = Math.min(...toPositions.map(p => p.r));
        const toMinC = Math.min(...toPositions.map(p => p.c));
        
        for (let kickIndex = 0; kickIndex < kickTable.length; kickIndex++) {
            const kick = kickTable[kickIndex];
            const newRCs = [];
            
            for (let i = 0; i < toPositions.length; i++) {
                const toPos = toPositions[i];
                const newRC = {
                    r: currentMinRC.r - fromMinR + toPos.r + kick[1],
                    c: currentMinRC.c - fromMinC + toPos.c + kick[0]
                };
                newRCs.push(newRC);
            }
            
            if (this.isValidPosition(newRCs)) {
                this.applyRotation(newRCs, toRotation);
                return true;
            }
        }
        
        return false;
    }

    getShapeBaseRC() {
        let minR = Infinity;
        let minC = Infinity;
        for (let i = 0; i < this.dropInfo.rcs.length; i++) {
            minR = Math.min(minR, this.dropInfo.rcs[i].r);
            minC = Math.min(minC, this.dropInfo.rcs[i].c);
        }
        return {r: minR, c: minC};
    }

    getFirstTilePosition(tiles) {
        for (let r = 0; r < tiles.length; r++) {
            for (let c = 0; c < tiles[r].length; c++) {
                if (tiles[r][c] > 0) {
                    return {r, c};
                }
            }
        }
        return {r: 0, c: 0};
    }

    isValidPosition(rcs) {
        for (let i = 0; i < rcs.length; i++) {
            const rc = rcs[i];
            if (rc.r < 0 || rc.r >= this.rowCount + 4 || rc.c < 0 || rc.c >= this.colCount) {
                return false;
            }
            if (this.tiles[rc.r] && this.tiles[rc.r][rc.c]) {
                return false;
            }
        }
        return true;
    }

    applyRotation(newRCs, newRotation) {
        for (let i = 0; i < this.dropInfo.rcs.length; i++) {
            const newRC = newRCs[i];
            const tile = this.dropInfo.tiles[i];
            
            this.dropInfo.rcs[i] = newRC;
            
            const targetPos = this.getPosByRC(newRC.r, newRC.c);
            tile.animateToPosition(targetPos, this.moveAnimationDuration);
        }
        this.dropInfo.rotation = newRotation;
        this.updateDropIndicator();
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
        if (!this.dropInfo) return false;
        for (let i = 0; i < this.dropInfo.rcs.length; i++) {
            let rc = this.dropInfo.rcs[i];
            if (rc.c <= 0) return false;
            if (this.tiles[rc.r][rc.c - 1]) return false;
        }
        return true;
    }

    canMoveRight() {
        if (!this.dropInfo) return false;
        for (let i = 0; i < this.dropInfo.rcs.length; i++) {
            let rc = this.dropInfo.rcs[i];
            if (rc.c >= this.colCount - 1) return false;
            if (this.tiles[rc.r][rc.c + 1]) return false;
        }
        return true;
    }

    update() {
        const deltaMS = this.game.pixi.ticker.deltaMS;

        if (!this.dropPaused){
            this.dropSpeedTimer += deltaMS;
            if (this.dropSpeedTimer >= this.dropSpeed) {
                this.dropSpeedTimer = 0;
                this.checkTotalDrop();
            }
        }
    }

    checkTotalDrop() {
        if (this.isAtBottom(this.dropInfo)) {
            this.removeDropingShape();
        }
        else if (this.dropInfo) {
            this.doDrop();
        }
        else {
            this.createNewShape();
        }
    }

    removeDropingShape() {
        for (let i = 0; i < this.dropInfo.rcs.length; i++) {
            let rc = this.dropInfo.rcs[i];
            this.tiles[rc.r][rc.c] = this.dropInfo.tiles[i];
        }
        
        const affectedRows = [];
        for (let i = 0; i < this.dropInfo.rcs.length; i++) {
            const row = this.dropInfo.rcs[i].r;
            if (row >= 0 && row < this.rowCount) {
                if (!affectedRows.includes(row)) {
                    affectedRows.push(row);
                }
            }
        }
        
        if (this.dropInfo.previewSprites) {
            for (let i = 0; i < this.dropInfo.previewSprites.length; i++) {
                this.removeChild(this.dropInfo.previewSprites[i]);
            }
            this.dropInfo.previewSprites = null;
        }
        
        this.dropInfo = null;
        
        this.checkBreakLine(affectedRows);
    }

    checkBreakLine(affectedRows) {
        const fullRows = [];
        for (let i = 0; i < affectedRows.length; i++) {
            const row = affectedRows[i];
            let isFull = true;
            // 检查这一行是否所有列都有 tile
            for (let c = 0; c < this.colCount; c++) {
                if (!this.tiles[row][c]) {
                    isFull = false;
                    break;
                }
            }
            if (isFull) {
                fullRows.push(row);
            }
        }
        
        // 如果没有满行，直接返回
        if (fullRows.length === 0) {
            return;
        }
        
        // 暂停下落
        this.dropPaused = true;
        
        // 对每个满行的 tile 播放破碎动画
        for (let i = 0; i < fullRows.length; i++) {
            const row = fullRows[i];
            for (let c = 0; c < this.colCount; c++) {
                const tile = this.tiles[row][c];
                if (tile) {
                    // 播放破碎动画
                    tile.playBreakAnim();
                }
            }
        }
        
        // 等待动画完成后移除满行并下落
        // 这里使用 setTimeout 来延迟执行，等待破碎动画播放
        setTimeout(() => {
            this.removeFullRows(fullRows);
        }, 100); // 给一点时间让动画开始
    }

    removeFullRows(fullRows) {
        // 先移除满行的 tile
        for (let i = 0; i < fullRows.length; i++) {
            const row = fullRows[i];
            for (let c = 0; c < this.colCount; c++) {
                const tile = this.tiles[row][c];
                if (tile && tile.parent) {
                    tile.parent.removeChild(tile);
                }
                this.tiles[row][c] = null;
            }
        }
        
        // 计算每个 tile 需要下落多少行
        // 从下往上处理，计算每个 tile 的最终位置
        const fullRowsSet = new Set(fullRows);
        
        // 从下往上遍历所有行
        for (let r = 0; r < this.rowCount + 4; r++) {
            // 如果这一行是满行，跳过
            if (fullRowsSet.has(r)) {
                continue;
            }
            
            // 计算这一行需要下落多少行（下方有多少个满行）
            let dropCount = 0;
            for (let checkRow = 0; checkRow < r; checkRow++) {
                if (fullRowsSet.has(checkRow)) {
                    dropCount++;
                }
            }
            
            // 如果不需要下落，跳过
            if (dropCount === 0) {
                continue;
            }
            
            // 处理这一行的所有 tile
            for (let c = 0; c < this.colCount; c++) {
                const tile = this.tiles[r][c];
                if (tile) {
                    // 计算最终位置
                    const finalRow = r - dropCount;
                    
                    // 更新逻辑位置（直接移动到最终位置）
                    this.tiles[finalRow][c] = tile;
                    this.tiles[r][c] = null;
                    
                    // 更新视觉位置（一次性动画到最终位置）
                    const pos = this.getPosByRC(finalRow, c);
                    tile.animateToPosition(pos, this.moveAnimationDuration);
                }
            }
        }
        
        setTimeout(() => {
            this.dropPaused = false;
        }, this.moveAnimationDuration);
    }

    doDrop() {
        this.moveDropingInfo({r: -1, c: 0});
    }

    moveDropingInfo(diffRC) {
        for (let i = 0; i < this.dropInfo.rcs.length; i++) {
            let rc = this.dropInfo.rcs[i];
            const tile = this.dropInfo.tiles[i];
            
            rc.r += diffRC.r;
            rc.c += diffRC.c;
            
            const targetPos = this.getPosByRC(rc.r, rc.c);
            tile.animateToPosition(targetPos, this.moveAnimationDuration);
        }
        this.updateDropIndicator();
    }

    createNewShape() {
        this.dropInfo = {};
        const shapeInfo = this.getNextShapeInfo();
        this.dropInfo.shapeType = shapeInfo.shapeType;
        this.dropInfo.rotation = 0;
        this.dropInfo.rcs = [];
        this.dropInfo.tiles = [];

        let shapeDef = TetrisShape.TetrisShapeDef[this.dropInfo.shapeType];
        let shapeTiles = shapeDef.rotations[0];
        
        let minRow = 0;
        for (let r = 0; r < shapeTiles.length; r++) {
            for (let c = 0; c < shapeTiles[r].length; c++) {
                if (shapeTiles[r][c] > 0) {
                    minRow = Math.max(minRow, r);
                }
            }
        }
        
        let row = this.rowCount - 1 - minRow;
        let col = Math.floor((this.colCount - shapeTiles[0].length) / 2);

        let colorIndex = shapeInfo.colorIndex;
        this.dropInfo.previewSprites = [];
        const textureUrl = 'tetris/tile' + (colorIndex + 1) + '.png';
        const texture = this.game.textures[textureUrl];
        
        for (let r = 0; r < shapeTiles.length; r++) {
            for (let c = 0; c < shapeTiles[r].length; c++) {
                let tileType = shapeTiles[r][c];
                if (tileType > 0) {
                    let tile = new TetrisTile(this.game);
                    tile.init(colorIndex);
                    this.addChild(tile);
                    let pos = this.getPosByRC(row + r, col + c);
                    tile.position.set(pos.x, pos.y);

                    this.dropInfo.rcs.push({r: row + r, c: col + c});
                    this.dropInfo.tiles.push(tile);
                    
                    const previewSprite = new PIXI.Sprite(texture);
                    previewSprite.anchor.set(0.5, 0.5);
                    previewSprite.alpha = 0.1;
                    previewSprite.tint = 0x000000;
                    this.addChild(previewSprite);
                    this.dropInfo.previewSprites.push(previewSprite);
                }
            }
        }

        this.updateDropIndicator();
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
            dropingInfo = this.dropInfo;
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

    getDropLandingRCs() {
        if (!this.dropInfo) return [];
        
        const currentRCs = this.dropInfo.rcs.map(rc => ({r: rc.r, c: rc.c}));
        let dropOffset = 0;
        
        while (true) {
            const testRCs = currentRCs.map(rc => ({r: rc.r - dropOffset - 1, c: rc.c}));
            
            let canDrop = true;
            for (let i = 0; i < testRCs.length; i++) {
                const testRC = testRCs[i];
                if (testRC.r < 0) {
                    canDrop = false;
                    break;
                }
                if (this.tiles[testRC.r] && this.tiles[testRC.r][testRC.c]) {
                    canDrop = false;
                    break;
                }
            }
            
            if (!canDrop) {
                break;
            }
            
            dropOffset++;
        }
        
        const landingRCs = currentRCs.map(rc => ({r: rc.r - dropOffset, c: rc.c}));
        return landingRCs;
    }

    updateDropIndicator() {
        if (!this.dropInfo || !this.dropInfo.previewSprites) {
            return;
        }

        const landingRCs = this.getDropLandingRCs();

        for (let i = 0; i < this.dropInfo.previewSprites.length; i++) {
            const previewSprite = this.dropInfo.previewSprites[i];
            const landingRC = landingRCs[i];
            const landingPos = this.getPosByRC(landingRC.r, landingRC.c);
            previewSprite.position.set(landingPos.x, landingPos.y);
        }
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

    initNextShapePreview() {
        // 创建预览容器
        this.nextShapePreviewContainer = new PIXI.Container();
        
        // 获取 bgCenterUp 的右边缘位置
        const bgCenterUpRight = this.bgCenterUp.x + this.bgCenterUp.width / 2;
        
        // 创建底板
        const bgTexture = this.game.textures['tetris/bg_r_1.png'];
        this.nextShapePreviewBg = new PIXI.Sprite(bgTexture);
        this.nextShapePreviewBg.anchor.set(0, 0.5); // 左锚点，垂直居中
        this.nextShapePreviewBg.x = bgCenterUpRight; // 紧贴 bgCenterUp 的右侧
        this.nextShapePreviewBg.y = -200; // 与 bgCenterUp 同一水平线
        this.nextShapePreviewContainer.addChild(this.nextShapePreviewBg);
        
        // 存储预览 tile 的容器
        this.nextShapePreviewTiles = [[], []]; // [0] 用于 nextShapInfos[0], [1] 用于 nextShapInfos[1]
        
        this.addChild(this.nextShapePreviewContainer);
        
        // 初始化显示
        this.updateNextShapePreview();
    }

    updateNextShapePreview() {
        if (!this.nextShapePreviewContainer || this.nextShapePreviewTiles.length < 2) {
            return;
        }
        
        // 清除旧的预览 tile
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < this.nextShapePreviewTiles[i].length; j++) {
                if (this.nextShapePreviewTiles[i][j].parent) {
                    this.nextShapePreviewTiles[i][j].parent.removeChild(this.nextShapePreviewTiles[i][j]);
                }
            }
            this.nextShapePreviewTiles[i] = [];
        }
        
        if (this.nextShapInfos.length < 2) {
            return;
        }
        
        // 获取底板的位置和尺寸
        const bgLeft = this.nextShapePreviewBg.x;
        const bgWidth = this.nextShapePreviewBg.width;
        const bgY = this.nextShapePreviewBg.y;
        
        const previewTileSize = 15; // 预览 tile 的大小，比游戏中的小
        
        // 左侧部分：显示 nextShapInfos[0] (不透明)
        const leftX = bgLeft + bgWidth * 0.25; // 左侧 1/4 位置（左侧部分的中心）
        const leftY = bgY;
        const shapeInfo0 = this.nextShapInfos[0];
        this.renderShapePreview(shapeInfo0, leftX, leftY, previewTileSize, 1.0, 0);
        
        // 右侧部分：显示 nextShapInfos[1] (半透明)
        const rightX = bgLeft + bgWidth * 0.75; // 右侧 3/4 位置（右侧部分的中心）
        const rightY = bgY;
        const shapeInfo1 = this.nextShapInfos[1];
        this.renderShapePreview(shapeInfo1, rightX, rightY, previewTileSize, 0.5, 1);
    }

    renderShapePreview(shapeInfo, centerX, centerY, tileSize, alpha, previewIndex) {
        if (!shapeInfo) return;
        
        const shapeDef = TetrisShape.TetrisShapeDef[shapeInfo.shapeType];
        const shapeTiles = shapeDef.rotations[0];
        
        // 计算形状的边界
        let minR = Infinity, maxR = -Infinity;
        let minC = Infinity, maxC = -Infinity;
        for (let r = 0; r < shapeTiles.length; r++) {
            for (let c = 0; c < shapeTiles[r].length; c++) {
                if (shapeTiles[r][c] > 0) {
                    minR = Math.min(minR, r);
                    maxR = Math.max(maxR, r);
                    minC = Math.min(minC, c);
                    maxC = Math.max(maxC, c);
                }
            }
        }
        
        // 计算形状的中心偏移
        const shapeWidth = (maxC - minC + 1) * tileSize;
        const shapeHeight = (maxR - minR + 1) * tileSize;
        const offsetX = -shapeWidth / 2 + tileSize / 2;
        const offsetY = -shapeHeight / 2 + tileSize / 2;
        
        // 创建 tile
        const textureUrl = 'tetris/tile' + (shapeInfo.colorIndex + 1) + '.png';
        const texture = this.game.textures[textureUrl];
        
        for (let r = 0; r < shapeTiles.length; r++) {
            for (let c = 0; c < shapeTiles[r].length; c++) {
                if (shapeTiles[r][c] > 0) {
                    const tileSprite = new PIXI.Sprite(texture);
                    tileSprite.anchor.set(0.5, 0.5);
                    tileSprite.alpha = alpha;
                    tileSprite.width = tileSize;
                    tileSprite.height = tileSize;
                    
                    const x = centerX + offsetX + (c - minC) * tileSize;
                    // 使用与实际游戏一致的坐标系统：r 增加时 y 减小（向上）
                    const y = centerY + offsetY - (r - minR) * tileSize;
                    tileSprite.position.set(x, y);
                    
                    this.nextShapePreviewContainer.addChild(tileSprite);
                    this.nextShapePreviewTiles[previewIndex].push(tileSprite);
                }
            }
        }
    }
    
    addSprite(texture, region, x, y, width, height) {
        const sprite = new PIXI.Sprite(new PIXI.Texture(texture.baseTexture, region));
        sprite.x = x;
        sprite.y = y;
        sprite.width = width;
        sprite.height = height;
        this.bg.addChild(sprite);
    }

    // 初始化粒子缓存池
    initParticlePool() {
        // 预创建一些粒子（使用通用纹理，后续可以替换）
        for (let i = 0; i < this.particlePoolSize; i++) {
            const sprite = new PIXI.Sprite();
            sprite.anchor.set(0.5, 0.5);
            sprite.visible = false;
            this.particlePool.push(sprite);
        }
    }

    // 从缓存池获取粒子
    getParticle(texture) {
        let sprite = this.particlePool.pop();
        if (!sprite) {
            // 如果缓存池为空，创建新的粒子
            sprite = new PIXI.Sprite();
            sprite.anchor.set(0.5, 0.5);
        }
        
        // 设置纹理和初始状态
        sprite.texture = texture;
        sprite.visible = true;
        sprite.alpha = 1;
        sprite.scale.set(1);
        sprite.rotation = 0;
        
        return sprite;
    }

    // 归还粒子到缓存池
    returnParticle(sprite) {
        if (!sprite) return;
        
        // 重置状态
        sprite.visible = false;
        sprite.alpha = 1;
        sprite.scale.set(1);
        sprite.rotation = 0;
        
        // 从父容器移除
        if (sprite.parent) {
            sprite.parent.removeChild(sprite);
        }
        
        // 归还粒子到缓存池（总是归还，因为粒子是从缓存池取出的）
        this.particlePool.push(sprite);
    }

    playBreakAnim() {
        if (!this.dropInfo || !this.dropInfo.tiles) return;

        // 遍历所有 tile，调用每个 tile 的炸裂动画
        for (let i = 0; i < this.dropInfo.tiles.length; i++) {
            const tile = this.dropInfo.tiles[i];
            tile.playBreakAnim();
        }
    }

    safeRemoveSelf(){
        // 停止所有 tile 的移动动画
        if (this.dropInfo && this.dropInfo.tiles) {
            this.dropInfo.tiles.forEach(tile => {
                if (tile.MoveTween) {
                    tile.MoveTween.stop();
                    tile.MoveTween = null;
                }
            });
        }
        
        // 停止所有已放置 tile 的移动动画
        for (let r = 0; r < this.tiles.length; r++) {
            for (let c = 0; c < this.tiles[r].length; c++) {
                const tile = this.tiles[r][c];
                if (tile && tile.MoveTween) {
                    tile.MoveTween.stop();
                    tile.MoveTween = null;
                }
            }
        }
        
        window.removeEventListener('keydown', this.onKeyDown);
        this.game.pixi.ticker.remove(this.tagUpdate);
        this.parent.removeChild(this);
    }
}

export default TetrisGameView;