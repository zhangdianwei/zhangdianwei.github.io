import { Group, Vector3 } from 'three'

class TankEnermy {
    init(enermyMan, bornIndex) {
        this.enermyMan = enermyMan;
        this.bornIndex = bornIndex;

        this.obj.position.copy(this.getBornPos(this.bornIndex))
    }

    createObject() {
        var obj = window.game.ResStore.enermy1.clone();
        return obj;
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