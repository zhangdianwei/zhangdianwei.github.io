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
        this.cubeColorNormal = 0x9AE765;
        this.cubeColorActive = 0xE7562E;

        window.controls.enabled = false;
    }

    startLevel(levelId) {
        this.levelId = levelId;

        this.loader = new ResLoader();
        this.loader.load(
            [
                { url: `res/map${levelId + 1}.fbx`, name: "mapscene" }
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

        this.map = [];
        this.maxrc = { r: 0, c: 0 };
        this.touchingRC = null;
        this.walkingPath = [];

        this.loader.mapscene.children.forEach((child) => {
            if (child.name.startsWith("m_")) {
                this[child.name] = child;
            }
            else if (child.name.startsWith("Cube")) {
                let rc = this.getRCByPosition(child.position);
                this.maxrc.r = Math.max(this.maxrc.r, rc.r);
                this.maxrc.c = Math.max(this.maxrc.c, rc.c);
                child.material = this.cubeMaterialNormal;
                this.setMapItem(rc.r, rc.c, "cube", child);
                child.rc = rc;
            }
        });

        this.m_Light.intensity /= 2;
        this.m_Light.needsUpdate = true;

        this.PlayerRC = this.getRCByObject(this.m_Player);
        this.m_Player.position.copy(this.getPositionByRC(this.PlayerRC));

        this.TargetFlagRC = this.getRCByObject(this.m_TargetFlag);
        this.m_TargetFlag.position.copy(this.getPositionByRC(this.TargetFlagRC));

        this.updateCamera();

    }

    onTick(dt) {
        // this.updateCamera();
    }

    updateCamera() {
        if (this.m_Player) {
            let camera_pos = new THREE.Vector3(this.m_Player.position.x, 10, this.m_Player.position.z + 5);
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
                this.touchingPath = this.calcPath(this.PlayerRC, this.touchingRC);
                this.setPathActive(this.touchingPath, true);
            }
        }
    }
    onMouseMove(event) {
        if (event.buttons === 1) {

            console.log("onMouseMove", event.buttons);

            this.setPathActive(this.touchingPath, false);
            this.touchingPath = [];

            let touchingRC = this.getRCByClientXY(event.clientX, event.clientY);
            if (touchingRC) {
                this.touchingRC = touchingRC;
                this.touchingPath = this.calcPath(this.PlayerRC, this.touchingRC);
                this.setPathActive(this.touchingPath, true);
            }
        }
    }
    onMouseUp(event) {
        console.log("onMouseUp");

        if (this.touchingRC) {
            this.touchingRC = null;
            this.setPathActive(this.touchingPath, false);
            this.walkingPath = this.touchingPath;
            this.touchingPath = [];

            if (!this.tween_playerMove) {
                this.checkWalkOneStep();
            }
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

        inter = intersects.find((x) => x.object === this.m_Plane);
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
    setPathActive(path, active) {
        path.forEach((rc) => {
            this.setMapItemActive(rc.r, rc.c, active);
        });
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
        this.walkingPath = this.calcPath(this.PlayerRC, { r, c });
        if (!this.tween_playerMove) {
            this.checkWalkOneStep();
        }
    }

    checkWalkOneStep() {
        if (this.walkingPath.length == 0) {
            return;
        }

        let startRC = this.getRCByObject(this.m_Player);
        let { r, c } = this.walkingPath.shift();
        let startPos = this.m_Player.position;
        let endPos = this.getPositionByRC(r, c);
        let midPos = ThreeHelper.midPos(startPos, endPos);
        midPos.y = 1;

        const curve = new THREE.QuadraticBezierCurve3(
            startPos,
            midPos,
            endPos
        );

        let tween_playerMove = new TWEEN.Tween(this.m_Player.position);
        tween_playerMove.to(endPos, 300);
        tween_playerMove.onUpdate((obj, ratio) => {
            let xy = curve.getPoint(ratio);
            this.m_Player.position.x = xy.x;
            this.m_Player.position.y = xy.y;
        });
        tween_playerMove.onComplete(() => {
            this.tween_playerMove = null;
            this.onWalkOneStepFinish(r, c);
        });

        let mapitem = this.getMapItem(r, c);
        let cube = mapitem.cube;
        let tween_cubeMove = null;
        if (cube) {
            let targetPos = new THREE.Vector3();
            targetPos.x = cube.position.x;
            targetPos.y = cube.position.y - 1;
            targetPos.z = cube.position.z;

            tween_cubeMove = new TWEEN.Tween(cube.position);
            tween_cubeMove.to(targetPos, 500);
            tween_cubeMove.onComplete(() => {
                cube.parent.remove(cube);
            });
            tween_cubeMove.delay(250);
            this.setMapItem(r, c, "cube", null);
        }

        this.PlayerRC.r = r;
        this.PlayerRC.c = c;

        tween_playerMove.start();
        if (tween_cubeMove) {
            tween_cubeMove.start();
        }

        this.tween_playerMove = tween_playerMove;
    }

    onWalkOneStepFinish(r, c) {
        console.log("onWalkStepFinish", r, c);

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

        if (this.walkingPath.length === 0) {
            this.onWalkTotalFinish();
        }
        else {
            this.checkWalkOneStep();
        }
    }

    onWalkTotalFinish() {

    }

    createCube() {
        let geometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.1);
        geometry.translate(0, 0.5, 0);
        let mesh = new THREE.Mesh(geometry, this.cubeMaterialNormal);
        return mesh;
    }
}
export { GameLogic }