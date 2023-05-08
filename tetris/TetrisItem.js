import { TetrisShape } from "./TetrisShape.js"

// 代表一个基本的元素，例如2x2方块，T拐等
class TetrisItem {
    // rcds: [RCD]
    constructor(rcds) {
        this.rcds = rcds;
    }

    // x=col, y=dep, z=-row

    // // rcd: {row, col, dep}
    // // posType: null=不设置位置，top=设置到网格最上面，bottom=设置到网格最下面
    // setRCD(rcd, posType) {
    //     this.rcd = rcd;

    //     if (posType == "top") {
    //         this.getObject().position.y = rcd.dep + 1;
    //     }
    //     else if (posType == "bottom") {
    //         this.getObject().position.y = rcd.dep;
    //     }
    // }
    // getRCD() {
    //     return this.rcd;
    // }

    setRCDs(rcds) {
        this.rcds = rcds;
        this.rcds.forEach((rcd, i) => {
            this.getObject().children[i].position.set(rcd.col + 0.5, rcd.dep + 0.5, -rcd.row - 0.5);
        });
    }

    getObject() {
        if (!this.object) {
            this.object = this.createObject();
        }
        return this.object;
    }

    createObject() {
        let obj = new THREE.Object3D();

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({
            // color: "#3d77ba",
            color: Math.floor(Math.random() * 0xffffff),
            flatShading: true,
            transparent: true,
            opacity: 0.5,
        });

        for (let i = 0; i < this.rcds.length; ++i) {
            const cube = new THREE.Mesh(geometry, material);
            obj.add(cube);
        }

        return obj;
    }

    // reshape() {
    //     const placeholders = this.tetrisShape.placeholders;
    //     placeholders.forEach((x, i) => {
    //         this.object.children[i].position.set(x.col + 0.5, x.dep + 0.5, -x.row - 0.5);
    //     });
    // }
}

export { TetrisItem }