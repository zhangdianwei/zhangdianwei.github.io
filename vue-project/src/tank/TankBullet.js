import TankHelper from "./TankHelper";

class TankBullet {
    constructor() {
        this.speed = 4;
        this.power = 1;

        game.timer.tick(this.update.bind(this))
    }

    createObject() {
        var obj = game.ResStore.bullet_player.clone();
        return obj;
    }

    get CollisionType() {
        return TankHelper.CollisionType.Bullet;
    }

    init(pos, direction) {
        this.obj.position.copy(pos);
        this.direction = direction;
    }

    onRemove() {

    }

    update({ delta, elapsed }) {
        var wantMoveLength = this.speed * delta;
        var moveVector = TankHelper.getDirectionVector(this.direction).multiplyScalar(wantMoveLength)
        this.obj.position.add(moveVector)
    }
}

export default TankBullet