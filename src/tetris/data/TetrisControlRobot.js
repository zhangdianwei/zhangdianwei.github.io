import { NetEventId, GameAction, GameStartMode } from './TetrisEvents.js';
import Tetris7BagGenerator from './Tetris7BagGenerator.js';
import * as TetrisShape from '../TetrisShape.js';

export default class TetrisControlRobot {
    constructor(game) {
        this.game = game;
        this.thinkTimer = 0;
        this.thinkInterval = 100;
        this.speedLevel = 1;
        this.isDead = false;
        this.score = 0;
        this.linesCleared = 0;
        this.shapeGenerator = null;
        this.nextShapInfos = [];
        this.isExecutingMove = false;
        this.moveQueue = [];
    }

    init(userView, player) {
        this.userView = userView;
        this.player = player;
        this.dropSpeedTimer = 0;
        this.dropPaused = false;
        
        this.shapeGenerator = new Tetris7BagGenerator(this.game.GameStartOption.ShapeGeneratorSeed);
        this.nextShapInfos = [];
        this.initShapeQueue();
    }

    initShapeQueue() {
        this.nextShapInfos = [];
        this.getNextShapeInfo();
    }

    getNextShapeInfo() {
        const shapeInfo = this.nextShapInfos.shift();
        
        while (this.nextShapInfos.length < 2) {
            const nextShape = this.shapeGenerator.next();
            this.nextShapInfos.push(nextShape);
        }
        
        if (this.userView && this.userView.updateNextShapePreview) {
            this.userView.updateNextShapePreview();
        }
        
        return shapeInfo;
    }

    switchNextShapeInfo() {
        if (this.nextShapInfos.length >= 2) {
            const temp = this.nextShapInfos[0];
            this.nextShapInfos[0] = this.nextShapInfos[1];
            this.nextShapInfos[1] = temp;
            
            if (this.userView && this.userView.updateNextShapePreview) {
                this.userView.updateNextShapePreview();
            }
        }
    }

    update(deltaMS) {
        if (this.isDead || this.dropPaused) {
            return;
        }

        this.dropSpeedTimer += deltaMS;
        if (this.dropSpeedTimer >= this.dropSpeed()) {
            this.dropSpeedTimer = 0;
            this.doAction(GameAction.AutoDrop);
        }

        if (!this.isExecutingMove) {
            this.thinkTimer += deltaMS;
            if (this.thinkTimer >= this.thinkInterval) {
                this.thinkTimer = 0;
                this.thinkAndAct();
            }
        }
    }

    dropSpeed() {
        return 500 - (this.speedLevel - 1) * (500 - 100) / (10 - 1);
    }

    get moveAnimationDuration() {
        return this.dropSpeed() / 3;
    }

    thinkAndAct() {
        if (!this.userView.dropInfo) {
            return;
        }

        try {
            const bestMove = this.findBestMove();
            if (bestMove) {
                this.executeMove(bestMove);
            } else {
                console.warn('Robot: No valid move found, using fallback. Shape:', this.userView.dropInfo.shapeType);
            }
        } catch (error) {
            console.error('Robot thinkAndAct error:', error, error.stack);
        }
    }

    findBestMove() {
        const currentShape = this.userView.dropInfo.shapeType;
        const currentRotation = this.userView.dropInfo.rotation;
        const nextShapeInfo = this.nextShapInfos[0];
        
        let bestScore = -Infinity;
        let bestMove = null;
        const currentMoves = this.getAllPossibleMoves(currentShape, currentRotation);
        
        if (currentMoves.length === 0) {
            console.warn('Robot: No possible moves found for shape', currentShape, 'rotation', currentRotation);
            console.warn('Current grid state:', this.getCurrentGrid().map((row, i) => `${i}: ${row.join('')}`).join('\n'));
            return null;
        }
        
        console.log(`Robot: Found ${currentMoves.length} possible moves for shape ${currentShape}`);
        
        for (const move of currentMoves) {
            try {
                const gridAfterCurrent = this.simulatePlacePiece(
                    this.getCurrentGrid(),
                    currentShape,
                    move.rotation,
                    move.col,
                    move.row
                );

                if (this.isGameOver(gridAfterCurrent)) {
                    if (currentMoves.length <= 5) {
                        console.log(`Robot: Move rejected (game over) - rotation: ${move.rotation}, col: ${move.col}, row: ${move.row}`);
                    }
                    continue;
                }

                let score = this.evaluateGrid(gridAfterCurrent);
                
                if (nextShapeInfo) {
                    const nextMoves = this.getAllPossibleMoves(nextShapeInfo.shapeType, 0);
                    let bestNextScore = -Infinity;
                    
                    for (const nextMove of nextMoves) {
                        const gridAfterNext = this.simulatePlacePiece(
                            gridAfterCurrent,
                            nextShapeInfo.shapeType,
                            nextMove.rotation,
                            nextMove.col,
                            nextMove.row
                        );
                        
                        if (!this.isGameOver(gridAfterNext)) {
                            const nextScore = this.evaluateGrid(gridAfterNext);
                            bestNextScore = Math.max(bestNextScore, nextScore);
                        }
                    }
                    
                    if (bestNextScore > -Infinity) {
                        score = (score + bestNextScore) / 2;
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            } catch (error) {
                console.error('Error evaluating move:', error, move);
                continue;
            }
        }

        if (bestMove) {
            console.log(`Robot: Best move selected - rotation: ${bestMove.rotation}, col: ${bestMove.col}, row: ${bestMove.row}, score: ${bestScore.toFixed(2)}`);
        } else {
            console.warn('Robot: No valid move found after evaluating all moves');
            if (currentMoves.length > 0) {
                const sampleMove = currentMoves[0];
                const testGrid = this.simulatePlacePiece(
                    this.getCurrentGrid(),
                    currentShape,
                    sampleMove.rotation,
                    sampleMove.col,
                    sampleMove.row
                );
                const isOver = this.isGameOver(testGrid);
                console.warn(`Robot: Sample move - rotation: ${sampleMove.rotation}, col: ${sampleMove.col}, row: ${sampleMove.row}, isGameOver: ${isOver}`);
                if (isOver) {
                    const shapeDef = TetrisShape.TetrisShapeDef[currentShape];
                    const shapeTiles = shapeDef.rotations[sampleMove.rotation];
                    const relativePositions = [];
                    for (let r = 0; r < shapeTiles.length; r++) {
                        for (let c = 0; c < shapeTiles[r].length; c++) {
                            if (shapeTiles[r][c] > 0) {
                                relativePositions.push({r, c});
                            }
                        }
                    }
                    const minRowInShape = Math.min(...relativePositions.map(p => p.r));
                    const placedRows = relativePositions.map(pos => sampleMove.row + (pos.r - minRowInShape));
                    const minPlacedRow = Math.min(...placedRows);
                    const maxPlacedRow = Math.max(...placedRows);
                    console.warn(`Robot: Shape placed at rows ${minPlacedRow}-${maxPlacedRow}, extraTopRowCount=${this.userView.extraTopRowCount}`);
                    
                    const topRows = [];
                    for (let r = 0; r < this.userView.extraTopRowCount; r++) {
                        const row = testGrid[r] || [];
                        const hasBlock = row.some(cell => cell > 0);
                        if (hasBlock) {
                            topRows.push(`Row ${r}: ${row.join('')}`);
                        }
                    }
                    if (topRows.length > 0) {
                        console.warn('Robot: Blocks in extraTopRowCount:', topRows.join(', '));
                    }
                }
                const currentGrid = this.getCurrentGrid();
                const currentIsOver = this.isGameOver(currentGrid);
                console.warn(`Robot: Current grid isGameOver: ${currentIsOver}`);
                console.warn(`Robot: Current grid top rows:`, 
                    Array.from({length: this.userView.extraTopRowCount}, (_, r) => {
                        const row = currentGrid[r] || [];
                        return `Row ${r}: ${row.join('')}`;
                    }).join(', '));
                if (this.userView.dropInfo && this.userView.dropInfo.rcs) {
                    const dropRcs = this.userView.dropInfo.rcs.map(rc => `(${rc.r},${rc.c})`).join(', ');
                    console.warn(`Robot: Current dropInfo.rcs: ${dropRcs}`);
                }
            }
        }

        return bestMove;
    }

    getAllPossibleMoves(shapeType, startRotation) {
        const moves = [];
        const shapeDef = TetrisShape.TetrisShapeDef[shapeType];
        const rotations = [0, 'R', 2, 'L'];
        
        for (const rotation of rotations) {
            if (!shapeDef.rotations[rotation]) continue;
            
            const shapeTiles = shapeDef.rotations[rotation];
            const shapeWidth = shapeTiles[0].length;
            
            for (let col = 0; col <= this.userView.colCount - shapeWidth; col++) {
                const row = this.findLowestValidRow(shapeType, rotation, col);
                
                if (row !== null) {
                    moves.push({
                        rotation,
                        col,
                        row,
                        startRotation
                    });
                }
            }
        }
        
        return moves;
    }

    findLowestValidRow(shapeType, rotation, col) {
        const shapeDef = TetrisShape.TetrisShapeDef[shapeType];
        const shapeTiles = shapeDef.rotations[rotation];
        const grid = this.getCurrentGrid();
        const relativePositions = [];
        for (let r = 0; r < shapeTiles.length; r++) {
            for (let c = 0; c < shapeTiles[r].length; c++) {
                if (shapeTiles[r][c] > 0) {
                    relativePositions.push({r, c});
                }
            }
        }
        
        if (relativePositions.length === 0) {
            return null;
        }
        
        const minRowInShape = Math.min(...relativePositions.map(p => p.r));
        const maxRowInShape = Math.max(...relativePositions.map(p => p.r));
        
        for (let topRow = this.userView.rowCount + this.userView.extraTopRowCount - 1; topRow >= this.userView.extraTopRowCount; topRow--) {
            const bottomRow = topRow + (maxRowInShape - minRowInShape);
            
            if (bottomRow >= this.userView.rowCount + this.userView.extraTopRowCount) {
                continue;
            }
            
            const testRcs = relativePositions.map(pos => ({
                r: topRow + (pos.r - minRowInShape),
                c: col + pos.c
            }));
            
            if (this.isValidPositionForGrid(grid, testRcs)) {
                if (topRow > this.userView.extraTopRowCount) {
                    const testRcsBelow = relativePositions.map(pos => ({
                        r: topRow - 1 + (pos.r - minRowInShape),
                        c: col + pos.c
                    }));
                    
                    if (this.isValidPositionForGrid(grid, testRcsBelow)) {
                        continue;
                    }
                }
                
                return topRow;
            }
        }
        
        return null;
    }

    isValidPositionForGrid(grid, rcs) {
        for (const rc of rcs) {
            if (rc.r < 0 || rc.r >= this.userView.rowCount + this.userView.extraTopRowCount || 
                rc.c < 0 || rc.c >= this.userView.colCount) {
                return false;
            }
            if (grid[rc.r] && grid[rc.r][rc.c]) {
                return false;
            }
        }
        return true;
    }

    getCurrentGrid() {
        const grid = [];
        const currentDropRcs = this.userView.dropInfo ? 
            new Set(this.userView.dropInfo.rcs.map(rc => `${rc.r},${rc.c}`)) : 
            new Set();
        
        for (let r = 0; r < this.userView.rowCount + this.userView.extraTopRowCount; r++) {
            grid[r] = [];
            for (let c = 0; c < this.userView.colCount; c++) {
                const isCurrentDrop = currentDropRcs.has(`${r},${c}`);
                grid[r][c] = !isCurrentDrop && this.userView.tiles[r] && this.userView.tiles[r][c] ? 1 : 0;
            }
        }
        return grid;
    }

    simulatePlacePiece(grid, shapeType, rotation, col, topRow) {
        const newGrid = grid.map(r => [...r]);
        const shapeDef = TetrisShape.TetrisShapeDef[shapeType];
        const shapeTiles = shapeDef.rotations[rotation];
        const relativePositions = [];
        for (let r = 0; r < shapeTiles.length; r++) {
            for (let c = 0; c < shapeTiles[r].length; c++) {
                if (shapeTiles[r][c] > 0) {
                    relativePositions.push({r, c});
                }
            }
        }
        
        const minRowInShape = Math.min(...relativePositions.map(p => p.r));
        
        for (const pos of relativePositions) {
            const gridRow = topRow + (pos.r - minRowInShape);
            const gridCol = col + pos.c;
            if (gridRow >= 0 && gridRow < newGrid.length && 
                gridCol >= 0 && gridCol < newGrid[0].length) {
                newGrid[gridRow][gridCol] = 1;
            }
        }
        
        return this.clearFullLines(newGrid);
    }

    clearFullLines(grid) {
        const newGrid = [];
        const rowCount = grid.length;
        const colCount = grid[0].length;
        
        for (let r = 0; r < rowCount; r++) {
            let isFull = true;
            for (let c = 0; c < colCount; c++) {
                if (!grid[r][c]) {
                    isFull = false;
                    break;
                }
            }
            
            if (!isFull) {
                newGrid.push([...grid[r]]);
            }
        }
        
        while (newGrid.length < rowCount) {
            newGrid.unshift(new Array(colCount).fill(0));
        }
        
        return newGrid;
    }

    isGameOver(grid) {
        for (let r = 0; r < this.userView.extraTopRowCount; r++) {
            for (let c = 0; c < this.userView.colCount; c++) {
                if (grid[r] && grid[r][c]) {
                    return true;
                }
            }
        }
        return false;
    }

    evaluateGrid(grid) {
        const aggregateHeight = this.getAggregateHeight(grid);
        const completeLines = this.getCompleteLines(grid);
        const holes = this.getHoles(grid);
        const bumpiness = this.getBumpiness(grid);
        
        const a = -0.510066;
        const b = 0.760666;
        const c = -0.35663;
        const d = -0.184483;
        
        return a * aggregateHeight + b * completeLines + c * holes + d * bumpiness;
    }

    getAggregateHeight(grid) {
        const colCount = grid[0].length;
        let totalHeight = 0;
        
        for (let c = 0; c < colCount; c++) {
            let height = 0;
            for (let r = 0; r < grid.length; r++) {
                if (grid[r][c]) {
                    height = grid.length - r;
                    break;
                }
            }
            totalHeight += height;
        }
        
        return totalHeight;
    }

    getCompleteLines(grid) {
        let completeLines = 0;
        
        for (let r = 0; r < grid.length; r++) {
            let isComplete = true;
            for (let c = 0; c < grid[r].length; c++) {
                if (!grid[r][c]) {
                    isComplete = false;
                    break;
                }
            }
            if (isComplete) {
                completeLines++;
            }
        }
        
        return completeLines;
    }

    getHoles(grid) {
        const colCount = grid[0].length;
        let holes = 0;
        
        for (let c = 0; c < colCount; c++) {
            let hasBlock = false;
            for (let r = 0; r < grid.length; r++) {
                if (grid[r][c]) {
                    hasBlock = true;
                } else if (hasBlock) {
                    holes++;
                }
            }
        }
        
        return holes;
    }

    getBumpiness(grid) {
        const colCount = grid[0].length;
        const heights = [];
        
        for (let c = 0; c < colCount; c++) {
            let height = 0;
            for (let r = 0; r < grid.length; r++) {
                if (grid[r][c]) {
                    height = grid.length - r;
                    break;
                }
            }
            heights.push(height);
        }
        
        let bumpiness = 0;
        for (let i = 0; i < heights.length - 1; i++) {
            bumpiness += Math.abs(heights[i] - heights[i + 1]);
        }
        
        return bumpiness;
    }

    executeMove(move) {
        if (!this.userView.dropInfo) {
            return;
        }
        
        this.isExecutingMove = true;
        const currentRotation = this.userView.dropInfo.rotation;
        const targetRotation = move.rotation;
        const targetCol = move.col;
        const currentCol = this.userView.dropInfo.rcs[0]?.c || 0;
        
        this.moveQueue = [];
        
        if (currentRotation !== targetRotation) {
            const rotationOrder = [0, 'R', 2, 'L'];
            const currentIndex = rotationOrder.indexOf(currentRotation);
            const targetIndex = rotationOrder.indexOf(targetRotation);
            
            let rotations = targetIndex - currentIndex;
            if (rotations < 0) rotations += 4;
            if (rotations > 2) rotations = rotations - 4;
            
            for (let i = 0; i < Math.abs(rotations); i++) {
                this.moveQueue.push(GameAction.Rotate);
            }
        }
        
        const colDiff = targetCol - currentCol;
        if (colDiff > 0) {
            for (let i = 0; i < colDiff; i++) {
                this.moveQueue.push(GameAction.MoveRight);
            }
        } else if (colDiff < 0) {
            for (let i = 0; i < Math.abs(colDiff); i++) {
                this.moveQueue.push(GameAction.MoveLeft);
            }
        }
        
        this.moveQueue.push(GameAction.Drop);
        this.executeNextAction();
    }

    executeNextAction() {
        if (!this.userView.dropInfo) {
            this.isExecutingMove = false;
            this.moveQueue = [];
            return;
        }
        
        if (this.moveQueue.length === 0) {
            this.isExecutingMove = false;
            return;
        }
        
        const action = this.moveQueue.shift();
        this.doAction(action);
        
        if (action === GameAction.Drop) {
            this.isExecutingMove = false;
        } else {
            setTimeout(() => {
                this.executeNextAction();
            }, 50);
        }
    }

    doAction(action) {
        const elapsed = Date.now() - this.game.GameStartOption.StartTime;
        const actionData = {
            GameAction: action,
            elapsed
        };
        
        this.userView.doGameAction(actionData);
        
        const frame = {
            type: actionData.GameAction,
            ...actionData
        };
        this.player.frames.push(frame);
        
        if (this.game.GameStartOption.StartMode !== GameStartMode.Single) {
            const eventData = {
                userId: this.player.userId,
                type: actionData.GameAction,
                ...actionData
            };
            this.game.net.sendEvent(NetEventId.PlayerAction, eventData);
        }
    }

    safeRemoveSelf() {
    }
}

