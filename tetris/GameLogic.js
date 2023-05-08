import { TetrisItem } from "./TetrisItem.js";
import { Helper } from "./Helper.js"

class GameLogic {
    constructor() {
        this.dropping = null; //正在下落的TetrisItem
        this.bottoms = []; //整个10x10x10的网格
        this.bound = { rows: 10, cols: 10, deps: 5 };

        this.scheduleObjs = [];

        this.updateSecond(0);
        this.schedule(this.updateSecond.bind(this), 1000);

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {

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
        if (!this.dropping && this.bottoms.length < this.bound.deps) {
            this.dropping = Helper.createShape("I");
            this.dropping2 = Helper.createObjects(this.dropping);

            this.dropping2.forEach((cube) => {
                window.game.scene.add(cube);
            });
            Helper.reshapeCubes(this.dropping2, this.dropping);
        }

        // document.getElementById("debug_label").textContent = `
        //     camera = ${window.game.camera.position.x.toFixed(0)}, ${window.game.camera.position.y.toFixed(0)}, ${window.game.camera.position.z.toFixed(0)}
        // `;
    }

    update(dt) {
        if (this.dropping2) {
            const wantDropY = dt / 1000;
            const rcdsBound = Helper.getBound_RCD(this.dropping);
            const cubeBound = Helper.getBound_Cubes(this.dropping2);
            const bottomBound = Helper.getBound_Array(this.bottoms, this.bound);
            const wantTargetY = cubeBound.minY - wantDropY;
            const curTargetD = Math.floor(cubeBound.minY);
            const wantTargetD = Math.floor(wantTargetY);
            const canDropY = cubeBound.minY - (bottomBound.maxDep + 1);

            if (wantTargetD <= bottomBound.maxDep) { // 已经落到底了
                this.dropping2.forEach((cube) => {
                    cube.position.y = bottomBound.maxDep + 1;
                });

                this.dropping.forEach((rcd, i) => {
                    const index = Helper.getIndexByRCD(this.bound, rcd);
                    this.bottoms[index] = this.dropping2[i];
                });
                this.dropping = null;
                this.dropping2 = null;
            }
            else if (wantTargetD < curTargetD) { // 正常下落，但是超过了一个格子
                this.dropping.forEach((rcd) => {
                    rcd.dep -= 1;
                });

                this.dropping2.forEach((cube) => {
                    cube.position.y = wantTargetY;
                });
            }
            else { // 正常下落，但是还在原来的格子里运动
                this.dropping2.forEach((cube) => {
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

    canMoveTo(tetrisItem, grid) {
        const placeholders = tetrisItem.tetrisShape.getPlaceholderGrid(grid, tetrisItem.rotH);
        return placeholders.every((x) => this.isGridInBound(x) && !this.isGridOccupied(x));
    }

    canRotHTo(tetrisItem, rotH) {
        const placeholders = tetrisItem.tetrisShape.getPlaceholderGrid(tetrisItem.getGrid(), rotH);
        return placeholders.every((x) => this.isGridInBound(x) && !this.isGridOccupied(x));
    }

    isGridInBound(grid) {
        if (grid.row >= 0 && grid.row < this.bound.rows) {
            if (grid.col >= 0 && grid.col < this.bound.cols) {
                if (grid.dep >= 0 && grid.dep < this.bound.deps) {
                    return true;
                }
            }
        }
        return false;
    }

    isGridOccupied(grid) {
        const ret = this.bottoms.some((tetrisItem) => {
            const placeholders = tetrisItem.tetrisShape.getPlaceholderGrid(tetrisItem.getGrid(), tetrisItem.rotH);
            const occupied = placeholders.some((p) => {
                return p.row == grid.row && p.col == grid.col && p.dep == grid.dep;
            });
            return occupied;
        });
        return ret;
    }
}

export { GameLogic }