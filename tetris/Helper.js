import { ShapeDefine } from "./ShapeDefine.js"

class Helper {

    static createShape(type) {
        return JSON.parse(JSON.stringify(ShapeDefine[type].shapes[0]));
    }

    static createObjects(rcds) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({
            color: Math.floor(Math.random() * 0xffffff),
            flatShading: true,
            transparent: true,
            opacity: 0.5,
        });

        let ret = rcds.map((rcd) => {
            const cube = new THREE.Mesh(geometry, material);
            return cube;
        });

        return ret;
    }

    static reshapeCubes(cubes, rcds) {
        cubes.forEach((cube, i) => {
            cube.position.set(rcds[i].col + 0.5, rcds[i].dep + 0.5, -rcds[i].row - 0.5);
        });
    }

    static getBound_RCD(rcds) {
        let ret = {};
        ret.minDep = Math.min(...rcds.map((rcd) => rcd.dep));
        ret.maxDep = Math.max(...rcds.map((rcd) => rcd.dep));
        return ret;
    }

    getRCDByIndex(bound, index) {
        return {
            row: Math.floor(index / bound.rows),
            col: Math.floor(index / bound.cols),
            dep: Math.floor(index / bound.deps),
        }
    }

    getIndexByRCD(bound, rcd) {
        return rcd.row * bound.rows + rcd.col * bound.cols + rcd.dep * bound.deps;
    }

    // bound: {rows, cols, deps}
    static getBound_Array(arr, bound) {
        const rcds = arr.map((index) => this.getRCDByIndex(bound, index));
        return this.getBound_RCD(rcds);
    }

    static getBound_Cubes(cubes) {
        const ret = {};
        ret.minY = Math.min(...cubes.map((cube) => cube.position.y));
        return ret;
    }
}

export { Helper }