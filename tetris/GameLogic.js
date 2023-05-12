
import { Helper } from "./Helper.js"

class GameLogic {
    constructor() {
        this.dropType = null;
        this.dropCubes = null; //正在下落的cube

        this.bottoms = []; //整个10x10x10的网格
        this.bound = { rows: 10, cols: 10, deps: 5 };

        this.state1 = "game" // "prepare" "game" "over"
        this.state2 = null // "erase"

        this.scheduleObjs = [];

        this.updateSecond(0);
        // this.schedule(this.updateSecond.bind(this), 1000);
        setInterval(this.updateSecond.bind(this), 1000);

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        // document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
        // console.log(event.code);
        if (this.dropCubes) {
            if (event.code == "KeyW") {
                // let moveToRCDs = Helper.getCube_RCD(this.dropCubes);
                // moveToRCDs.forEach((rcd) => rcd.row += 1);
                // if (this.canPlace(moveToRCDs)) {
                //     Helper.reshapeCubes2(this.dropCubes, moveToRCDs);
                // }
            }
            else if (event.code == "KeyS") {
                this.updateSecond();
            }
            else if (event.code == "KeyA") {
                let moveToRCDs = Helper.getCube_RCD(this.dropCubes);
                moveToRCDs.forEach((rcd) => rcd.col -= 1);
                if (this.canPlace(moveToRCDs)) {
                    Helper.reshapeCubes2(this.dropCubes, moveToRCDs);
                }
            }
            else if (event.code == "KeyD") {
                let moveToRCDs = Helper.getCube_RCD(this.dropCubes);
                moveToRCDs.forEach((rcd) => rcd.col += 1);
                if (this.canPlace(moveToRCDs)) {
                    Helper.reshapeCubes2(this.dropCubes, moveToRCDs);
                }
            }
            else if (event.code == "ArrowLeft") {
                let srcRCDs = Helper.getCube_RCD(this.dropCubes);
                let srcBound = Helper.getBound_RCD(srcRCDs);

                let moveToRCDs = Helper.copy(srcRCDs);
                Helper.rotateRCDsHClockwise(this.dropType, moveToRCDs, true);

                // 智能偏移
                let bound = Helper.getBound_RCD(moveToRCDs);
                // for (let col = bound.minCol - 1; col >= srcBound.minCol; --col) {
                //     if (this.canMove(moveToRCDs, { col: -1 })) {
                //         moveToRCDs.forEach((rcd) => rcd.col -= 1);
                //     }
                //     else {
                //         break;
                //     }
                // }

                if (this.canPlace(moveToRCDs) || true) {
                    Helper.reshapeCubes2(this.dropCubes, moveToRCDs);
                }
            }
            else if (event.code == "ArrowRight") {
                let srcRCDs = Helper.getCube_RCD(this.dropCubes);
                let srcBound = Helper.getBound_RCD(srcRCDs);

                let moveToRCDs = Helper.copy(srcRCDs);
                Helper.rotateRCDsHClockwise(this.dropType, moveToRCDs, false);

                // 智能偏移
                let bound = Helper.getBound_RCD(moveToRCDs);
                // for (let col = bound.maxCol + 1; col <= srcBound.maxCol; ++col) {
                //     if (this.canMove(moveToRCDs, { col: 1 })) {
                //         moveToRCDs.forEach((rcd) => rcd.col += 1);
                //     }
                //     else {
                //         break;
                //     }
                // }

                if (this.canPlace(moveToRCDs) || true) {
                    Helper.reshapeCubes2(this.dropCubes, moveToRCDs);
                }
            }
        }
    }

    canMove(rcds, offset_rcd) {
        offset_rcd.row = offset_rcd.row || 0;
        offset_rcd.col = offset_rcd.col || 0;

        let ret = rcds.every((rcd) => {
            return !this.getBottom(rcd.row + offset_rcd.row, rcd.col + offset_rcd.col);
        });
        return ret;
    }

    schedule(func, interval) {
        this.scheduleObjs.push({
            elapsed: 0,
            interval,
            func,
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


        document.getElementById("debug_label").innerHTML = `
            position = ${window.game.camera.position.x.toFixed(0)}, ${window.game.camera.position.y.toFixed(0)}, ${window.game.camera.position.z.toFixed(0)}
            <br/>
            state1=${this.state1}
            <br/>
            state2=${this.state2}
        `;
    }

    update(dt) {
        this.scheduleObjs.forEach((x, i) => {
            x.elapsed += dt;
            if (x.elapsed >= x.interval) {
                x.func(x.elapsed);
                x.elapsed -= x.interval;
            }
        });
    }

    getCanErases() {
        let ret = [];

        let cols = Helper.makeSequenceArray(this.bound.cols);

        for (let row = 0; row < this.bound.rows; ++row) {
            let can = cols.every((col) => this.getBottom(row, col, 0));
            if (can) {
                ret.push({ row, dep: 0 });
            }
        }

        return ret;
    }

    checkErase(erases) {
        let objs = [];
        erases.forEach((e) => {
            if (e.row >= 0) {
                for (let col = 0; col < this.bound.cols; ++col) {
                    objs.push(this.getBottom(e.row, col, e.dep));
                }

                for (let dep = e.dep; dep < this.bound.deps; ++dep) {
                    for (let col = 0; col < this.bound.cols; ++col) {
                        const obj = this.getBottom(e.row, col, dep + 1);
                        this.setBottom(e.row, col, dep, obj);
                        if (obj) {
                            obj.position.y = dep;
                        }
                    }
                }
            }
            else if (e.col >= 0) {
                for (let row = 0; row < this.bound.rows; ++row) {
                    objs.push(this.getBottom(row, e.col, e.dep));
                }

                for (let dep = e.dep; dep < this.bound.deps; ++dep) {
                    for (let row = 0; row < this.bound.rows; ++row) {
                        const obj = this.getBottom(row, e.col, dep + 1);
                        this.setBottom(row, e.col, dep, obj);
                        if (obj) {
                            obj.position.y = dep;
                        }
                    }
                }
            }
        });

        objs = objs.filter((x) => x);
        objs.forEach((x) => {
            window.game.scene.remove(x);
        });
    }

    checkCreate() {
        if (this.createCount == null) {
            this.createCount = 0;
        }

        if (!this.dropCubes) {
            this.dropType = "I";
            var rcds = Helper.createShape(this.dropType, { row: this.bound.rows - 5, col: 0, dep: 0 });
            this.dropCubes = Helper.createObjects(rcds);

            this.dropCubes.forEach((cube) => {
                window.game.scene.add(cube);
            });
            Helper.reshapeCubes(this.dropCubes, rcds);

            this.createCount += 1;
        }
    }

    checkDrop() {
        let ret = {
            needCheckErase: false
        };
        // if (this.dropCubes) {
        //     const curCubesRCD = Helper.getCube_RCD(this.dropCubes);
        //     const bound = Helper.getBound_RCD(curCubesRCD);

        //     const bottomMaxRows = curCubesRCD.map((rcd) => this.getBottomMaxRow(rcd));
        //     const bottomMaxRow = Math.max(...bottomMaxRows);
        //     const willTargetRow = bound.minRow - 1;

        //     if (willTargetRow <= bottomMaxRow) { // 已经落到底了
        //         // this.dropCubes.forEach((cube) => {
        //         //     cube.position.y = bottomMaxRow + 1;
        //         // });

        //         const rcds = Helper.getCube_RCD(this.dropCubes);

        //         this.dropCubes.forEach((cube, i) => {
        //             const index = Helper.getIndexByRCD(this.bound, rcds[i]);
        //             this.bottoms[index] = this.dropCubes[i];
        //         });
        //         this.dropCubes = null;

        //         ret.needCheckErase = true;
        //     }
        //     else { // 还没落到底
        //         this.dropCubes.forEach((cube) => {
        //             cube.position.y -= 1;
        //         });
        //     }
        // }
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
                if (rcd.dep >= 0 && rcd.dep < this.bound.deps) {
                    return true;
                }
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
            if (this.getBottom(row, rcd.col, rcd.dep)) {
                return row;
            }
        }
        return -1;
    }

    getBottom(row, col, dep) {
        return this.bottoms[Helper.getIndexByRCD(this.bound, { row, col, dep })];
    }
    setBottom(row, col, dep, val) {
        const index = Helper.getIndexByRCD(this.bound, { row, col, dep });
        const origin = this.bottoms[index];
        this.bottoms[index] = val;
        return origin;
    }
}

export { GameLogic }