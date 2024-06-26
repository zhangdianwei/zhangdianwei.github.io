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

        this.moveDirectAcc = 0;
        this.moveDirectMax = 3;
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
        // if (this.needLog) {
        //     console.log(`xxx`);
        // }
        var directions = [
            TankHelper.Direction.Up,
            TankHelper.Direction.Right,
            TankHelper.Direction.Down,
            TankHelper.Direction.Left,
        ];
        var moveLengths = [
            window.game.getCanMoveLength(this, TankHelper.Direction.Up),
            window.game.getCanMoveLength(this, TankHelper.Direction.Right),
            window.game.getCanMoveLength(this, TankHelper.Direction.Down),
            window.game.getCanMoveLength(this, TankHelper.Direction.Left),
        ]

        var index = moveLengths.findIndex((x) => x <= 0);
        while (index >= 0) {
            directions.splice(index, 1);
            moveLengths.splice(index, 1);

            index = moveLengths.findIndex((x) => x <= 0);
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
            this.moveDirectAcc = 0;
            this.moveDirectMax = 1000; TankHelper.randInt(1, 5);
        }

        this.checkMove({ delta });

        if (this.moveDirectAcc >= this.moveDirectMax) {
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
        // if (this.direction == TankHelper.Direction.Down && canMoveLength <= 0) {
        //     this.state = 0;
        //     this.needLog = true;
        // }
        if (canMoveLength > 0) {
            var wantMoveLength = this.moveSpeed * delta;
            if (wantMoveLength > canMoveLength) {
                wantMoveLength = canMoveLength;
            }

            var moveVector = TankHelper.getDirectionVector(this.direction).multiplyScalar(wantMoveLength)
            this.position.add(moveVector)

            this.moveDirectAcc += delta;


        }
        else {
            this.wantChangeDirection = true;
        }
    }
}

export default TankEnermy;