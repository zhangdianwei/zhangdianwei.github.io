import { Vector3 } from "three";
import * as intersects from "intersects";

class TankShape {

    static Box = "Box";
    static Circle = "Circle";

    constructor(shapeType, param1) {
        this.shapeType = shapeType;
        if (shapeType == TankShape.Box) {
            this.size = param1;
        }
        else if (shapeType == TankShape.Circle) {
            this.radius = param1;
        }
    }

    get center() {
        return this._center;
    }
    set center(value) {
        this._center = value;
    }

    intersect(other) {
        if (this.shapeType == TankShape.Box && other.shapeType == TankShape.Box) {
            var x1 = this.center.x - this.size / 2;
            var y1 = this.center.z - this.size / 2;
            var w1 = this.size;
            var h1 = this.size;

            var x2 = other.center.x - other.size / 2;
            var y2 = other.center.z - other.size / 2;
            var w2 = other.size;
            var h2 = other.size;

            var intersected = intersects.boxBox(x1, y1, w1, h1, x2, y2, w2, h2);
            return intersected;
        }
        else if (this.shapeType == TankShape.Box && other.shapeType == TankShape.Circle) {
            var x1 = this.center.x - this.size / 2;
            var y1 = this.center.z - this.size / 2;
            var w1 = this.size;
            var h1 = this.size;

            var xc = other.center.x;
            var yc = other.center.z;
            var rc = other.radius;

            var intersected = intersects.boxCircle(x1, y1, w1, h1, xc, yc, rc);
            return intersected;
        }
        else if (this.shapeType == TankShape.Circle && other.shapeType == TankShape.Box) {
            var xc = this.center.x;
            var yc = this.center.z;
            var rc = this.radius;

            var x2 = other.center.x - other.size / 2;
            var y2 = other.center.z - other.size / 2;
            var w2 = other.size;
            var h2 = other.size;

            var intersected = intersects.circleBox(xc, yc, rc, x1, y1, w1, h1);
            return intersected;
        }
        else if (this.shapeType == TankShape.Circle && other.shapeType == TankShape.Circle) {
            var x1 = this.center.x;
            var y1 = this.center.z;
            var r1 = this.radius;

            var x2 = this.center.x;
            var y2 = this.center.z;
            var r2 = this.radius;

            var intersected = intersects.circleCircle(x1, y1, r1, x2, y2, r2);
            return intersected;
        }
    }
}

export default TankShape