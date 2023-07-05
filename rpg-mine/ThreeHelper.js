class ThreeHelper {
    // obj: THREE.Object
    // name_pattern: "xx/yy/zz"
    static findChild(object, name_pattern) {
        let names = name_pattern.split("/");
        let obj = object;

        while (true) {
            let ret = obj.children.find((x) => x.name === names[0]);
            if (ret) {
                if (names.length > 1) {
                    obj = ret;
                    names.shift();
                }
                else {
                    return ret;
                }
            }
            else {
                break;
            }
        }

        return null;
    }

    static getWorldPosition(object) {
        let world = new THREE.Vector3();
        return object.getWorldPosition(world);
    }

    static copy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    static midPos(point1, point2) {
        let midpoint = new THREE.Vector3();
        midpoint.addVectors(point1, point2); // 将两个坐标相加
        midpoint.divideScalar(2); // 除以2求平均值
        return midpoint;
    }
}

export { ThreeHelper }