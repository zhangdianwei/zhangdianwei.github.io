import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import TetrisTile from './TetrisTile.js';
import * as TetrisShape from './TetrisShape.js';
import RandGenerator from './RandGenerator.js';
import TetrisButton from './TetrisButton.js';

class TetrisGameView extends PIXI.Container {
    
    constructor(game) {
        super();
        this.game = game;
    }

    init(){
        this.initBg();
        this.initBgCenter();
        this.initGameLogic();
        this.initNextShapePreview();
        this.initInfoDisplay();
        // this.initDirectionButtons();
    }

    initGameLogic() {
        this.rowCount = 20;
        this.colCount = 10;
        this.tileSize = 25;
        this.speedLevel = 1;
        this.dropSpeedTimer = 0;
        this.dropPaused = false;
        this.isDead = false;

        // 游戏统计信息
        this.score = 0;
        this.linesCleared = 0;

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
        for (let r = 0; r < 17; r++) {
            for (let c = 0; c < this.colCount; c++) {
                let tile = new TetrisTile(this.game);
                tile.init(0);
                this.addChild(tile);
                let pos = this.getPosByRC(r, c);
                tile.position.set(pos.x, pos.y);
                this.tiles[r][c] = tile;
            }
        }

        this.tagUpdate = this.update.bind(this);
        this.game.pixi.ticker.add(this.tagUpdate, this);

        this.initKeyboard();
        this.checkTotalDrop();
    }

    dropSpeed() {
        return 500 - (this.speedLevel - 1) * (500 - 100) / (10 - 1);
    }

    get moveAnimationDuration() {
        return this.dropSpeed() / 3;
    }

    initShapeQueue() {
        // 初始化队列，包含 2 个随机形状信息对象 {shapeType, colorIndex}
        this.nextShapInfos = [];
        this.getNextShapeInfo();
        // const shapeTypes = Object.values(TetrisShape.TetrisShapeType);
        // for (let i = 0; i < 2; i++) {
        //     const shapeIndex = this.shapeGenerator.nextInt(TetrisShape.TetrisShapeCount);
        //     const shapeType = shapeTypes[shapeIndex];
        //     const colorIndex = shapeIndex; // shapeType 的索引直接作为 colorIndex
        //     this.nextShapInfos.push({shapeType, colorIndex});
        // }
    }

    getNextShapeInfo() {
        // 从队列头部取出一个形状信息对象
        const shapeInfo = this.nextShapInfos.shift();
        
        // 如果队列数量不足2个，补足到2个
        const shapeTypes = Object.values(TetrisShape.TetrisShapeType);
        while (this.nextShapInfos.length < 2) {
            let newShapeIndex = this.shapeGenerator.nextInt(TetrisShape.TetrisShapeCount);
            // newShapeIndex = 0;
            const newShapeType = shapeTypes[newShapeIndex];
            const newColorIndex = newShapeIndex; // shapeType 的索引直接作为 colorIndex
            this.nextShapInfos.push({shapeType: newShapeType, colorIndex: newColorIndex});
        }
        
        // 更新下一个形状预览
        this.updateNextShapePreview();
        
        return shapeInfo;
    }

    switchNextShapeInfo() {
        // 切换 nextShapInfos[0] 和 nextShapInfos[1]
        if (this.nextShapInfos.length >= 2) {
            const temp = this.nextShapInfos[0];
            this.nextShapInfos[0] = this.nextShapInfos[1];
            this.nextShapInfos[1] = temp;
            // 更新预览显示
            this.updateNextShapePreview();
        }
    }

    initKeyboard() {
        this.onKeyDown = (e) => {
            if (this.isDead) return;

            const key = e.key.toLowerCase();
            if (key === ' ') {
                e.preventDefault();
                this.dropPaused = !this.dropPaused;
                return;
            }
            
            if (key === 'f') {
                this.switchNextShapeInfo();
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
        if (!this.dropInfo) return;
        
        const landingRCs = this.getDropLandingRCs();
        if (landingRCs.length === 0) return;
        
        let minDistance = Infinity;
        for (let i = 0; i < this.dropInfo.rcs.length; i++) {
            const currentR = this.dropInfo.rcs[i].r;
            const landingR = landingRCs[i].r;
            const distance = currentR - landingR;
            minDistance = Math.min(minDistance, distance);
        }
        
        if (minDistance > 200) {
            for (let i = 0; i < this.dropInfo.rcs.length; i++) {
                const currentR = this.dropInfo.rcs[i].r;
                const landingR = landingRCs[i].r;
                const targetR = landingR + 1;
                
                const tile = this.dropInfo.tiles[i];
                this.dropInfo.rcs[i].r = targetR;
                
                const targetPos = this.getPosByRC(targetR, this.dropInfo.rcs[i].c);
                tile.animateToPosition(targetPos, this.moveAnimationDuration);
            }
            this.updateDropIndicator();
            this.dropSpeedTimer = 0;
        } else if (minDistance >= 0) {
            for (let i = 0; i < this.dropInfo.rcs.length; i++) {
                const newRC = landingRCs[i];
                const tile = this.dropInfo.tiles[i];
                
                this.dropInfo.rcs[i] = newRC;
                
                const targetPos = this.getPosByRC(newRC.r, newRC.c);
                tile.animateToPosition(targetPos, this.moveAnimationDuration);
            }

            this.updateDropIndicator();
            this.dropSpeedTimer = 0;
        }
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
            if (this.dropSpeedTimer >= this.dropSpeed()) {
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

        if (!this.isDead && this.checkDead()) {
            this.onDead();
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
        const lineCount = fullRows.length;
        const oldLinesCleared = this.linesCleared;
        this.linesCleared += lineCount;
        
        const oldLevel = Math.floor(oldLinesCleared / 10);
        const newLevel = Math.floor(this.linesCleared / 10);
        if (newLevel > oldLevel && this.speedLevel < 10) {
            this.speedLevel = Math.min(this.speedLevel + (newLevel - oldLevel), 10);
        }
        
        let points = 1000;
        if (lineCount === 1) {
            points = 100;
        } else if (lineCount === 2) {
            points = 200;
        } else if (lineCount === 3) {
            points = 600;
        } else if (lineCount === 4) {
            points = 800;
        }
        this.score += points;
        
        this.updateInfoDisplay();
        
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

    checkDead() {
        if (!this.dropInfo || !this.dropInfo.rcs) {
            return false;
        }
        
        for (let i = 0; i < this.dropInfo.rcs.length; i++) {
            const rc = this.dropInfo.rcs[i];
            if (this.tiles[rc.r] && this.tiles[rc.r][rc.c]) {
                return true;
            }
        }
        
        return false;
    }

    onDead() {
        this.isDead = true;
        this.dropPaused = true;
        setTimeout(() => {
            this.playDeadAppearAnim();
        }, 500);
    }

    playDeadAppearAnim() {
        const bgCenterUpTexture = this.game.textures['tetris/bg_center_up.png'];
        const circleTexture = this.game.textures['tetris/circle.png'];
        if (!circleTexture || !bgCenterUpTexture) {
            return;
        }

        const maskGraphics = new PIXI.Graphics();
        maskGraphics.beginFill(0x000000, 0.5);
        const cornerRadius = 10;
        maskGraphics.drawRoundedRect(-bgCenterUpTexture.width / 2, -bgCenterUpTexture.height / 2, bgCenterUpTexture.width, bgCenterUpTexture.height, cornerRadius);
        maskGraphics.endFill();
        maskGraphics.position.set(0, 0);
        maskGraphics.alpha = 0;
        this.addChild(maskGraphics);

        const maskAlphaTween = new TWEEN.Tween({ alpha: 0 })
            .to({ alpha: 1 }, 250)
            .onUpdate((obj) => {
                maskGraphics.alpha = obj.alpha;
            })
            .start();

        const deadContainer = new PIXI.Container();
        deadContainer.position.set(0, 0);

        const circleSprite = new PIXI.Sprite(circleTexture);
        circleSprite.anchor.set(0.5, 0.5);
        circleSprite.position.set(0, 0);
        deadContainer.addChild(circleSprite);

        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Comic Sans MS, Marker Felt, Chalkduster, cursive',
            fontSize: 64,
            fill: 0xFFD700,
            fontWeight: 'bold',
            align: 'center'
        });

        const deadText = new PIXI.Text('DEAD', textStyle);
        deadText.anchor.set(0.5, 0.5);
        deadText.position.set(0, 0);
        deadContainer.addChild(deadText);

        const backButton = new TetrisButton(this.game, '回主界面', () => {
            // TODO: 实现返回主界面的逻辑
        });
        backButton.position.set(0, 150);
        deadContainer.addChild(backButton);

        deadContainer.alpha = 0;
        deadContainer.scale.set(0.1);

        this.addChild(deadContainer);

        const scaleTween = new TWEEN.Tween({ scale: 0.1 })
            .to({ scale: 1.0 }, 800)
            .easing(TWEEN.Easing.Elastic.Out)
            .onUpdate((obj) => {
                deadContainer.scale.set(obj.scale);
            })
            .start();

        const alphaTween = new TWEEN.Tween({ alpha: 0 })
            .to({ alpha: 1 }, 250)
            .onUpdate((obj) => {
                deadContainer.alpha = obj.alpha;
            })
            .start();
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

    initInfoDisplay() {
        // 创建信息展示容器
        this.infoDisplayContainer = new PIXI.Container();
        
        // 获取预览容器的位置
        const bgCenterUpRight = this.bgCenterUp.x + this.bgCenterUp.width / 2;
        const previewBgBottom = this.nextShapePreviewBg.y + this.nextShapePreviewBg.height / 2;
        
        // 信息展示区在预览容器下方
        const infoX = bgCenterUpRight;
        const infoY = previewBgBottom + 20; // 距离预览容器底部 20 像素
        
        // 创建底板
        const bgTexture = this.game.textures['tetris/bg_r_1.png'];
        this.infoDisplayBg = new PIXI.Sprite(bgTexture);
        this.infoDisplayBg.anchor.set(0, 0); // 左上锚点
        this.infoDisplayBg.x = infoX;
        this.infoDisplayBg.y = infoY - 10; // 稍微向上偏移，为文本留出空间
        this.infoDisplayContainer.addChild(this.infoDisplayBg);
        
        // 创建文本样式（黑色字体）
        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Comic Sans MS, Marker Felt, Chalkduster, cursive',
            fontSize: 16,
            fill: 0x000000,
            align: 'left'
        });
        
        // 速度
        this.speedLabel = new PIXI.Text('速度:', textStyle);
        this.speedLabel.anchor.set(0, 0);
        this.speedLabel.x = infoX + 10; // 左边距
        this.speedLabel.y = infoY;
        this.infoDisplayContainer.addChild(this.speedLabel);
        
        this.speedValue = new PIXI.Text('500ms', textStyle);
        this.speedValue.anchor.set(0, 0);
        this.speedValue.x = infoX + 60;
        this.speedValue.y = infoY;
        this.infoDisplayContainer.addChild(this.speedValue);
        
        // 消行
        this.linesLabel = new PIXI.Text('消行:', textStyle);
        this.linesLabel.anchor.set(0, 0);
        this.linesLabel.x = infoX + 10;
        this.linesLabel.y = infoY + 25;
        this.infoDisplayContainer.addChild(this.linesLabel);
        
        this.linesValue = new PIXI.Text('0', textStyle);
        this.linesValue.anchor.set(0, 0);
        this.linesValue.x = infoX + 60;
        this.linesValue.y = infoY + 25;
        this.infoDisplayContainer.addChild(this.linesValue);
        
        // 得分
        this.scoreLabel = new PIXI.Text('得分:', textStyle);
        this.scoreLabel.anchor.set(0, 0);
        this.scoreLabel.x = infoX + 10;
        this.scoreLabel.y = infoY + 50;
        this.infoDisplayContainer.addChild(this.scoreLabel);
        
        this.scoreValue = new PIXI.Text('0', textStyle);
        this.scoreValue.anchor.set(0, 0);
        this.scoreValue.x = infoX + 60;
        this.scoreValue.y = infoY + 50;
        this.infoDisplayContainer.addChild(this.scoreValue);
        
        // 初始化 animState
        this.animRollNum(this.speedValue, this.speedLevel);
        this.animRollNum(this.linesValue, this.linesCleared);
        this.animRollNum(this.scoreValue, this.score);
        
        this.addChild(this.infoDisplayContainer);
        
        // 初始化显示
        this.updateInfoDisplay();
    }

    animRollNum(valueObj, targetNum) {
        // 如果没有 animState，创建默认的并直接设置值
        if (!valueObj.animState) {
            valueObj.animState = { current: targetNum, target: targetNum, tween: null };
            valueObj.text = targetNum.toString();
            return;
        }
        
        const animState = valueObj.animState;
        
        // 如果 target 和 targetNum 一样，什么都不做
        if (animState.target === targetNum) {
            return;
        }
        
        // 更新 target
        animState.target = targetNum;
        
        // 如果存在旧动画，停止它
        if (animState.tween) {
            animState.tween.stop();
        }
        
        // 从 animState 中获取当前值（current）
        const currentValue = animState.current;
        
        // 创建新的滚动动画，从 current 变化到 targetNum
        animState.tween = new TWEEN.Tween({ value: currentValue })
            .to({ value: targetNum }, 200)
            .onUpdate((obj) => {
                const roundedValue = Math.round(obj.value);
                animState.current = roundedValue;
                valueObj.text = roundedValue.toString();
            })
            .onComplete(() => {
                // 动画完成后，确保值精确等于目标值
                animState.current = targetNum;
                valueObj.text = targetNum.toString();
            })
            .start();
    }

    updateInfoDisplay() {
        if (!this.infoDisplayContainer) return;
        this.animRollNum(this.speedValue, this.speedLevel);
        this.animRollNum(this.linesValue, this.linesCleared);
        this.animRollNum(this.scoreValue, this.score);
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

    initDirectionButtons() {
        this.directionButtonsContainer = new PIXI.Container();
        this.directionButtonsContainer.position.set(200, 50);
        this.addChild(this.directionButtonsContainer);
        this.directionButtonsContainer.scale.set(0.8);
        
        const arrowTexture = this.game.textures['tetris/arrow.png'];

        const buttonConfigs = [
            { angle: 270, action: this.handleMoveLeft.bind(this),   offset: {x: 0, y: -12} },
            { angle: 90,  action: this.handleDrop.bind(this),       offset: {x: 0, y: 12} },
            { angle: 180, action: this.handleMoveLeft.bind(this),   offset: {x: -12, y: 0} },
            { angle: 0,   action: this.handleMoveRight.bind(this),  offset: {x: 12, y: 0} },
        ];
        
        this.directionButtons = [];
        
        for (let i = 0; i < buttonConfigs.length; i++) {
            const config = buttonConfigs[i];
            const angleRad = (config.angle * Math.PI) / 180;
            
            const arrowSprite = new PIXI.Sprite(arrowTexture);
            arrowSprite.anchor.set(0, 0.5);
            arrowSprite.rotation = angleRad;
            arrowSprite.position.set(config.offset.x, config.offset.y);
            
            arrowSprite.eventMode = 'static';
            arrowSprite.cursor = 'pointer';
            
            const onButtonDown = () => {
                arrowSprite.scale.set(0.9);
            };
            
            const onButtonUp = () => {
                arrowSprite.scale.set(1);
            };
            
            const onButtonClick = () => {
                config.action();
            };
            
            arrowSprite.on('pointerdown', onButtonDown);
            arrowSprite.on('pointerup', onButtonUp);
            arrowSprite.on('pointerupoutside', onButtonUp);
            arrowSprite.on('pointertap', onButtonClick);
            
            arrowSprite.on('touchstart', onButtonDown);
            arrowSprite.on('touchend', onButtonUp);
            arrowSprite.on('touchendoutside', onButtonUp);
            arrowSprite.on('tap', onButtonClick);
            
            this.directionButtonsContainer.addChild(arrowSprite);
            this.directionButtons.push({
                sprite: arrowSprite,
                action: config.action
            });
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