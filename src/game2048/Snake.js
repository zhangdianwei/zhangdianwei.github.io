import * as PIXI from 'pixi.js';
import Cube from './Cube.js';

export default class Snake extends PIXI.Container {
    /**
     * 构造函数
     * @param {Array<Object>} initialCubesData - 初始Cubes的数据数组, e.g., [{value: 2, x:0, y:0}, ...]
     * @param {number} segmentLength - 相邻Cube中心之间的期望距离
     */
    constructor(initialCubesData = [], segmentLength = 50, speed = 3) {
        super();

        this.cubes = [];
        this.segmentLength = segmentLength; // Cube中心之间的期望距离
        this.speed = speed; // 蛇的整体移动速度，会传递给其Cubes

        initialCubesData.forEach(data => {
            this.addCube(data.value, data.x, data.y);
        });
    }

    /**
     * 向蛇尾添加一个新的Cube
     * @param {number} value - Cube的数值
     * @param {number} [x=0] - Cube的初始x坐标 (相对于Snake容器)
     * @param {number} [y=0] - Cube的初始y坐标 (相对于Snake容器)
     * @returns {Cube} 新创建的Cube实例
     */
    addCube(value, x = 0, y = 0) {
        // 如果蛇已有Cube，新Cube的初始位置应基于最后一个Cube
        if (this.cubes.length > 0) {
            const lastCube = this.cubes[this.cubes.length - 1];
            // 简单地放置在最后一个Cube的后方一点，具体位置会在update中调整
            // 可以根据lastCube的旋转和segmentLength来更精确地定位
            x = lastCube.x - Math.cos(lastCube.rotation) * this.segmentLength;
            y = lastCube.y - Math.sin(lastCube.rotation) * this.segmentLength;
        }
        
        const newCube = new Cube(value, x, y);
        newCube.speed = this.speed; // 将Snake的速度赋予新创建的Cube
        this.cubes.push(newCube);
        this.addChild(newCube); // 将Cube添加到PIXI的Container中以便渲染
        this.updateCubeZOrder();
        return newCube;
    }

    /**
     * 获取蛇头的Cube
     * @returns {Cube|null}
     */
    get head() {
        return this.cubes.length > 0 ? this.cubes[0] : null;
    }

    /**
     * 更新蛇的逻辑（主要处理身体部分的跟随）
     * 蛇头(this.cubes[0])的位置和旋转应该在此方法调用前由外部逻辑更新。
     * @param {number} deltaTime - 帧间时间差
     */
    updateSnakeLogic(deltaTime) {
        if (this.cubes.length < 2) {
            return; // 如果少于2个Cube，则无需执行跟随逻辑
        }

        // 从第二个Cube开始，让其跟随前一个Cube
        for (let i = 1; i < this.cubes.length; i++) {
            const currentCube = this.cubes[i];
            const leaderCube = this.cubes[i - 1];

            // 计算当前Cube到其引导者Cube的向量和距离
            const dx = leaderCube.x - currentCube.x;
            const dy = leaderCube.y - currentCube.y;
            const distanceToLeader = Math.sqrt(dx * dx + dy * dy);

            // 更新当前Cube的旋转，使其朝向引导者
            if (distanceToLeader > 0.01) { // 避免dx, dy都为0时atan2输出0
                currentCube.rotation = Math.atan2(dy, dx);
            }

            // 根据距离调整位置
            if (distanceToLeader > this.segmentLength) {
                // 当前Cube离引导者太远，需要靠近
                // 计算本帧可以移动的距离 和 想要缩短的距离
                const moveCapacity = currentCube.speed * deltaTime;
                const desiredGapReduction = distanceToLeader - this.segmentLength;
                const actualMoveDistance = Math.min(moveCapacity, desiredGapReduction);

                if (distanceToLeader > 0.01) { // 再次检查以避免除以零
                    currentCube.x += (dx / distanceToLeader) * actualMoveDistance;
                    currentCube.y += (dy / distanceToLeader) * actualMoveDistance;
                }
            } else if (distanceToLeader < this.segmentLength && distanceToLeader > 0.01) {
                // 当前Cube离引导者太近，需要推开
                // 直接将其放置在与引导者保持segmentLength距离的位置
                currentCube.x = leaderCube.x - (dx / distanceToLeader) * this.segmentLength;
                currentCube.y = leaderCube.y - (dy / distanceToLeader) * this.segmentLength;
            } else if (distanceToLeader <= 0.01 && i > 0) {
                // Cube与引导者在同一位置，将其放置在引导者后方
                // （基于引导者的旋转方向，假设其rotation是前进方向）
                currentCube.x = leaderCube.x - Math.cos(leaderCube.rotation) * this.segmentLength;
                currentCube.y = leaderCube.y - Math.sin(leaderCube.rotation) * this.segmentLength;
                // 也可以简单地给一个小的固定偏移，如 currentCube.x -= this.segmentLength;
            }
        }
    }

    // 未来可能需要的其他方法：
    // removeCube(cubeInstanceOrIndex) {}
    // getAllCubeValues() {}
    // setAllCubesSpeed(newSpeed) {}

    /**
     * 刷新所有cube的显示层级，保证前面的cube在上层，后面的在下层
     * 应在每帧逻辑后调用
     */
    updateCubeZOrder() {
        for (let i = 0; i < this.cubes.length; i++) {
            this.setChildIndex(this.cubes[i], this.cubes.length - 1 - i);
        }
    }
}
