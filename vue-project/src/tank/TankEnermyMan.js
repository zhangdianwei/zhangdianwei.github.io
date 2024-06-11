import { Vector3 } from "three";
import TankEnermy from "./TankEnermy"

class EnermyMan {
    init() {
        window.game.timer.tick(this.update.bind(this), 1.0);
        window.game.onAddController.push(this.onAddController.bind(this));
        window.game.onRemoveController.push(this.onRemoveController.bind(this));

        this.tanks = [];
        this.bornIndex = 0;
    }

    onAddController(controller) {
        if (controller instanceof TankEnermy) {
            this.tanks.push(controller);
        }
    }

    onRemoveController(controller) {
        if (controller instanceof TankEnermy) {
            TankHelper.removeArrayValue(this.tanks, controller);
        }
    }

    update({ delta, elapsed }) {

        if (this.tanks.length >= 1) {
            return;
        }

        this.makeEnermy();
    }

    makeEnermy() {
        var con = new TankEnermy();
        window.game.addController(con);
        con.init(this, this.bornIndex);

        this.bornIndex += 1;
        this.tanks.push(con);
    }
}

export default EnermyMan