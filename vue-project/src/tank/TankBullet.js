import TankHelper from "./TankHelper";

class TankBullet {
    constructor() {
        this.obj = this.createObject();
        this.speed = 4;

        game.timer.tick(this.update.bind(this))
    }

    createObject() {
        var obj = game.ResStore.bullet_player.clone();
        game.tileRoot.add(obj);
        return obj;
    }

    init(pos, direction) {
        this.obj.position.copy(pos);
        this.direction = direction;
    }

    update({ delta, elapsed }) {
        var wantMoveLength = this.speed * delta;
        var moveVector = TankHelper.getDirectionVector(this.direction).multiplyScalar(wantMoveLength)
        this.obj.position.add(moveVector)
    }
}

export default TankBullet