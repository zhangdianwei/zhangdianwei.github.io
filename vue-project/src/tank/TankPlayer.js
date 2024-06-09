import {
    Group, Vector3, SpotLight, Object3D, BoxGeometry
    , MeshBasicMaterial
    , Mesh
} from 'three'
import TankHelper from './TankHelper'
import TankBullet from './TankBullet'

class TankPlayer {
    constructor() {
        this.moveSpeed = 2;

        this.shootDiff = 0.1;
        this.shootAcc = 0;

        this.starCount = 0;

        this.bullets = [];

        game.timer.tick(this.update.bind(this));
    }

    maxBulletCount() {
        if (this.starCount <= 1) {
            return 1;
        }
        else {
            return 2;
        }
    }

    getBulletSpeed() {
        if (this.starCount <= 0) {
            return 4;
        }
        else {
            return 8;
        }
    }

    getBulletPower() {
        if (this.starCount == 0) {
            return 1;
        }
        else {
            return 2;
        }
    }

    createObject() {
        var obj = game.ResStore.tank_player_1.clone();

        this.lightTarget = new Object3D();
        obj.add(this.lightTarget);
        this.lightTarget.position.set(0, 0.5, -10);

        var spotLight = new SpotLight(0xffffff);
        spotLight.position.set(0, 0.5, -0.3);
        spotLight.castShadow = true;
        spotLight.target = this.lightTarget;
        spotLight.angle = Math.PI / 4;
        spotLight.intensity = 10;
        spotLight.penumbra = 0.2;
        // spotLight.distance = 10;
        obj.add(spotLight);
        this.spotLight = spotLight;

        // var geometry = new BoxGeometry(1, 1, 1); // 立方体的宽、高、深都是 1
        // var material = new MeshBasicMaterial({ color: 0x00ff00 });
        // var cube = new Mesh(geometry, material);
        // obj.add(cube);
        // cube.position.set(0, 0, 5)

        return obj;
    }

    init() {
        this.light = this.obj.children[0];
        window.light = this.light;

        game.onAddController.push(this.onAddController.bind(this));
        game.onRemoveController.push(this.onRemoveController.bind(this));
    }

    onRemove() {
        TankHelper.removeArrayValue(game.onAddController, this.onAddController.bind(this));
        TankHelper.removeArrayValue(game.onRemoveController, this.onRemoveController.bind(this));
    }

    onAddController(controller) {
        if (controller instanceof TankBullet) {
            this.bullets.push(controller);
        }
    }

    onRemoveController(controller) {
        if (controller instanceof TankBullet) {
            TankHelper.removeArrayValue(this.bullets, controller);
        }
    }

    get CollisionType() {
        return TankHelper.CollisionType.Player;
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
                var wantMoveLength = this.moveSpeed * delta;
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

    shootPressed() {
        return game.inputs['c'] || game.inputs['j'] || game.inputs['f']
    }

    checkShoot({ delta, elapsed }) {
        if (this.bullets.length >= this.maxBulletCount()) {
            return;
        }

        this.shootAcc += delta;
        if (!this.shootPressed()) {
            return;
        }

        if (this.shootAcc >= this.shootDiff) {
            this.shootAcc = 0;
            this.doShoot();
        }
    }

    doShoot() {
        var bullet = new TankBullet();
        game.addController(bullet);

        var startPos = this.position.clone().add(new Vector3(0, 0.5, 0));
        var direction = this.getDirection();
        bullet.speed = this.getBulletSpeed();
        bullet.power = this.getBulletPower();
        bullet.init(startPos, direction);
    }

    get position() {
        return this.obj.position;
    }

    get rotation() {
        return this.obj.rotation;
    }
}

export default TankPlayer