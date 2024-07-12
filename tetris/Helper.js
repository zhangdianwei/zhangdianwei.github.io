import { ShapeDefine } from "./ShapeDefine.js"
import { TextGeometry } from "TextGeometry"

class Helper {

    static createRandomShapeType() {
        const candidates = ["I", "O", "T", "S", "Z", "J", "L"];
        const index = this.randomInt(0, candidates.length);
        return candidates[index];
    }

    static randomInt(start, end) {
        return Math.floor(Math.random() * (end - start) + start);
    }

    static createShape(type, baseRCD) {
        let ret = JSON.parse(JSON.stringify(ShapeDefine[type].shapes[0]));
        ret.forEach((rcd) => {
            rcd.row += baseRCD.row;
            rcd.col += baseRCD.col;
        });
        return ret;
    }

    static createObjects(rcds) {
        var geometry = new RoundedBoxGeometry(1, 1, 1, 5, 0.1);
        geometry.translate(0.5, 0.5, -0.5);

        let ret = rcds.map((rcd, i) => {
            const material = new THREE.MeshStandardMaterial({
                color: Math.floor(Math.random() * 0xffffff),
                transparent: true,
            });
            const cube = new THREE.Mesh(geometry, material);
            return cube;
        });

        return ret;
    }

    static getObjectPosition(rcd) {
        return new THREE.Vector3(rcd.col, rcd.row, 0);
    }

    static reshapeCubes(cubes, rcds, anim) {
        if (anim) {
            cubes.forEach((object, i) => {
                let tween = new TWEEN.Tween(object.position);
                tween.to(this.getObjectPosition(rcds[i]), 100);
                tween.start();
            });
        }
        else {
            cubes.forEach((object, i) => {
                const pos = this.getObjectPosition(rcds[i]);
                object.position.set(pos.x, pos.y, pos.z);
            });
        }
    }

    static blinkCubes(cubes, callback) {
        cubes.forEach((cube) => {
            var tween = new TWEEN.Tween(cube.material)
                .to({ opacity: 0 }, 100)
                .repeat(2)
                .yoyo(true)
                .start();

            tween.onComplete(function () {
                // tweenBack.start();
                if (callback) {
                    callback();
                }
            });
        })

    }

    static getBound_RCD(rcds) {
        let ret = {
            minRow: -1,
            maxRow: -1,
            minCol: -1,
            maxRow: -1,
        };
        if (rcds.length > 0) {
            ret.minRow = Math.min(...rcds.map((rcd) => rcd.row));
            ret.maxRow = Math.max(...rcds.map((rcd) => rcd.row));
            ret.minCol = Math.min(...rcds.map((rcd) => rcd.col));
            ret.maxCol = Math.max(...rcds.map((rcd) => rcd.col));
        }
        return ret;
    }

    static getIndexByRCD(bound, rcd) {
        return rcd.row * bound.cols + rcd.col;
    }

    static getBound_Cubes(cubes) {
        const ret = {};
        ret.minY = Math.min(...cubes.map((cube) => cube.position.y));
        return ret;
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
            var stdRCD = { row: bound.minRow, col: bound.minCol };
        }
        else {
            var stdRCD = { row: bound.minRow, col: bound.maxCol };
            // var stdRCD = { row: bound.minRow, col: bound.minCol };
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

    static createText(text) {
        const geometry = new TextGeometry(text, {
            font: window.game.res.font,
            size: 1,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.05,
            bevelSegments: 5
        });

        var material = new THREE.MeshPhongMaterial({
            color: 0xFFD3A3,
        });

        var mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }


    // alignObjectToPos(obj, anchor, toPos) {

    // }
}

export { Helper }