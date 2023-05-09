import { ShapeDefine } from "./ShapeDefine.js"

class Helper {

    static createObjectsByShape(shapeType) {

    }

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

        const material = new THREE.MeshPhongMaterial({
            color: Math.floor(Math.random() * 0xffffff),
            flatShading: true,
            transparent: true,
            opacity: 0.8,
        });

        let ret = rcds.map((rcd) => {
            const cube = new THREE.Mesh(geometry, material);
            return cube;
        });

        return ret;
    }

    static reshapeCubes(cubes, rcds) {
        cubes.forEach((cube, i) => {
            cube.position.set(rcds[i].col, rcds[i].dep, -rcds[i].row);
        });
    }

    static reshapeCubes2(cubes, rcds) {
        cubes.forEach((cube, i) => {
            cube.position.x = rcds[i].col;
            // cube.position.y = rcds[i].dep;
            cube.position.z = -rcds[i].row;
        });
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
                row: Math.floor(-cube.position.z),
                col: Math.floor(cube.position.x),
                dep: Math.floor(cube.position.y),
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

    static getMoveStandRC(rcds) {
        const bound = this.getBound_RCD(rcds);
        const min_row_s = rcds.filter((rcd) => rcd.row == bound.minRow);
        const min_col = min_row_s.map()
    }

    static rotateRCDsH(rcds, clockwise) {
        /*
        0. 向上右补全到nxn
        1. 以nxn转，left=逆时针转，right=顺时针转
        2. left=看左边还有没有空位，有就平移 right=看右边还有没有空位，有就平移
        3. 
        */
        let rcdSize = this.getRCDSize(rcds);
        let fillSize = Math.max(rcdSize.rows, rcdSize.cols);
        let moveStandardRC = this.getMinRCDBySequence(rcds, ["row", "col"])[0];
        if (clockwise) {

        }
        else {

        }
    }

}

export { Helper }