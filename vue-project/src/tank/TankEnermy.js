import { Group, Vector3 } from 'three'
import TankHelper from './TankHelper'
import TankShape from './TankShape';

class TankEnermy {
    init(enermyMan, bornIndex) {
        this.enermyMan = enermyMan;
        this.bornIndex = bornIndex;

        this.obj.position.copy(this.getBornPos(this.bornIndex));

        this.shape = new TankShape(TankShape.Box, 1);
    }

    createObject() {
        var obj = window.game.ResStore.enermy1.clone();
        return obj;
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
}

export default TankEnermy;