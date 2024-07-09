import TankHelper from "./TankHelper";
import { Vector3 } from "three";
import TankShape from './TankShape';

class TankBullet {
    constructor() {
        this.obj = this.createObject();

        this.speed = 4;
        this.power = 1;

        game.timer.tick(this.update.bind(this))

        this.shape = new TankShape(TankShape.Circle, 0.15);
    }

    createObject() {
        var obj = game.ResStore.bullet_player.clone();
        return obj;
    }

    get CampType() {
        return TankHelper.CampType.Player;
    }

    get ObjectType() {
        return TankHelper.ObjectType.Bullet;
    }

    get Shape() {
        this.shape.center = this.obj.position;
        return this.shape;
    }

    init(tank) {
        this.tank = tank;

        var startPos = tank.position.clone().add(new Vector3(0, 0.5, 0));
        this.obj.position.copy(startPos);
        this.direction = tank.getDirection();
        this.speed = this.initBulletSpeed();
        this.canHitTileTypes = this.initCanHitTileTypes();
        this.power = this.initPower();
    }

    initBulletSpeed() {
        if (this.tank.starCount <= 0) {
            return 4;
        }
        else {
            return 8;
        }
    }

    initPower() {
        if (this.tank.starCount <= 2) {
            return 1;
        }
        else {
            return 2;
        }
    }

    initCanHitTileTypes() {
        var ret = [];
        ret.push(TankHelper.TileType.Home);
        ret.push(TankHelper.TileType.Brick);
        if (this.tank.getStarCount() >= 3) {
            ret.push(TankHelper.TileType.Iron);
        }
        return ret;
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