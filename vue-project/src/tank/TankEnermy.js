import { Group, Vector3 } from 'three'
import TankHelper from './TankHelper'
import TankShape from './TankShape';

class TankEnermy {
    constructor(enermyMan, bornIndex, tankType) {
        this.enermyMan = enermyMan;
        this.bornIndex = bornIndex;
        this.tankType = tankType;

        this.obj = this.createObject();

        this.obj.position.copy(this.getBornPos(this.bornIndex));
        this.obj.rotation.y = TankHelper.getDirectionRotation(TankHelper.Direction.Down);

        this.state = 0; //0=appear; 1=run;

        this.shape = new TankShape(TankShape.Box, 1);

        this.moveSpeed = this.getSpeedTemplate();
        this.blood = this.getBloodTemplate();
        this.direction = this.getRandDirection();

        this.moveAcc = 0;
    }

    get position() {
        return this.obj.position;
    }

    get rotation() {
        return this.obj.rotation;
    }

    createObject() {
        var res = window.game.ResStore[`enermy${this.tankType + 1}`];
        var obj = res.clone();
        return obj;
    }

    getSpeedTemplate() {
        var configs = [2, 3, 4, 2];
        return configs[this.tankType];
    }

    getBloodTemplate() {
        var configs = [1, 2, 1, 4];
        return configs[this.tankType];
    }

    getRandDirection() {
        var directions = [1, 2, 3, 4];
        var moveLengths = [
            window.game.getCanMoveLength(this, TankHelper.Direction.Up),
            window.game.getCanMoveLength(this, TankHelper.Direction.Down),
            window.game.getCanMoveLength(this, TankHelper.Direction.Left),
            window.game.getCanMoveLength(this, TankHelper.Direction.Right),
        ]
        for (let i = 0; i < 4; i++) {
            if (moveLengths[i] <= 0) {
                directions.splice(i, 1);
                moveLengths.splice(i, 1);
            }
        }

        if (directions.length > 0) {
            return TankHelper.randSplice(directions);
        }
        return TankHelper.Direction.Down;
    }

    onAppearFinish() {
        this.state = 1;
    }

    get CampType() {
        return TankHelper.CampType.Enermy;
    }

    get ObjectType() {
        return TankHelper.ObjectType.Tank;
    }

    get Shape() {
        this.shape.center = this.obj.position;
        return this.shape;
    }

    getBornPos(index) {
        index = index % 3;
        if (index == 0) {
            return window.game.rc.getPositionByRC(0, 0).add(new Vector3(0.25, 0, 0.25));
        }
        else if (index == 1) {
            return window.game.rc.getPositionByRC(0, 12).add(new Vector3(0.25, 0, 0.25));
        }
        else if (index == 2) {
            return window.game.rc.getPositionByRC(0, 24).add(new Vector3(0.25, 0, 0.25));
        }
    }

    ITank_update({ delta }) {
        if (this.state == 0) {
            return;
        }

        if (this.wantChangeDirection) {
            this.direction = this.getRandDirection();
            this.wantChangeDirection = false;
            this.moveAcc = 0;
        }

        this.checkMove({ delta });

        if (this.moveAcc > 2) {
            this.wantChangeDirection = true;
        }
    }

    checkMove({ delta }) {
        var moveRotation = TankHelper.getDirectionRotation(this.direction);
        if (moveRotation != this.rotation.y) {
            this.rotation.y = moveRotation;
            TankHelper.formatNum(this.position, 0.25)
        }

        var canMoveLength = game.getCanMoveLength(this, this.direction);
        if (canMoveLength > 0) {
            var wantMoveLength = this.moveSpeed * delta;
            if (wantMoveLength > canMoveLength) {
                wantMoveLength = canMoveLength;
            }

            var moveVector = TankHelper.getDirectionVector(this.direction).multiplyScalar(wantMoveLength)
            this.position.add(moveVector)

            this.moveAcc += delta;
        }
        else {
            this.wantChangeDirection = true;
        }
    }
}

export default TankEnermy;