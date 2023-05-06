import { TetrisShape } from "./TetrisShape.js"

// 代表一个基本的元素，例如2x2方块，T拐等
class TetrisItem {
    constructor(shapeType) {
        this.tetrisShape = new TetrisShape(shapeType);
        this.threeObject = this.createThreeObject();
        this.reshape();
    }

    setGrid(grid) {
        this.getThreeObject().position.set(grid.col, grid.dep, -grid.row);
    }
    getGrid() {
        return {
            row: -Math.floor(this.getThreeObject().position.z),
            col: Math.floor(this.getThreeObject().position.x),
            dep: Math.floor(this.getThreeObject().position.y),
        }
    }

    get rotH() { return this.tetrisShape.rotH; }
    set rotH(value) { this.tetrisShape.rotH = value; this.reshape(); }

    update(dt) {
        this.threeObject.position.y -= dt / 1000;
        if (this.threeObject.position.y < 0) {
            this.threeObject.position.y = 0;
        }
    }

    getThreeObject() {
        return this.threeObject;
    }

    createThreeObject() {
        let obj = new THREE.Object3D();

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({
            // color: "#3d77ba",
            color: Math.floor(Math.random() * 0xffffff),
            flatShading: true,
            transparent: true,
            opacity: 0.5,
        });

        for (let i = 0; i < this.tetrisShape.shapeDefine.cube_count; ++i) {
            const cube = new THREE.Mesh(geometry, material);
            obj.add(cube);
        }

        return obj;
    }

    reshape() {
        const placeholders = this.tetrisShape.placeholders;
        placeholders.forEach((x, i) => {
            this.threeObject.children[i].position.set(x.col + 0.5, x.dep + 0.5, -x.row - 0.5);
        });
    }
}

export { TetrisItem }