import * as PIXI from 'pixi.js';
import TetrisTile from './TetrisTile.js';
import * as TetrisShape from './TetrisShape.js';
import { GameAction, BuffType } from './data/TetrisEvents.js';

export default class PlayGameView extends PIXI.Container {

    constructor(dialog) {
        super();
        this.dialog = dialog;
        this.app = dialog.app;
    }

    init() {
        this.hasEnded = false;
        this.finishReason = '';

        this.initGameLogic();
        this.initBgCenter();
    }

    initGameLogic() {
        // 游戏规则配置（常量）
        this.rowCount = 20;
        this.colCount = 10;
        this.tileSize = 25;
        this.extraTopRowCount = 6;
        this.moveAnimationDuration = 200;

        this.tiles = [];
        for (let r = 0; r < this.rowCount + this.extraTopRowCount; r++) {
            this.tiles[r] = [];
            for (let c = 0; c < this.colCount; c++) {
                this.tiles[r][c] = null;
            }
        }

        // 初始化粒子缓存池
        this.particlePool = [];
        this.particlePoolSize = 100; // 缓存池大小
        this.initParticlePool();
    }

    initBgCenter() {
        this.boardBg = new PIXI.Sprite(this.app.textures.bgCenterSelf);
        this.boardBg.anchor.set(0.5, 0.5);
        this.boardBg.x = 0;
        this.boardBg.y = 0;
        this.addChild(this.boardBg);
    }

    handleRotate() {
        if (!this.dropInfo) return false;

        const rotationOrder = [0, 'R', 2, 'L'];
        const currentIndex = rotationOrder.indexOf(this.dropInfo.rotation);
        const nextRotation = rotationOrder[(currentIndex + 1) % 4];

        return this.tryRotate(this.dropInfo.rotation, nextRotation);
    }

    doGameAction(actionData) {
        const ruleMgr = this.dialog.ruleMgr;
        if (ruleMgr.isDead) return false;

        const { type } = actionData;

        switch (type) {
            case GameAction.MoveLeft:
                if (!this.dropInfo) return false;
                if (this.canMoveLeft()) {
                    this.handleMoveLeft();
                    return true;
                }
                return false;

            case GameAction.MoveRight:
                if (!this.dropInfo) return false;
                if (this.canMoveRight()) {
                    this.handleMoveRight();
                    return true;
                }
                return false;

            case GameAction.Rotate:
                if (!this.dropInfo) return false;
                return this.handleRotate();

            case GameAction.Drop:
                if (!this.dropInfo) return false;
                this.handleDrop();
                return true;

            case GameAction.AutoDrop:
                if (!this.dropInfo) return false;
                this.doDrop();
                return true;

            case GameAction.RemoveDropShape:
                if (!this.dropInfo) return false;
                this.handleRemoveDropShape();
                return true;

            case GameAction.CreateNewShape:
                if (this.dropInfo) return false;
                this.createNewShape();
                return true;

            case GameAction.SwitchShape:
                ruleMgr.switchNextShapeInfo();
                return true;

            case GameAction.ApplyBuff:
                this.handleApplyBuff(actionData);
                return true;

            default:
                return false;
        }
    }

    handleApplyBuff(actionData) {
        const { buffType } = actionData;
        if (!buffType) return;

        const buff = Object.values(BuffType).find(b => b.name === buffType);
        if (!buff) return;

        if (buffType === 'Clear1Lines') {
            this.handleClearLines(BuffType.Clear1Lines.lineCount);
        } else if (buffType === 'Clear2Lines') {
            this.handleClearLines(BuffType.Clear2Lines.lineCount);
        } else if (buffType === 'Clear3Lines') {
            this.handleClearLines(BuffType.Clear3Lines.lineCount);
        } else if (buffType === 'Add1Lines') {
            this.handleAddLines(BuffType.Add1Lines.lineCount);
        } else if (buffType === 'Add2Lines') {
            this.handleAddLines(BuffType.Add2Lines.lineCount);
        } else if (buffType === 'Add3Lines') {
            this.handleAddLines(BuffType.Add3Lines.lineCount);
        } else if (buffType === 'SpeedUp') {
            this.handleSpeedChange(BuffType.SpeedUp.targetDiff, BuffType.SpeedUp.timeDiff);
        } else if (buffType === 'SpeedDown') {
            this.handleSpeedChange(BuffType.SpeedDown.targetDiff, BuffType.SpeedDown.timeDiff);
        }
    }

    handleClearLines(count) {
        // 从 0 到 this.rowCount + this.extraTopRowCount，找到 count 行有格子的行
        const rowsToClear = [];
        for (let r = 0; r < this.rowCount + this.extraTopRowCount && rowsToClear.length < count; r++) {
            // 检查这一行是否有格子
            let hasBlock = false;
            for (let c = 0; c < this.colCount; c++) {
                if (this.tiles[r] && this.tiles[r][c]) {
                    hasBlock = true;
                    break;
                }
            }
            if (hasBlock) {
                rowsToClear.push(r);
            }
        }

        if (rowsToClear.length > 0) {
            this.doBreakLines(rowsToClear, false);
        }
    }

    handleAddLines(count) {
        for (let i = 0; i < count; i++) {
            // 检查 dropInfo 是否会被影响
            // 当 r-1 行的内容移动到 r 行时，如果 dropInfo 的某个格子也在 r 行，就会重叠
            let needMoveDropInfo = false;
            if (this.dropInfo) {
                // 检查 dropInfo 的格子是否在目标行（r 行，即移动后的位置）
                for (let r = this.rowCount + this.extraTopRowCount - 1; r > 0; r--) {
                    for (let j = 0; j < this.dropInfo.rcs.length; j++) {
                        const dropRC = this.dropInfo.rcs[j];
                        // 如果 dropInfo 的格子在 r 行，而 r-1 行的内容要移动到 r 行，就会重叠
                        if (dropRC.r === r) {
                            needMoveDropInfo = true;
                            break;
                        }
                    }
                    if (needMoveDropInfo) break;
                }
            }

            // 从下往上移动所有行（把上面的行顶上去）
            // 从最大行开始，每个行向下移动1行
            for (let r = this.rowCount + this.extraTopRowCount - 1; r > 0; r--) {
                for (let c = 0; c < this.colCount; c++) {
                    this.tiles[r][c] = this.tiles[r - 1][c];
                    if (this.tiles[r][c]) {
                        const pos = this.getPosByRC(r, c);
                        this.tiles[r][c].animateToPosition(pos, this.moveAnimationDuration);
                    }
                }
            }

            // 如果 dropInfo 被挡住了，把它也往上移动1行
            if (needMoveDropInfo && this.dropInfo) {
                // 检查移动后是否越界
                let canMove = true;
                for (let j = 0; j < this.dropInfo.rcs.length; j++) {
                    const newR = this.dropInfo.rcs[j].r + 1;
                    if (newR >= this.rowCount + this.extraTopRowCount) {
                        canMove = false;
                        break;
                    }
                }

                if (canMove) {
                    this.moveDropingInfo({ r: 1, c: 0 });
                }
                // 如果移动后越界，不移动 dropInfo，让它保持原位置
                // 后续可能会触发碰撞检测或死亡逻辑
            }

            // 在第0行创建新行，9个格子（随机挖空一个）
            const randomCol = Math.floor(Math.random() * this.colCount);
            for (let c = 0; c < this.colCount; c++) {
                if (c !== randomCol) {
                    const tile = new TetrisTile(this.app);
                    tile.init(this, 1);
                    this.addChild(tile);
                    const pos = this.getPosByRC(0, c);
                    tile.position.set(pos.x, pos.y);
                    this.tiles[0][c] = tile;
                } else {
                    this.tiles[0][c] = null;
                }
            }
        }
    }

    handleSpeedChange(targetDiff, timeDiff) {
        const ruleMgr = this.dialog.ruleMgr;
        ruleMgr.addTempDropDiff(targetDiff);
        setTimeout(() => {
            ruleMgr.addTempDropDiff(-targetDiff);
        }, timeDiff);
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
                    fromPositions.push({ r, c });
                }
            }
        }

        const toPositions = [];
        for (let r = 0; r < toTiles.length; r++) {
            for (let c = 0; c < toTiles[r].length; c++) {
                if (toTiles[r][c] > 0) {
                    toPositions.push({ r, c });
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
        return { r: minR, c: minC };
    }

    isValidPosition(rcs) {
        for (let i = 0; i < rcs.length; i++) {
            const rc = rcs[i];
            if (rc.r < 0 || rc.r >= this.rowCount + this.extraTopRowCount || rc.c < 0 || rc.c >= this.colCount) {
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

        const ruleMgr = this.dialog.ruleMgr;
        const landingRCs = this.getDropLandingRCs();
        if (landingRCs.length === 0) return;

        let minDistance = Infinity;
        for (let i = 0; i < this.dropInfo.rcs.length; i++) {
            const currentR = this.dropInfo.rcs[i].r;
            const landingR = landingRCs[i].r;
            const distance = currentR - landingR;
            minDistance = Math.min(minDistance, distance);
        }

        const dropDistance = Math.max(0, minDistance);

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
        } else if (minDistance > 0) {
            for (let i = 0; i < this.dropInfo.rcs.length; i++) {
                const newRC = landingRCs[i];
                const tile = this.dropInfo.tiles[i];

                this.dropInfo.rcs[i] = newRC;

                const targetPos = this.getPosByRC(newRC.r, newRC.c);
                tile.animateToPosition(targetPos, this.moveAnimationDuration);
            }

            this.updateDropIndicator();
        }

        if (minDistance > 1) {
            ruleMgr.dropSpeedTimer = 100;
            const hardDropScore = dropDistance * 2 * ruleMgr.getLevel();
            ruleMgr.score += hardDropScore;
            this.dialog.hudView?.updateInfoDisplay();
        }
    }

    handleMoveLeft() {
        if (this.canMoveLeft()) {
            this.moveDropingInfo({ r: 0, c: -1 });
        }
    }

    handleMoveRight() {
        if (this.canMoveRight()) {
            this.moveDropingInfo({ r: 0, c: 1 });
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

    handleRemoveDropShape() {
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

        this.checkBreakFullLines(affectedRows);

        const ruleMgr = this.dialog.ruleMgr;
        if (!ruleMgr.isDead && this.checkDead(affectedRows)) {
            this.onDead();
        }
    }

    checkDead(affectedRows) {
        const topRows = [20, 21, 22, 23];
        const intersection = affectedRows.filter(row => topRows.includes(row));

        const rowsToCheck = intersection.length > 0 ? intersection : topRows;

        for (let i = 0; i < rowsToCheck.length; i++) {
            const row = rowsToCheck[i];
            for (let c = 0; c < this.colCount; c++) {
                if (this.tiles[row] && this.tiles[row][c]) {
                    return true;
                }
            }
        }

        return false;
    }

    onDead() {
        this.endGame('游戏结束', '方块触顶');
    }

    endGame(title, reason) {
        if (this.hasEnded) return;
        this.hasEnded = true;
        this.finishReason = reason || '';

        const ruleMgr = this.dialog.ruleMgr;
        ruleMgr.isDead = true;
        ruleMgr.setDropPaused(true);

        const rawElapsed = Date.now() - ruleMgr.startTime;

        const result = {
            title,
            reason: this.finishReason,
            score: ruleMgr.score,
            lines: ruleMgr.linesCleared,
            level: ruleMgr.getLevel(),
            elapsed: rawElapsed
        };

        this.dialog.finish(result);
    }

    checkBreakFullLines(affectedRows) {
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

        if (fullRows.length > 0) {
            this.doBreakLines(fullRows, true);
        } else {
            this.dialog.ruleMgr.comboCount = -1;
            this.dialog.hudView?.updateInfoDisplay();
        }
    }

    doBreakLines(fullRows, countScore = true) {
        if (fullRows.length === 0) return;

        const ruleMgr = this.dialog.ruleMgr;
        ruleMgr.setDropPaused(true);

        fullRows.sort();
        const delayPerCol = 30;

        // 从右往左遍历每一列
        for (let colIndex = 0; colIndex < this.colCount; colIndex++) {
            const col = this.colCount - 1 - colIndex;
            const delay = colIndex * delayPerCol;

            // 对于同一列，从最大行遍历到第0行（从下往上，避免覆盖问题）
            setTimeout(() => {
                for (let r = 0; r < this.rowCount + this.extraTopRowCount; ++r) {
                    if (r < fullRows[0]) {
                        // 下面的肯定不会掉落
                        continue;
                    }
                    else if (r >= fullRows[0] && r <= fullRows[fullRows.length - 1]) {
                        // 如果是 fullRows 中的行
                        const tile = this.tiles[r] && this.tiles[r][col];
                        if (tile) {
                            this.tiles[r][col] = null; // 置空标记
                            if (countScore) {
                                // 如果 countScore=true，执行飞行动画
                                this.createFlyingTileToProgress(tile, r, col, countScore);
                            } else {
                                // 如果 countScore=false，执行 break 动画
                                tile.playBreakAnim();
                                // 动画完成后移除 tile
                                setTimeout(() => {
                                    if (tile.parent) {
                                        tile.parent.removeChild(tile);
                                    }
                                }, 600); // playBreakAnim 的动画时长
                            }
                        }
                    } else {
                        // 否则执行下落逻辑
                        const tile = this.tiles[r] && this.tiles[r][col];
                        if (!tile) continue;

                        let dropCount = fullRows.length;

                        const finalRow = r - dropCount;
                        this.tiles[finalRow][col] = tile;
                        this.tiles[r][col] = null;
                        const pos = this.getPosByRC(finalRow, col);
                        tile.animateToPosition(pos, this.moveAnimationDuration);
                    }
                }
            }, delay);
        }

        // 等待所有动画完成后更新分数和行数
        const flyDuration = 800;
        const totalDelay = (this.colCount - 1) * delayPerCol + flyDuration;

        setTimeout(() => {
            if (countScore) {
                const lineCount = fullRows.length;
                ruleMgr.linesCleared += lineCount;
                ruleMgr.comboCount += 1;

                const level = ruleMgr.getLevel();
                const lineScoreMap = { 1: 100, 2: 300, 3: 500, 4: 800 };
                const baseScore = (lineScoreMap[lineCount] || 0) * level;

                const isTetris = lineCount === 4;
                let b2bBonus = 0;
                if (isTetris) {
                    if (ruleMgr.backToBackCount > 0) {
                        b2bBonus = Math.floor(baseScore * 0.5);
                    }
                    ruleMgr.backToBackCount += 1;
                } else {
                    ruleMgr.backToBackCount = 0;
                }

                let comboBonus = 0;
                if (ruleMgr.comboCount > 0) {
                    comboBonus = ruleMgr.comboCount * 50 * level;
                }

                ruleMgr.score += baseScore + b2bBonus + comboBonus;
                this.dialog.hudView?.updateInfoDisplay();
            }

            ruleMgr.setDropPaused(false);
        }, totalDelay);
    }

    createFlyingTileToProgress(sourceTile, row, col, countScore = true) {
        const targetPos = this.dialog.hudView?.getBuffFlyTarget();
        if (!targetPos || !sourceTile) return;

        // 使用 animateToTarget 处理位置和缩放动画
        const flyDuration = 800; // 飞行时长，放慢一点
        sourceTile.animateToTarget(
            { pos: targetPos, scale: 0.2 },
            flyDuration,
            () => {
                // 移除 tile 显示
                if (sourceTile.parent) {
                    sourceTile.parent.removeChild(sourceTile);
                }

                // 确保 tiles 数组中该位置已置空（防止重复处理）
                if (this.tiles[row] && this.tiles[row][col] === sourceTile) {
                    this.tiles[row][col] = null;
                }

                // 增加 buff 进度
                if (countScore) {
                    this.dialog.ruleMgr.addBuffProgress(1);
                }
            }
        );
    }

    doDrop() {
        this.moveDropingInfo({ r: -1, c: 0 });
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
        const ruleMgr = this.dialog.ruleMgr;

        this.dropInfo = {};
        const shapeInfo = ruleMgr.getNextShapeInfo();
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

        let col = Math.floor((this.colCount - shapeTiles[0].length) / 2);

        let tempRcs = [];
        for (let r = 0; r < shapeTiles.length; r++) {
            for (let c = 0; c < shapeTiles[r].length; c++) {
                if (shapeTiles[r][c] > 0) {
                    tempRcs.push({ r: r, c: c });
                }
            }
        }

        let row = this.rowCount - 1 - minRow;
        let testRcs = tempRcs.map(rc => ({ r: row + rc.r, c: col + rc.c }));

        while (!this.isValidPosition(testRcs) && row < this.rowCount + this.extraTopRowCount - 1) {
            row++;
            testRcs = tempRcs.map(rc => ({ r: row + rc.r, c: col + rc.c }));
        }

        if (!this.isValidPosition(testRcs)) {
            if (!ruleMgr.isDead) {
                this.onDead();
            }
            return;
        }

        let colorIndex = shapeInfo.colorIndex;
        this.dropInfo.previewSprites = [];
        const texture = this.app.textures['tile' + (colorIndex + 1)];

        for (let r = 0; r < shapeTiles.length; r++) {
            for (let c = 0; c < shapeTiles[r].length; c++) {
                let tileType = shapeTiles[r][c];
                if (tileType > 0) {
                    let tile = new TetrisTile(this.app);
                    tile.init(this, colorIndex);
                    this.addChild(tile);
                    let pos = this.getPosByRC(row + r, col + c);
                    tile.position.set(pos.x, pos.y);

                    this.dropInfo.rcs.push({ r: row + r, c: col + c });
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
        let pos = { x: col * this.tileSize, y: - row * this.tileSize };
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

        const currentRCs = this.dropInfo.rcs.map(rc => ({ r: rc.r, c: rc.c }));
        let dropOffset = 0;

        while (true) {
            const testRCs = currentRCs.map(rc => ({ r: rc.r - dropOffset - 1, c: rc.c }));

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

        const landingRCs = currentRCs.map(rc => ({ r: rc.r - dropOffset, c: rc.c }));
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
                return { r, c: fromRC.c };
            }
        }
        return null;
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
}
