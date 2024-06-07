import { Group, Vector3 } from 'three'
import TankHelper from './TankHelper'

class TankPlayer {
    constructor() {
        this.obj = this.createObject();
        this.speed = 2;
    }

    createObject() {
        var obj = game.ResStore.tank_player_1.clone();
        game.tileRoot.add(obj);
        obj.position.set(-5.25, 0, -4.75)
        obj.position.copy(game.rc.getPositionByRC(24, 9).add(new Vector3(-0.25, 0, +0.25)))
        return obj;
    }

    getDirectionVector(direction) {
        const Direction2Vectors = [
            null,
            new Vector3(0, 0, -1),
            new Vector3(1, 0, 0),
            new Vector3(0, 0, 1),
            new Vector3(-1, 0, 0),
        ];
        var vec = Direction2Vectors[direction];
        if (!vec) {
            return null;
        } else {
            return vec.clone();
        }
    }

    getMoveRotation(direction) {
        const Direction2Rotation = [
            0,
            0,
            -Math.PI / 2,
            Math.PI,
            Math.PI / 2,
        ]
        return Direction2Rotation[direction];
    }

    update({ delta, elapsed }) {
        var direction = game.getMoveDirection();
        if (direction) {
            var moveRotation = this.getMoveRotation(direction);
            if (moveRotation != this.rotation.y) {
                this.rotation.y = moveRotation;
                TankHelper.formatNum(this.position, 0.25)
            }

            var canMoveLength = game.getCanMoveLength(direction);
            if (canMoveLength > 0) {
                var wantMoveLength = this.speed * delta;
                if (wantMoveLength > canMoveLength) {
                    wantMoveLength = canMoveLength;
                }
                var moveVector = this.getDirectionVector(direction).multiplyScalar(wantMoveLength)
                this.position.add(moveVector)
            }
        }
    }

    get position() {
        return this.obj.position;
    }

    get rotation() {
        return this.obj.rotation;
    }
}

export default TankPlayer