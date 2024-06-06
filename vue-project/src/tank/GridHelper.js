import { Vector3 } from 'three'

class GridHelper {
    constructor(rows, cols, tileWidth, tileHeight) {
        this.rows = rows;
        this.cols = cols;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.tileCount = this.rows * this.cols;
    }

    getRCByIndex(index) {
        let rc = {};
        rc.r = Math.floor(index / this.cols);
        rc.c = index % this.cols;
        return rc;
    }
    getIndexByRC(r, c) {
        if (typeof (r) == 'object') {
            return r.r * this.rows + r.c;
        }
        else {
            return r * this.rows + c;
        }
    }
    getIndexByPosition(pos) {
        return getIndexByRC(getRCByPosition(pos));
    }

    getRCByPosition(pos) {
        let rc = {};
        rc.r = Math.floor((pos.z + 6.5) / 0.5);
        rc.c = Math.floor((pos.x + 6.5) / 0.5);
        return rc;
    }

    isIndexInTile(index) {
        return index >= 0 && index < this.tileCount;
    }

    isRCInTile(r, c) {
        if (typeof (r) == 'object') {
            r = r.r
            c = r.c
        }
        return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
    }

    getTile(r, c) {
        var index = getIndexByRC(r, c);
        return tankgame.tiles[index];
    }

    getPositionByRC(r, c) {
        if (typeof (r) == 'object') {
            r = r.r
            c = r.c
        }
        return new Vector3(c * 0.5 - 6.5, 0, -r * 0.5 + 6.5)
    }
}
export default GridHelper