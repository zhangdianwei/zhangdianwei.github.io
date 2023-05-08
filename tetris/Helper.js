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
            minDep: -1,
            maxDep: -1,
        };
        if (rcds.length > 0) {
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

    static rotateRCDs(rcds, rotateCount) {

    }

}

export { Helper }