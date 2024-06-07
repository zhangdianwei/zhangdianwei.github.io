import { Group, Vector3 } from 'three'

class RCHelper {
    constructor() {
        this.Rows = 26;
        this.Cols = 26;
    }

    getRCByIndex(index) {
        let rc = {};
        rc.r = Math.floor(index / this.Cols);
        rc.c = index % this.Cols;
        return rc;
    }

    getIndexByRC(r, c) {
        if (typeof (r) == 'object') {
            var { r, c } = r;

        }
        return r * this.Cols + c;
    }

    getIndexByPosition(pos) {
        return this.getIndexByRC(getRCByPosition(pos));
    }

    getRCByPosition(pos) {
        let rc = {};
        rc.r = Math.floor((pos.z + 6.5) / 0.5);
        rc.c = Math.floor((pos.x + 6.5) / 0.5);
        return rc;
    }

    isIndexInTile(index) {
        return index >= 0 && index < this.Rows * this.Cols;
    }

    isRCInTile(r, c) {
        if (typeof (r) == 'object') {
            var { r, c } = r;
        }
        return r >= 0 && r < this.Rows && c >= 0 && c < this.Cols;
    }

    // 获取的是rc中心的位置
    getPositionByRC(r, c) {
        if (typeof (r) == 'object') {
            var { r, c } = r;
        }
        return new Vector3(c * 0.5 - 6.25, 0, r * 0.5 - 6.25)
    }

    // centerPos: 中心点的世界坐标
    // size: 宽高是多少
    getStandGrid(centerPos, size) {
        let standGrid = {};

        const corner0 = new Vector3(centerPos.x - size / 2, 0, centerPos.z - size / 2);
        // const corner1 = centerPos.clone().add(size / 2, -size / 2);
        const corner2 = new Vector3(centerPos.x + size / 2, 0, centerPos.z + size / 2);
        // const corner3 = centerPos.clone().add(-size / 2, size / 2);

        const rc0 = this.getRCByPosition(corner0);
        // const rc1 = this.getRCByPosition(corner1);
        const rc2 = this.getRCByPosition(corner2);
        // const rc3 = this.getRCByPosition(corner3);

        standGrid.minR = Math.min(rc0.r, rc2.r);
        standGrid.minC = Math.min(rc0.c, rc2.c);
        standGrid.maxR = Math.max(rc0.r, rc2.r);
        standGrid.maxC = Math.max(rc0.c, rc2.c);

        if (Number.isInteger(corner2.x / 0.5)) {
            standGrid.maxC -= 1;
        }

        if (Number.isInteger(corner2.z / 0.5)) {
            standGrid.maxR -= 1;
        }

        return standGrid;

    }
}

export default RCHelper;