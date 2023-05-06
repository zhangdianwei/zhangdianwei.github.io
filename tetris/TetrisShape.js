import { ShapeDefine } from "./ShapeDefine.js"

class TetrisShape {
    // shapeType: I O T J L S Z
    constructor(shapeType) {
        this.shapeType = shapeType;
        this.shapeDefine = ShapeDefine[this.shapeType];
        this.rotH = 0; //水平旋转几次
        this.rotV = 0; //垂直旋转几次
    }

    get rotH() { return this._rotH; }
    set rotH(value) {
        this._rotH = value;
        if (this._rotH < 0) {
            this._rotH = this.shapeDefine.shapes.length - 1;
        }
        else if (this._rotH >= this.shapeDefine.shapes.length) {
            this._rotH = 0;
        }
    }

    getSafeRotH(rotH)
    {
        if(rotH<0){
            return rotH%this.shapeDefine.shapes.length+this.shapeDefine.shapes.length;
        }
        else if (rotH>0){
            return rotH%this.shapeDefine.shapes.length;
        }
        else{
            return rotH;
        }
    }

    get placeholders() {
        return this.shapeDefine.shapes[this.rotH];
    }

    getPlaceholderGrid(grid, rotH){
        let placeholders = this.shapeDefine.shapes[this.getSafeRotH(rotH)];
        placeholders = placeholders.map((x)=>{
            return {
                row: x.row+grid.row,
                col: x.col+grid.col,
                dep: x.dep+grid.dep,
            }
        });
        return placeholders;
    }

    // getPlaceholderRotH(rotH){
    //     let placeholders = this.shapeDefine.shapes[this.getSafeRotH(rotH)];
    //     return placeholders;
    // }

}

export { TetrisShape }