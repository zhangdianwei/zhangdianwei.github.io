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
}

export default RCHelper;