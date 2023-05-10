
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

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
        // console.log(event.code);
        if (this.dropCubes) {
            if (event.code == "KeyW") {
                let moveToRCDs = Helper.getCube_RCD(this.dropCubes);
                moveToRCDs.forEach((rcd) => rcd.row += 1);
                if (this.canPlace(moveToRCDs)) {
                    Helper.reshapeCubes2(this.dropCubes, moveToRCDs);
                }
            }
            else if (event.code == "KeyS") {
                let moveToRCDs = Helper.getCube_RCD(this.dropCubes);
                moveToRCDs.forEach((rcd) => rcd.row -= 1);
                if (this.canPlace(moveToRCDs)) {
                    Helper.reshapeCubes2(this.dropCubes, moveToRCDs);
                }
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
            else if (event.code == "Numpad0" || event.code == "Digit0") {
                let moveToRCDs = Helper.getCube_RCD(this.dropCubes);
                Helper.rotateRCDsHClockwise(this.dropType, moveToRCDs, false);
                if (this.canPlace(moveToRCDs)) {
                    Helper.reshapeCubes2(this.dropCubes, moveToRCDs);
                }
            }
            else if (event.code == "Enter" || event.code == "NumpadEnter") {
                this.updateSecond();
            }
            // else if (event.code == "ArrowLeft") {
            //     let moveToRCDs = Helper.getCube_RCD(this.dropCubes);
            //     Helper.rotateRCDsHClockwise(this.dropType, moveToRCDs, false);
            //     if (this.canPlace(moveToRCDs) || true) {
            //         Helper.reshapeCubes2(this.dropCubes, moveToRCDs);
            //     }
            // }
            // else if (event.code == "ArrowRight") {
            //     let moveToRCDs = Helper.getCube_RCD(this.dropCubes);
            //     Helper.rotateRCDsHClockwise(this.dropType, moveToRCDs, true);
            //     if (this.canPlace(moveToRCDs) || true) {
            //         Helper.reshapeCubes2(this.dropCubes, moveToRCDs);
            //     }
            // }
        }
    }

    onKeyUp(event) {

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
            this.checkGameOver();
        }

        if (this.state1 == "game" && !this.state2) {
            this.checkCreate();
        }


        // document.getElementById("debug_label").textContent = `
        //     camera = ${window.game.camera.position.x.toFixed(0)}, ${window.game.camera.position.y.toFixed(0)}, ${window.game.camera.position.z.toFixed(0)}
        // `;
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
        let rows = Helper.makeSequenceArray(this.bound.rows);
        let cols = Helper.makeSequenceArray(this.bound.cols);
        let deps = Helper.makeSequenceArray(this.bound.deps);
        deps.forEach((dep) => {
            rows.forEach((row) => {
                let can = cols.every((col) => this.getBottom(row, col, dep));
                if (can) {
                    ret.push({ row, dep });
                }
            });

            cols.forEach((col) => {
                let can = rows.every((row) => this.getBottom(row, col, dep));
                if (can) {
                    ret.push({ col, dep });
                }
            });
        });
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
            var rcds = Helper.createShape(this.dropType, { row: 0, col: 0, dep: this.bound.deps - 1 });
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
        if (this.dropCubes) {
            // const wantDropY = dt / 1000;
            // const curCubesMinY = Math.min(...this.dropCubes.map((cube) => cube.position.y));
            const curCubesRCD = Helper.getCube_RCD(this.dropCubes);
            const bound = Helper.getBound_RCD(curCubesRCD);
            const bottomMaxDep = this.getBottomMaxDep(curCubesRCD);
            // const wantTargetY = curCubesMinY - wantDropY;
            // const wantTargetD = Math.floor(wantTargetY);
            const wantTargetD = bound.minDep - 1;

            if (wantTargetD <= bottomMaxDep) { // 已经落到底了
                this.dropCubes.forEach((cube) => {
                    cube.position.y = bottomMaxDep + 1;
                });

                const rcds = Helper.getCube_RCD(this.dropCubes);

                this.dropCubes.forEach((cube, i) => {
                    const index = Helper.getIndexByRCD(this.bound, rcds[i]);
                    this.bottoms[index] = this.dropCubes[i];
                });
                this.dropCubes = null;

                ret.needCheckErase = true;
            }
            else { // 还没落到底
                this.dropCubes.forEach((cube) => {
                    cube.position.y = wantTargetD;
                });
            }
        }
        return ret;
    }

    checkGameOver() {
        let failed = false;
        for (let row = 0; row < this.bound.rows; row++) {
            for (let col = 0; col < this.bound.cols; col++) {
                const index = Helper.getIndexByRCD(this.bound, { row, col, dep: this.bound.deps - 1 });
                if (this.bottoms[index]) {
                    failed = true;
                    break;
                }
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

    getBottomMaxDep(dropBound) {
        let ret = -1;
        dropBound.forEach((rcd) => {
            for (let dep = 0; dep < dropBound.dep; ++dep) {
                const temprcd = { row: rcd.row, col: rcd.col, dep: dep };
                const index = Helper.getIndexByRCD(this.bound, temprcd);
                if (this.bottoms[index] && dep > ret) {
                    ret = dep;
                }
            }
        });
        return ret;
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