import { ShapeDefine } from "./ShapeDefine.js"

class Helper {

    static createShape(type, baseRCD) {
        let ret = JSON.parse(JSON.stringify(ShapeDefine[type].shapes[0]));
        ret.forEach((rcd) => {
            rcd.row += baseRCD.row;
            rcd.col += baseRCD.col;
            rcd.dep += baseRCD.dep;
        });
        return ret;
    }

    static createObjects(rcds) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        geometry.translate(0.5, 0.5, -0.5);

        // const material = new THREE.MeshPhongMaterial({
        //     color: Math.floor(Math.random() * 0xffffff),
        //     flatShading: true,
        //     transparent: true,
        //     opacity: 0.9,
        // });

        let ret = rcds.map((rcd, i) => {
            const material = new THREE.MeshPhongMaterial({
                color: 16777215 * (i / 3),
                flatShading: true,
                // transparent: true,
                // opacity: 0.9,
            });
            const cube = new THREE.Mesh(geometry, material);
            // cube.renderOrder = i + 1;
            return cube;
        });

        return ret;
    }

    static getObjectPosition(rcd) {
        return new THREE.Vector3(rcd.col, rcd.row, rcd.dep);
    }

    static reshapeCubes(cubes, rcds) {
        cubes.forEach((cube, i) => {
            cube.position.set(rcds[i].col, rcds[i].row, rcds[i].dep);
        });
    }

    static reshapeCubes2(cubes, rcds) {
        cubes.forEach((object, i) => {
            let tween = new TWEEN.Tween(object.position);
            tween.to(this.getObjectPosition(rcds[i]), 100);
            tween.start();
        })

    }

    static getBound_RCD(rcds) {
        let ret = {
            minRow: -1,
            maxRow: -1,
            minCol: -1,
            maxRow: -1,
            minDep: -1,
            maxDep: -1,
        };
        if (rcds.length > 0) {
            ret.minRow = Math.min(...rcds.map((rcd) => rcd.row));
            ret.maxRow = Math.max(...rcds.map((rcd) => rcd.row));
            ret.minCol = Math.min(...rcds.map((rcd) => rcd.col));
            ret.maxCol = Math.max(...rcds.map((rcd) => rcd.col));
            ret.minDep = Math.min(...rcds.map((rcd) => rcd.dep));
            ret.maxDep = Math.max(...rcds.map((rcd) => rcd.dep));
        }
        return ret;
    }

    static getRCDByIndex(bound, index) {
        let ret = {};
        ret.dep = index % bound.deps;
        ret.col = Math.floor(index / bound.deps) % bound.cols;
        ret.row = Math.floor(index / (bound.cols * bound.deps));
        return ret;
    }

    static getIndexByRCD(bound, rcd) {
        return (rcd.row * bound.cols + rcd.col) * bound.deps + rcd.dep;
    }

    // static getBound_Array(cubeArr, bound, dropBound) {
    //     let rcds = cubeArr.map((cube, index) => cube ? this.getRCDByIndex(bound, index) : null);
    //     rcds = rcds.filter((x) => x);
    //     return this.getBound_RCD(rcds);
    // }

    static getBound_Cubes(cubes) {
        const ret = {};
        ret.minY = Math.min(...cubes.map((cube) => cube.position.y));
        return ret;
    }

    static getCube_RCD(cubes) {
        let ret = cubes.map((cube) => {
            return {
                row: Math.floor(cube.position.y),
                col: Math.floor(cube.position.x),
                dep: Math.floor(-cube.position.z),
            }
        });
        return ret;
    }

    static getRCDSize(rcds) {
        const bound = this.getBound_RCD(rcds);
        return {
            rows: bound.maxRow - bound.minRow + 1,
            cols: bound.maxCol - bound.minCol + 1,
            deps: bound.maxDep - bound.minDep + 1,
        }
    }

    static copy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    static makeSequenceArray(num) {
        let ret = [];
        for (let i = 0; i < num; ++i) {
            ret.push(i);
        }
        return ret;
    }

    static getMinRCDBySequence(rcds, seqs) {
        let candidates = rcds;
        seqs.forEach((seq) => {
            if (seq == "row") {
                const minRow = Math.min(...candidates.map((rcd) => rcd.row));
                candidates = candidates.filter((rcd) => rcd.row == minRow);
            }
            else if (seq == "col") {
                const minCol = Math.min(...candidates.map((rcd) => rcd.col));
                candidates = candidates.filter((rcd) => rcd.col == minCol);
            }
            else if (seq == "dep") {
                const minDep = Math.min(...candidates.map((rcd) => rcd.dep));
                candidates = candidates.filter((rcd) => rcd.dep == minDep);
            }
        });
        return candidates;
    }

    static findRCDsBySequence(rcds, seqs) {
        let candidates = rcds;
        seqs.forEach((seq) => {
            if (seq.row == "min") {
                const target = Math.min(...candidates.map((rcd) => rcd.row));
                candidates = candidates.filter((rcd) => rcd.row == target);
            }
            else if (seq.row == "max") {
                const target = Math.max(...candidates.map((rcd) => rcd.row));
                candidates = candidates.filter((rcd) => rcd.row == target);
            }
            else if (seq.col == "min") {
                const target = Math.min(...candidates.map((rcd) => rcd.col));
                candidates = candidates.filter((rcd) => rcd.col == target);
            }
            else if (seq.col == "max") {
                const target = Math.max(...candidates.map((rcd) => rcd.col));
                candidates = candidates.filter((rcd) => rcd.col == target);
            }
            else if (seq.dep == "min") {
                const target = Math.min(...candidates.map((rcd) => rcd.dep));
                candidates = candidates.filter((rcd) => rcd.dep == target);
            }
            else if (seq.dep == "max") {
                const target = Math.max(...candidates.map((rcd) => rcd.dep));
                candidates = candidates.filter((rcd) => rcd.dep == target);
            }
        });
        return candidates;
    }

    static getMoveStandRC(rcds) {
        const bound = this.getBound_RCD(rcds);
        const min_row_s = rcds.filter((rcd) => rcd.row == bound.minRow);
        const min_col = min_row_s.map()
    }

    static sort_rcds(rcds) {
        rcds.sort((a, b) => {

        });
    }

    static rotateRCDsHClockwise(shapeType, rcds, left) {
        let bound = this.getBound_RCD(rcds);
        if (left) {
            var stdRCD = { row: bound.minRow, col: bound.minCol, dep: bound.minDep };
        }
        else {
            var stdRCD = { row: bound.minRow, col: bound.maxCol, dep: bound.minDep };
            // var stdRCD = { row: bound.minRow, col: bound.minCol, dep: bound.minDep };
        }
        let n = Math.max(bound.maxRow - bound.minRow + 1, bound.maxCol - bound.minCol + 1);

        // 归一
        rcds.forEach((rcd) => {
            rcd.row -= stdRCD.row;
            rcd.col -= stdRCD.col;
        });

        // 旋转
        if (left) {
            rcds.forEach((rcd) => {
                let { row, col } = rcd;
                rcd.row = col;
                rcd.col = -row;
            });
        }
        else {
            rcds.forEach((rcd) => {
                let { row, col } = rcd;
                rcd.row = -col;
                rcd.col = row;
            });
        }

        // 还原
        rcds.forEach((rcd) => {
            rcd.row += stdRCD.row;
            rcd.col += stdRCD.col;
        });
    }

}

export { Helper }