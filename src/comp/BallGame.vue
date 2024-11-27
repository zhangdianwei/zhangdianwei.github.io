<template>
    <canvas ref="canvasRef"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let ctx = null
let background = null;
let objects = [];
let squares = [];
let bound = {};
let emmitAcc = 0;

window.x = { ctx, background, objects, squares, bound, emmitAcc }

const SHAPE_TYPES = {
    ROUNDED_RECT: 'roundedRect',
    // 可以继续添加其他形状类型
    CIRCLE: 'circle',
    RECTANGLE: 'rectangle'
};

class RoundedRectConfig {
    constructor(x, y, width = 100, height = 50, radius = 10) {
        this.color = 'black';
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.radius = radius;

        // 旋转相关属性
        this.rotation = 0;
        this.rotationCenter = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };

        // 运动相关属性
        this.angle = 0; // 运动角度（弧度）
        this.speed = 0; // 速度大小
        this.velocity = { x: 0, y: 0 }; // 速度向量
    }

    // 设置旋转角度（角度制）
    setRotation(degrees) {
        this.rotation = degrees * Math.PI / 180;
        return this;
    }

    // 设置旋转中心点
    setRotationCenter(x, y) {
        this.rotationCenter = { x, y };
        return this;
    }

    // 设置以矩形中心为旋转中心
    setRotationCenterToMiddle() {
        this.rotationCenter = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
        return this;
    }

    // 设置运动角度（角度制）
    setAngle(degrees) {
        this.angle = degrees * Math.PI / 180;
        this._updateVelocity();
        return this;
    }

    // 设置速度大小
    setSpeed(speed) {
        this.speed = speed;
        this._updateVelocity();
        return this;
    }

    // 设置速度向量
    setVelocity(vx, vy) {
        this.velocity.x = vx;
        this.velocity.y = vy;
        // 根据速度向量更新角度和速度
        this.speed = Math.sqrt(vx * vx + vy * vy);
        this.angle = Math.atan2(vy, vx);
        return this;
    }

    // 更新位置
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        // 更新旋转中心
        if (this.rotationCenter) {
            this.rotationCenter.x += this.velocity.x;
            this.rotationCenter.y += this.velocity.y;
        }
        return this;
    }

    // 私有方法：更新速度向量
    _updateVelocity() {
        this.velocity.x = this.speed * Math.cos(this.angle);
        this.velocity.y = this.speed * Math.sin(this.angle);
    }

    // 获取当前角度（角度制）
    getAngleDegrees() {
        return this.angle * 180 / Math.PI;
    }

    // 获取当前旋转角度（角度制）
    getRotationDegrees() {
        return this.rotation * 180 / Math.PI;
    }

    // 根据速度方向自动设置旋转角度
    alignRotationWithMovement() {
        this.rotation = this.angle;
        return this;
    }

    draw(ctx) {
        ctx.save();

        // 应用旋转变换
        ctx.translate(this.rotationCenter.x, this.rotationCenter.y);
        ctx.rotate(this.rotation);
        ctx.translate(-this.rotationCenter.x, -this.rotationCenter.y);

        const { width, height, radius } = this;

        ctx.beginPath();
        ctx.moveTo(this.x + radius, this.y);
        ctx.lineTo(this.x + width - radius, this.y);
        ctx.arcTo(this.x + width, this.y, this.x + width, this.y + radius, radius);
        ctx.lineTo(this.x + width, this.y + height - radius);
        ctx.arcTo(this.x + width, this.y + height, this.x + width - radius, this.y + height, radius);
        ctx.lineTo(this.x + radius, this.y + height);
        ctx.arcTo(this.x, this.y + height, this.x, this.y + height - radius, radius);
        ctx.lineTo(this.x, this.y + radius);
        ctx.arcTo(this.x, this.y, this.x + radius, this.y, radius);
        ctx.closePath();

        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.restore();
    }
}



class CircleConfig {
    constructor(x, y, radius = 50) {
        this.color = 'black';
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.rotation = 0;
        this.rotationCenter = { x: this.x, y: this.y };
        this.startAngle = 0;
        this.endAngle = Math.PI * 2;
        this.counterclockwise = false;

        // 新增阴影和渐变相关属性
        this.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.shadowBlur = 10;
        this.shadowOffsetX = 3;
        this.shadowOffsetY = 3;
        this.useGradient = true;
        this.highlightColor = 'rgba(255, 255, 255, 0.8)';
        this.shadowCenter = 'rgba(0, 0, 0, 0.2)';
    }

    // ... 保持其他现有方法不变 ...

    draw(ctx) {
        ctx.save();

        // 应用阴影
        ctx.shadowColor = this.shadowColor;
        ctx.shadowBlur = this.shadowBlur;
        ctx.shadowOffsetX = this.shadowOffsetX;
        ctx.shadowOffsetY = this.shadowOffsetY;

        // 应用旋转变换
        ctx.translate(this.rotationCenter.x, this.rotationCenter.y);
        ctx.rotate(this.rotation);
        ctx.translate(-this.rotationCenter.x, -this.rotationCenter.y);

        // 创建渐变
        if (this.useGradient) {
            const gradient = ctx.createRadialGradient(
                this.x - this.radius * 0.3, // 高光中心点 X
                this.y - this.radius * 0.3, // 高光中心点 Y
                this.radius * 0.1, // 内圆半径
                this.x,
                this.y,
                this.radius
            );

            // 添加渐变色标
            gradient.addColorStop(0, this.highlightColor);
            gradient.addColorStop(0.1, this.color);
            gradient.addColorStop(0.9, this.color);
            gradient.addColorStop(1, this.shadowCenter);

            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = this.color;
        }

        // 绘制主圆形
        ctx.beginPath();
        ctx.arc(
            this.x,
            this.y,
            this.radius,
            this.startAngle,
            this.endAngle,
            this.counterclockwise
        );
        ctx.fill();

        ctx.restore();
    }

    // 设置阴影
    setShadow(color, blur, offsetX, offsetY) {
        this.shadowColor = color;
        this.shadowBlur = blur;
        this.shadowOffsetX = offsetX;
        this.shadowOffsetY = offsetY;
        return this;
    }

    // 设置渐变颜色
    setGradientColors(mainColor, highlightColor, shadowColor) {
        this.color = mainColor;
        this.highlightColor = highlightColor;
        this.shadowCenter = shadowColor;
        return this;
    }

    // 启用/禁用渐变
    setUseGradient(value) {
        this.useGradient = value;
        return this;
    }
}

const resizeCanvas = () => {
    if (canvasRef.value) {
        canvasRef.value.width = window.innerWidth
        canvasRef.value.height = window.innerHeight
    }
}

// [min,max)
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function checkEmmitSquare(interval) {
    emmitAcc += interval;

    if (emmitAcc <= 2000) {
        return;
    }

    if (squares.length > 0) {
        return;
    }

    emmitAcc = 0;

    let width = 60;
    let height = 60;
    let x = bound.centerX + randInt(-bound.width / 2, bound.width / 2);
    let y = bound.yMin;
    let obj = new RoundedRectConfig(x, y, width, height, 0);
    obj.color = 'black';
    objects.push(obj);
    squares.push(obj);

    obj.setVelocity(1, 1);
}

function checkSquareAnim() {
    let shouldRemoves = [];

    for (let i = 0; i < squares.length; i++) {
        const obj = squares[i];
        let angle = obj.getRotationDegrees() + 2;
        obj.setRotation(angle);

        if (obj.y > bound.yMax) {
            shouldRemoves.push(obj);
        }
    }

    for (let i = 0; i < shouldRemoves.length; i++) {
        const obj = shouldRemoves[i];

        let index = squares.indexOf(obj);
        if (index >= 0) {
            squares.splice(index, 1);
        }

        index = objects.indexOf(obj);
        if (index >= 0) {
            objects.splice(index, 1);
        }
    }
}

function checkCollision() {
    // if (squares.length > 1) {
    //     let obj = squares.shift();
    //     let index = objects.indexOf(obj);
    //     if (index >= 0) {
    //         objects.splice(index, 1);
    //     }
    // }
}

let lastFrameTickTime = 0;
const onFrameTick = () => {
    if (!ctx) return;
    if (!canvasRef.value) return;

    if (!lastFrameTickTime) {
        lastFrameTickTime = Date.now();
    }
    let now = Date.now();
    let interval = now - lastFrameTickTime;

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)

    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (obj.update) {
            obj.update(interval);
        }
    }

    checkEmmitSquare(interval);
    checkSquareAnim(interval);
    checkCollision(interval);

    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        obj.draw(ctx);
    }

    lastFrameTickTime = now;

    requestAnimationFrame(onFrameTick)
}

onMounted(() => {
    ctx = canvasRef.value.getContext('2d')

    resizeCanvas()

    bound.width = 600;
    bound.height = canvasRef.value.height;
    bound.centerX = canvasRef.value.width / 2;
    bound.centerY = canvasRef.value.height / 2;
    bound.xMin = bound.centerX - bound.width / 2;
    bound.xMax = bound.centerX + bound.width / 2;
    bound.yMin = bound.centerY - bound.height / 2;
    bound.yMax = bound.centerY + bound.height / 2;
    console.log(bound);


    const centerX = canvasRef.value.width / 2
    const centerY = canvasRef.value.height / 2
    background = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(centerX, centerY))
    background.addColorStop(0, '#164e63');
    background.addColorStop(1, '#155e75');

    window.addEventListener('resize', resizeCanvas)

    // bound
    {
        let width = bound.width;
        let height = bound.height;
        let x = centerX - width / 2;
        let y = centerY - height / 2;
        let obj = new RoundedRectConfig(x, y, width, height, 5);
        obj.color = '#A9A9A988';
        objects.push(obj);
    }

    // 小球背景框
    let ballBgWidth = 0;
    let ballBgHeight = 0;
    {
        let width = bound.width / 2;
        let height = 60;
        let x = centerX - width / 2;
        let y = centerY - height / 2;
        let obj = new RoundedRectConfig(x, y, width, height, height / 2);
        obj.color = '#A9A9A9';
        objects.push(obj);

        ballBgWidth = width;
        ballBgHeight = height;
    }

    // 小球
    {
        let radius = 30;
        let x = centerX;
        let y = centerY;
        let obj = new CircleConfig(x, y, radius);
        obj.color = '#FF4500';
        let speed = 0;
        obj.update = (() => {
            obj.x += speed;

            if (obj.x > x + ballBgWidth / 2 - radius) {
                speed = -speed;
            }
            else if (obj.x < x - ballBgWidth / 2 + radius) {
                speed = -speed;
            }
        }).bind(obj);
        objects.push(obj);
    }

    onFrameTick()
})

onUnmounted(() => {
    window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
canvas {
    display: block;
    width: 100%;
    height: 100%;
}
</style>