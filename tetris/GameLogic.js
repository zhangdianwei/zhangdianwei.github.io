
import { TetrisItem } from "./TetrisItem.js";

class GameLogic {
    constructor() {
        this.dropping = null; //正在下落的TetrisItem
        this.bottoms = []; //已经落到地的所有TetrisItem
        this.bound = { rows: 10, cols: 10, deps: 10 };

        this.scheduleObjs = [];

        this.updateSecond(0);
        this.schedule(this.updateSecond.bind(this), 1000);

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
        // console.log(event.code);
        if (this.dropping) {
            if (event.code == "ArrowLeft") {
                const rotH = this.dropping.rotH + 1;
                if (this.canRotHTo(this.dropping, rotH)) {
                    this.dropping.rotH = rotH;
                }
            }
            else if (event.code == "ArrowRight") {
                const rotH = this.dropping.rotH - 1;
                if (this.canRotHTo(this.dropping, rotH)) {
                    this.dropping.rotH = rotH;
                }
            }
            else if (event.code == "KeyW") {
                let grid = this.dropping.getGrid();
                grid.row += 1;
                if (this.canMoveTo(this.dropping, grid)) {
                    this.dropping.setGrid(grid);
                }
            }
            else if (event.code == "KeyS") {
                let grid = this.dropping.getGrid();
                grid.row -= 1;
                if (this.canMoveTo(this.dropping, grid)) {
                    this.dropping.setGrid(grid);
                }
            }
            else if (event.code == "KeyA") {
                let grid = this.dropping.getGrid();
                grid.col -= 1;
                if (this.canMoveTo(this.dropping, grid)) {
                    this.dropping.setGrid(grid);
                }
            }
            else if (event.code == "KeyD") {
                let grid = this.dropping.getGrid();
                grid.col += 1;
                if (this.canMoveTo(this.dropping, grid)) {
                    this.dropping.setGrid(grid);
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
        if (!this.dropping && this.bottoms.length < 10) {
            this.dropping = new TetrisItem("I");
            this.dropping.setGrid({ row: 0, col: 0, dep: this.bound.deps });
            window.game.scene.add(this.dropping.getThreeObject());
        }

        document.getElementById("debug_label").textContent = `
            camera = ${window.game.camera.position.x.toFixed(0)}, ${window.game.camera.position.y.toFixed(0)}, ${window.game.camera.position.z.toFixed(0)}
        `;
    }

    update(dt) {
        if (this.dropping) {
            this.dropping.update(dt);

            if (this.dropping.getThreeObject().position.y <= 0) {
                this.dropping.getThreeObject().position.y = 0;

                this.bottoms.push(this.dropping);
                this.dropping = null;
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
        const ret = this.bottoms.some((tetrisItem)=>{
            const placeholders = tetrisItem.tetrisShape.getPlaceholderGrid(tetrisItem.getGrid(), tetrisItem.rotH);
            const occupied = placeholders.some((p)=>{
                return p.row==grid.row && p.col==grid.col && p.dep==grid.dep;
            });
            return occupied;
        });
        return ret;
    }
}

export { GameLogic }