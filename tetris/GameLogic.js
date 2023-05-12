
import { Helper } from "./Helper.js"

class GameLogic {
    constructor() {
        this.dropType = null;
        this.dropRCDs = null;
        this.dropCubes = null; //正在下落的cube

        this.bottoms = []; //整个10x10x10的网格
        this.bound = { rows: 10, cols: 10 };

        this.state1 = "prepare" // "prepare" "game" "over"
        this.state2 = null // "erase"

        this.updateSecond(0);
        setInterval(this.updateSecond.bind(this), 1000);

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        // document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    startGame() {
        this.dropType = null;
        this.dropRCDs = null;
        this.dropCubes = null; //正在下落的cube

        this.bottoms.forEach((cube) => {
            window.game.scene.remove(cube);
        })
        this.bottoms.length = 0;

        this.state1 = "game";
        this.state2 = null;

        this.updateSecond(0);
    }

    onKeyDown(event) {
        // console.log(event.code);
        if (this.dropRCDs) {
            if (event.code == "KeyW" || event.code == "ArrowUp") {
                // if (this.canMove(this.dropRCDs, { row: 1 })) {
                //     this.moveRCDs(this.dropRCDs, { row: 1 });
                //     Helper.reshapeCubes2(this.dropCubes, this.dropRCDs, true);
                // }

                let moveToRCDs = Helper.copy(this.dropRCDs);
                Helper.rotateRCDsHClockwise(this.dropType, moveToRCDs, true);

                // 智能偏移
                while (moveToRCDs.some((rcd) => rcd.col < 0)) {
                    this.moveRCDs(moveToRCDs, { col: 1 });
                }
                while (moveToRCDs.some((rcd) => rcd.col > this.bound.cols - 1)) {
                    this.moveRCDs(moveToRCDs, { col: -1 });
                }

                if (this.canMove2(moveToRCDs)) {
                    this.dropRCDs = moveToRCDs;
                    Helper.reshapeCubes(this.dropCubes, moveToRCDs, true);
                }
            }
            else if (event.code == "KeyS") {
                this.updateSecond();
            }
            else if (event.code == "KeyA") {
                if (this.canMove2(this.dropRCDs, { col: -1 })) {
                    this.moveRCDs(this.dropRCDs, { col: -1 });
                    Helper.reshapeCubes(this.dropCubes, this.dropRCDs, true);
                }
            }
            else if (event.code == "KeyD") {
                if (this.canMove2(this.dropRCDs, { col: 1 })) {
                    this.moveRCDs(this.dropRCDs, { col: 1 });
                    Helper.reshapeCubes(this.dropCubes, this.dropRCDs, true);
                }
            }
            else if (event.code == "ArrowLeft") {
                let srcBound = Helper.getBound_RCD(this.dropRCDs);

                let moveToRCDs = Helper.copy(this.dropRCDs);
                Helper.rotateRCDsHClockwise(this.dropType, moveToRCDs, true);

                // 智能偏移
                while (moveToRCDs.some((rcd) => rcd.col < 0)) {
                    this.moveRCDs(moveToRCDs, { col: 1 });
                }
                while (moveToRCDs.some((rcd) => rcd.col > this.bound.cols - 1)) {
                    this.moveRCDs(moveToRCDs, { col: -1 });
                }

                if (this.canMove2(moveToRCDs)) {
                    this.dropRCDs = moveToRCDs;
                    Helper.reshapeCubes(this.dropCubes, moveToRCDs, true);
                }
            }
            else if (event.code == "ArrowRight") {
                let srcBound = Helper.getBound_RCD(this.dropRCDs);

                let moveToRCDs = Helper.copy(this.dropRCDs);
                Helper.rotateRCDsHClockwise(this.dropType, moveToRCDs, false);

                // 智能偏移
                while (moveToRCDs.some((rcd) => rcd.col < 0)) {
                    this.moveRCDs(moveToRCDs, { col: 1 });
                }
                while (moveToRCDs.some((rcd) => rcd.col > this.bound.cols - 1)) {
                    this.moveRCDs(moveToRCDs, { col: -1 });
                }

                if (this.canMove2(moveToRCDs)) {
                    this.dropRCDs = moveToRCDs;
                    Helper.reshapeCubes(this.dropCubes, moveToRCDs, true);
                }
            }
            else if (event.code == "Enter" || event.code == "NumpadEnter") {
                Helper.blinkCubes(this.dropCubes, null);
            }
        }
    }

    canMove(rcds, offset_rcd) {
        offset_rcd = offset_rcd || {};
        offset_rcd.row = offset_rcd.row || 0;
        offset_rcd.col = offset_rcd.col || 0;

        let ret = rcds.every((rcd) => {
            const [row, col] = [rcd.row + offset_rcd.row, rcd.col + offset_rcd.col];
            return this.isRCDInBound({ row, col }) && !this.getBottom(row, col);
        });
        return ret;
    }

    // 不考虑顶部超出去的情况
    canMove2(rcds, offset_rcd) {
        offset_rcd = offset_rcd || {};
        offset_rcd.row = offset_rcd.row || 0;
        offset_rcd.col = offset_rcd.col || 0;

        let ret = rcds.every((rcd) => {
            const [row, col] = [rcd.row + offset_rcd.row, rcd.col + offset_rcd.col];
            return this.isRCDInBound2({ row, col }) && !this.getBottom(row, col);
        });
        return ret;
    }

    moveRCDs(rcds, offset_rcd) {
        offset_rcd.row = offset_rcd.row || 0;
        offset_rcd.col = offset_rcd.col || 0;

        rcds.forEach((rcd) => {
            rcd.row += offset_rcd.row;
            rcd.col += offset_rcd.col;
        });
    }

    updateSecond(dt) {

        var dropResult = null;
        if (this.state1 == "game" && !this.state2) {
            dropResult = this.checkDrop();
        }

        if (dropResult && dropResult.needCheckErase) {
            const erases = this.getCanErases();
            if (erases.length > 0) {
                this.checkErase(erases);
            }
        }

        if (this.state1 == "game" && !this.state2) {
            this.checkOver();
        }

        if (this.state1 == "game" && !this.state2) {
            this.checkCreate();
        }

        if (this.state1 == "over") {
            openModal();
        }
    }

    getCanErases() {
        let ret = [];

        let cols = Helper.makeSequenceArray(this.bound.cols);

        for (let row = 0; row < this.bound.rows; ++row) {
            let can = cols.every((col) => this.getBottom(row, col, 0));
            if (can) {
                ret.push({ row });
            }
        }

        return ret;
    }

    checkErase(erases) {
        erases.forEach((e, i) => {
            e.row -= i;
        });

        erases.forEach((e) => {
            if (e.row >= 0) {
                for (let col = 0; col < this.bound.cols; ++col) {
                    const obj = this.getBottom(e.row, col);
                    this.setBottom(e.row, col, null);
                    Helper.blinkCubes([obj], () => { window.game.scene.remove(obj); });
                }

                const self = this;
                function func() {
                    for (let row = e.row; row < self.bound.rows; ++row) {
                        for (let col = 0; col < self.bound.cols; ++col) {
                            const obj = self.getBottom(row + 1, col);
                            self.setBottom(row, col, obj);
                            if (obj) {
                                Helper.reshapeCubes([obj], [{ row, col }], true);
                            }
                        }
                    }
                }
                // setTimeout(func, 100);
                func();
            }
        });
    }

    checkCreate() {
        if (!this.dropRCDs) {
            this.dropType = Helper.createRandomShapeType();
            this.dropType = "O"
            this.dropRCDs = Helper.createShape(this.dropType, { row: this.bound.rows, col: 0 });
            this.dropCubes = Helper.createObjects(this.dropRCDs);

            this.dropCubes.forEach((cube) => {
                window.game.scene.add(cube);
            });
            Helper.reshapeCubes(this.dropCubes, this.dropRCDs);
        }
    }

    checkDrop() {
        let ret = {
            needCheckErase: false
        };
        if (this.dropRCDs) {
            const bottomMaxRows = this.dropRCDs.map((rcd) => this.getBottomMaxRow(rcd));
            const diffRows = bottomMaxRows.map((maxRow, i) => this.dropRCDs[i].row - maxRow - 1);
            const reachBottom = diffRows.some((diffRow) => diffRow <= 0);

            if (reachBottom) { // 已经落到底了
                const minDiffRow = Math.min(...diffRows);

                this.moveRCDs(this.dropRCDs, { row: -minDiffRow });
                Helper.reshapeCubes(this.dropCubes, this.dropRCDs, true);

                this.dropRCDs.forEach((rcd, i) => {
                    this.setBottom(rcd.row, rcd.col, this.dropCubes[i]);
                });

                this.dropType = null;
                this.dropRCDs = null;
                this.dropCubes = null;

                ret.needCheckErase = true;
            }
            else { // 还没落到底
                this.moveRCDs(this.dropRCDs, { row: -1 });
                Helper.reshapeCubes(this.dropCubes, this.dropRCDs, true);
            }
        }
        return ret;
    }

    checkOver() {
        let failed = false;
        for (let col = 0; col < this.bound.cols; col++) {
            if (this.getBottom(this.bound.rows, col, 0)) {
                failed = true;
                break;
            }
        }

        if (failed) {
            this.state1 = "over";
        }
    }

    isRCDInBound(rcd) {
        if (rcd.row >= 0 && rcd.row < this.bound.rows) {
            if (rcd.col >= 0 && rcd.col < this.bound.cols) {
                return true;
            }
        }
        return false;
    }

    isRCDInBound2(rcd) {
        if (rcd.row >= 0) {
            if (rcd.col >= 0 && rcd.col < this.bound.cols) {
                return true;
            }
        }
        return false;
    }

    canPlace(rcds) {
        for (let i = 0; i < rcds.length; i++) {
            const rcd = rcds[i];
            if (!this.isRCDInBound(rcd)) {
                return false;
            }
            const index = Helper.getIndexByRCD(this.bound, rcd);
            if (this.bottoms[index]) {
                return false;
            }
        }

        return true;
    }

    get bottomCubeCount() {
        return this.bottoms.filter((cube) => cube).length;
    }

    getBottomMaxRow(rcd) {
        for (let row = rcd.row - 1; row >= 0; --row) {
            if (this.getBottom(row, rcd.col)) {
                return row;
            }
        }
        return -1;
    }

    getBottom(row, col) {
        return this.bottoms[Helper.getIndexByRCD(this.bound, { row, col })];
    }
    setBottom(row, col, val) {
        const index = Helper.getIndexByRCD(this.bound, { row, col });
        const origin = this.bottoms[index];
        this.bottoms[index] = val;
        return origin;
    }
}

export { GameLogic }