import { TetrisItem } from "./TetrisItem.js";
import { Helper } from "./Helper.js"

class GameLogic {
    constructor() {
        this.dropCubes = null; //正在下落的cube
        this.bottoms = []; //整个10x10x10的网格
        this.bound = { rows: 10, cols: 10, deps: 5 };

        this.scheduleObjs = [];

        this.updateSecond(0);
        this.schedule(this.updateSecond.bind(this), 1000);

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
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
            else if (event.code == "ArrowLeft") {
                let moveToRCDs = Helper.getCube_RCD(this.dropCubes);
                Helper.rotateRCDsClockwise(moveToRCDs);
                if (this.canPlace(moveToRCDs)) {
                    Helper.reshapeCubes(this.dropCubes, moveToRCDs);
                }
            }
            else if (event.code == "ArrowRight") {
                let moveToRCDs = Helper.getCube_RCD(this.dropCubes);
                Helper.rotateRCDsRight(moveToRCDs);
                if (this.canPlace(moveToRCDs)) {
                    Helper.reshapeCubes(this.dropCubes, moveToRCDs);
                }
            }
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
        if (!this.dropCubes && this.bottomCubeCount < 1) {
            const rcds = Helper.createShape("J", { row: 0, col: 0, dep: 5 });
            this.dropCubes = Helper.createObjects(rcds);

            this.dropCubes.forEach((cube) => {
                window.game.scene.add(cube);
            });
            Helper.reshapeCubes(this.dropCubes, rcds);
        }

        // document.getElementById("debug_label").textContent = `
        //     camera = ${window.game.camera.position.x.toFixed(0)}, ${window.game.camera.position.y.toFixed(0)}, ${window.game.camera.position.z.toFixed(0)}
        // `;
    }

    update(dt) {
        if (this.dropCubes) {
            const wantDropY = dt / 1000;
            const curCubesMinY = Math.min(...this.dropCubes.map((cube) => cube.position.y));
            const curCubesRCD = Helper.getCube_RCD(this.dropCubes);
            const bottomMaxDep = this.getBottomMaxDep(curCubesRCD);
            const wantTargetY = curCubesMinY - wantDropY;
            const wantTargetD = Math.floor(wantTargetY);

            if (wantTargetD <= bottomMaxDep) { // 已经落到底了
                this.dropCubes.forEach((cube) => {
                    cube.position.y = bottomMaxDep + 1;
                });

                // const rcds = Helper.getCube_RCD(this.dropCubes);

                // this.dropCubes.forEach((cube, i) => {
                //     const index = Helper.getIndexByRCD(this.bound, rcds[i]);
                //     this.bottoms[index] = this.dropCubes[i];
                // });
                // this.dropCubes = null;
            }
            else { // 还没落到底
                this.dropCubes.forEach((cube) => {
                    cube.position.y = wantTargetY;
                });
            }
        }

        this.scheduleObjs.forEach((x, i) => {
            x.elapsed += dt;
            if (x.elapsed >= x.interval) {
                x.func(x.elapsed);
                x.elapsed -= x.interval;
            }
        });
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
            for (let d = 0; d < this.bound.deps; ++d) {
                const temprcd = { row: rcd.row, col: rcd.col, dep: d };
                const index = Helper.getIndexByRCD(this.bound, temprcd);
                if (this.bottoms[index] && d > ret) {
                    ret = d;
                }
            }
        });
        return ret;
    }

}

export { GameLogic }