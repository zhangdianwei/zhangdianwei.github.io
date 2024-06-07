import { Group, Vector3 } from 'three'
import TankHelper from './TankHelper'
import TankBullet from './TankBullet'

class TankPlayer {
    constructor() {
        this.speed = 2;

        this.lastShootTime = 0;
        this.shootDiff = 0.5;
        this.shootAcc = 0;

        game.timer.tick(this.update.bind(this));
    }

    createObject() {
        var obj = game.ResStore.tank_player_1.clone();
        obj.position.copy(game.rc.getPositionByRC(24, 9).add(new Vector3(-0.25, 0, +0.25)))
        return obj;
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
        this.checkMove({ delta, elapsed });
        this.checkShoot({ delta, elapsed });
    }
    checkMove({ delta, elapsed }) {
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
                var moveVector = TankHelper.getDirectionVector(direction).multiplyScalar(wantMoveLength)
                this.position.add(moveVector)
            }
        }
    }

    getDirection() {
        if (this.rotation.y == 0) {
            return TankHelper.Direction.Up;
        }
        else if (this.rotation.y == Math.PI) {
            return TankHelper.Direction.Down;
        }
        else if (this.rotation.y == -Math.PI / 2) {
            return TankHelper.Direction.Right;
        }
        else if (this.rotation.y == Math.PI / 2) {
            return TankHelper.Direction.Left;
        }
        else {
            return TankHelper.Direction.Up;
        }
    }

    checkShoot({ delta, elapsed }) {
        this.shootAcc += delta;
        if (this.shootAcc >= this.shootDiff && game.inputs['j']) {
            this.shootAcc = 0;
            this.doShoot();
        }
    }

    doShoot() {
        var bullet = new TankBullet();
        game.addController(bullet);
        var direction = this.getDirection();
        bullet.init(this.position, direction);
    }

    get position() {
        return this.obj.position;
    }

    get rotation() {
        return this.obj.rotation;
    }
}

export default TankPlayer