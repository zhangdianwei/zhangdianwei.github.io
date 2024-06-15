import { Vector3 } from "three";
import TankEnermy from "./TankEnermy"
import TankHelper from "./TankHelper"

class EnermyMan {
    constructor() {
        this.tanks = [];

        this.bornIndex = 0;
        this.bornTime = {};

        this.totalCount = 20;
        this.destroyCount = 0;

        console.log(`EnermyMan`);
    }

    start() {
        window.game.timer.tick(this.update.bind(this), 1.0);
        window.game.onAddController.push(this.onAddController.bind(this));
        window.game.onRemoveController.push(this.onRemoveController.bind(this));
    }

    dispose() {
        window.game.timer.untick(this.update.bind(this));
        TankHelper.removeArrayValue(window.game.onAddController, this.onAddController.bind(this));
        TankHelper.removeArrayValue(window.game.onRemoveController, this.onRemoveController.bind(this));
    }

    onAddController(controller) {
        if (controller instanceof TankEnermy) {
            this.tanks.push(controller);
        }
    }

    onRemoveController(controller) {
        if (controller instanceof TankEnermy) {
            TankHelper.removeArrayValue(this.tanks, controller);

            this.destroyCount += 1;
        }
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

    isEmptyBorn() {
        var bornTime = this.bornTime[this.bornIndex] || 0;
        return Date.now() - bornTime > 2000;
    }

    update({ delta, elapsed }) {

        while (this.tanks.length < 5) {
            if (this.isEmptyBorn()) {
                this.makeEnermy();
            }
            else {
                break;
            }
        }

    }

    makeEnermy() {
        var tankType = TankHelper.randInt(0, 3);
        var con = new TankEnermy(this, this.bornIndex, tankType);
        window.game.addController(con);
        TankHelper.makeTweenTankAppear(con.obj, con.onAppearFinish.bind(con));

        this.bornTime[this.bornIndex] = Date.now();
        this.bornIndex += 1;
        this.bornIndex = this.bornIndex % 3;
    }
}

export default EnermyMan