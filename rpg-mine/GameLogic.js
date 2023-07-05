import { ThreeHelper } from "./ThreeHelper.js";

class GameLogic {
    constructor() {
        setInterval(this.onTick.bind(this), 0);
        window.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        window.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        window.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));

        this.cubeMaterialNormal = new THREE.MeshPhongMaterial({ color: 0x9AE765 });
        this.cubeMaterialActive = new THREE.MeshPhongMaterial({ color: 0xE7562E });

        window.controls.enabled = false;
    }

    startLevel(levelId) {
        this.levelId = levelId;

        this.loader = new ResLoader();
        this.loader.load(
            [
                { url: "res/rpg-mine.fbx", name: "mapscene" }
            ],
            null,
            this.onLoadFinish.bind(this)
        );
    }

    onLoadFinish() {
        while (root.children.length > 0) {
            root.remove(root.children[0]);
        }
        root.add(this.loader.mapscene);

        let Light = Helper.findChild(this.loader.mapscene, "Light");
        Light.intensity /= 2;
        Light.needsUpdate = true;

        this.Player = ThreeHelper.findChild(this.loader.mapscene, "Player");
        this.PlayerRC = this.getRCByObject(this.Player);
        this.Player.position.copy(this.getPositionByRC(this.PlayerRC));
        this.Plane = ThreeHelper.findChild(this.loader.mapscene, "Plane");

        this.loader.mapscene.children.forEach((x) => {
            console.log(x.name);
        });

        this.map = [];
        this.maxrc = { r: -1, c: -1 };
        let Cubes = ThreeHelper.findChild(this.loader.mapscene, "Cubes");
        Cubes.children.forEach((cube) => {
            let rc = this.getRCByPosition(ThreeHelper.getWorldPosition(cube));
            if (rc.r > this.maxrc.r) {
                this.maxrc.r = rc.r;
            }
            if (rc.c > this.maxrc.c) {
                this.maxrc.c = rc.c;
            }
            cube.material = this.cubeMaterialNormal;
            this.setMapItem(rc.r, rc.c, "cube", cube);
            cube.rc = rc;
        });

        // let cube = ThreeHelper.findChild(Cubes, "Cube");
        // console.log(cube.name, cube.position);

        this.touchingRC = null;
        this.walkingPaths = [];

        this.updateCamera();

    }

    onTick(dt) {
        // this.updateCamera();
    }

    updateCamera() {
        if (this.Player) {
            let camera_pos = new THREE.Vector3(this.Player.position.x, 10, this.Player.position.z + 5);
            let camera_target = new THREE.Vector3(camera_pos.x, 0, camera_pos.z - 10);
            window.camera.position.x = camera_pos.x;
            window.camera.position.y = camera_pos.y;
            window.camera.position.z = camera_pos.z;
            window.controls.target = camera_target;
            window.controls.update();
        }
    }

    onTouchStart(event) {
        console.log("onTouchStart");
    }
    onTouchEnd(event) {
        console.log("onTouchEnd");
    }
    onMouseDown(event) {
        if (event.buttons === 1) {
            let touchingRC = this.getRCByClientXY(event.clientX, event.clientY);
            if (touchingRC) {
                this.touchingRC = touchingRC;
                this.setMapItemActive(this.touchingRC.r, this.touchingRC.c, true);
            }
        }

    }
    onMouseMove(event) {
        if (event.buttons === 1) {

            console.log("onMouseMove", event.buttons);

            if (this.touchingRC) {
                this.setMapItemActive(this.touchingRC.r, this.touchingRC.c, false);
            }

            this.touchingRC = this.getRCByClientXY(event.clientX, event.clientY);
            if (this.touchingRC) {
                this.setMapItemActive(this.touchingRC.r, this.touchingRC.c, true);
            }
        }
    }
    onMouseUp(event) {
        console.log("onMouseUp");
        if (this.touchingRC) {
            this.setMapItemActive(this.touchingRC.r, this.touchingRC.c, false);
            this.walkToRC(this.touchingRC.r, this.touchingRC.c);
            this.touchingRC = null;
        }
    }
    getRCByClientXY(clientX, clientY) {
        if (!this.maxrc) {
            return null;
        }
        // 将鼠标位置转换为归一化设备坐标（NDC）
        const mouse = new THREE.Vector2();
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;

        // 创建射线
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        let intersects = raycaster.intersectObjects(scene.children);
        let inter = intersects.find((x) => x.object.rc);
        if (inter) {
            return inter.object.rc;
        }

        inter = intersects.find((x) => x.object === this.Plane);
        if (inter) {
            let ret = this.getRCByPosition(inter.point);
            if (this.isValidRC(ret.r, ret.c)) {
                return ret;
            }
        }
    }
    isValidRC(r, c) {
        return r >= 0 && r <= this.maxrc.r && c >= 0 && c <= this.maxrc.c;
    }
    getRCByPosition(position) {
        let r = Math.floor(-position.z);
        let c = Math.floor(position.x);
        return { r, c };
    }
    getRCByObject(object) {
        let world = ThreeHelper.getWorldPosition(object);
        return this.getRCByPosition(world);
    }
    getPositionByRC(r, c) {
        if (c === undefined) {
            c = r.c;
            r = r.r;
        }
        return new THREE.Vector3(c + 0.5, 0, -(r + 0.5));
    }
    getMapItem(r, c) {
        if (!this.map[r]) {
            this.map[r] = [];
        }
        if (!this.map[r][c]) {
            this.map[r][c] = {};
        }
        return this.map[r][c];
    }
    setMapItem(r, c, name, obj) {
        let mapitem = this.getMapItem(r, c);
        mapitem[name] = obj;
    }
    setMapItemActive(r, c, active) {
        let mapitem = this.getMapItem(r, c);
        if (mapitem.cube) {
            if (active) {
                mapitem.cube.material = this.cubeMaterialActive;
            }
            else {
                mapitem.cube.material = this.cubeMaterialNormal;
            }
        }
    }

    calcPath(from, to) {
        let ret = [];
        let cur = { r: from.r, c: from.c };
        while (true) {
            let rdiff = to.r - cur.r;
            let cdiff = to.c - cur.c;

            if (rdiff === 0 && cdiff === 0) {
                break;
            }
            else if (Math.abs(rdiff) >= Math.abs(cdiff)) {
                if (rdiff > 0) {
                    cur.r += 1;
                }
                else if (rdiff < 0) {
                    cur.r -= 1;
                }
            }
            else {
                if (cdiff > 0) {
                    cur.c += 1;
                }
                else if (cdiff < 0) {
                    cur.c -= 1;
                }
            }
            ret.push(ThreeHelper.copy(cur));
        }
        return ret;
    }

    walkToRC(r, c) {
        this.walkingPaths = this.calcPath(this.PlayerRC, { r, c });
        this.checkWalkOneStep();
    }

    checkWalkOneStep() {
        let startRC = this.getRCByObject(this.Player);
        let { r, c } = this.walkingPaths.shift();
        let startPos = this.Player.position;
        let endPos = this.getPositionByRC(r, c);
        let midPos = ThreeHelper.midPos(startPos, endPos);
        midPos.y = 1;

        const curve = new THREE.QuadraticBezierCurve3(
            startPos,
            midPos,
            endPos
        );

        let tween = new TWEEN.Tween(this.Player.position);
        tween.to(endPos, 500);
        tween.onUpdate((obj, ratio) => {
            let xy = curve.getPoint(ratio);
            this.Player.position.x = xy.x;
            this.Player.position.y = xy.y;
        });
        tween.onComplete(() => {
            this.onWalkOneStepFinish(r, c);
        });
        tween.start();
    }

    onWalkOneStepFinish(r, c) {
        console.log("onWalkStepFinish", r, c);

        this.PlayerRC.r = r;
        this.PlayerRC.c = c;

        let mapitem = this.getMapItem(r, c);
        if (mapitem.cube) {
            let targetPos = this.getPositionByRC(r, c);
            targetPos.y = -1;

            let cube = mapitem.cube;
            let tween = new TWEEN.Tween(cube.position);
            tween.to(targetPos, 500);
            tween.onComplete(() => {
                cube.parent.remove(cube);
            });
            tween.start();
            this.setMapItem(r, c, "cube", null);
        }

        if (this.walkingPaths.length === 0) {
            this.onWalkTotalFinish();
        }
        else {
            this.checkWalkOneStep();
        }
    }

    onWalkTotalFinish() {

    }
}
export { GameLogic }