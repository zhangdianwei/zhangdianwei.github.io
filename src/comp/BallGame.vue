<template>
    <audio src="ballgame/ball_bgm.mp3" id="ball_bgm" loop="true"></audio>
    <audio src="ballgame/ball_bomb.mp3" id="ball_bomb"></audio>
    <audio src="ballgame/ball_collect.mp3" id="ball_collect"></audio>
    <audio src="ballgame/ball_click.mp3" id="ball_click"></audio>
    <canvas ref="canvasRef" type="2d"></canvas>
</template>

<style scoped>
canvas {
    display: block;
    width: 100%;
    height: 100%;
}

.startlayer {
    z-index: 10;
    position: absolute;
    top: 0px;
    left: 0px;
}
</style>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const GameState = {
    Wait: "Wait",
    Play: "Play",
}

const canvasRef = ref(null)
let ctx = null
let background = null;
let objects = [];
let circle = null;
let squares = [];
let bound = {};
let emitAcc = 0;
let emitIndex = 0;
let score = 0;
let maxScore = 0;
let totalTime = 0;
let gameState = GameState.Wait;
let ball_collect = null;
let ball_bgm = null;
let ball_bomb = null;
let ball_click = null;

// 判断圆形和方形是否相交
function isIntersect(circle, square) {
    // 获取圆的中心点和半径
    const circleX = circle.x;
    const circleY = circle.y;
    const circleRadius = circle.radius;

    // 获取方形的位置和尺寸
    const squareX = square.x;
    const squareY = square.y;
    const squareWidth = square.width;
    const squareHeight = square.height;

    // 找到方形上最近的点
    let closestX = Math.max(squareX, Math.min(circleX, squareX + squareWidth));
    let closestY = Math.max(squareY, Math.min(circleY, squareY + squareHeight));

    // 计算圆心到最近点的距离
    let distanceX = circleX - closestX;
    let distanceY = circleY - closestY;
    let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

    // 如果距离小于等于圆的半径，则相交
    return distanceSquared <= (circleRadius * circleRadius);
}

// 查找所有与圆形相交的方形
function findIntersectingSquares(circle, squareList) {
    for (let square of squareList) {
        if (isIntersect(circle, square)) {
            return square;
        }
    }
    return null;
}

const BoxType = {
    Black: "Black",
    Red: "Red",
}

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

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 20;
        this.life = 1000;
        this.alpha = 100;
        this.color = `rgb(255,69,1,${this.alpha})`;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update(interval) {
        this.x = this.x + Math.cos(this.angle) * this.speed;
        this.y = this.y + Math.sin(this.angle) * this.speed;
        this.angle += Math.PI / 180; // Rotate the direction slightly
        this.speed *= 0.9; // Slowly decrease speed
        this.radius -= 1;
        if (this.radius < 0) {
            this.radius = 0
        }
        this.alpha -= Math.floor(interval / 1000 * 255);
        // this.color = `rgb(255,69,1,${this.alpha})`
        this.life -= interval;
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

        this.balls = [];
    }

    draw(ctx) {
        ctx.save();

        if (this.balls.length > 0) {
            this.drawBalls(ctx);
        }
        else {
            this.drawSelf(ctx);
        }

        ctx.restore();
    }

    update(interval) {
        if (this.balls.length > 0) {
            this.updateBalls(interval);
        }
        else if (this.updateSelf) {
            this.updateSelf(interval);
        }
    }

    drawSelf(ctx) {
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
    }

    blast() {
        let numBalls = 10;
        this.balls = [];
        for (let i = 0; i < numBalls; i++) {
            this.balls.push(new Ball(this.x, this.y));
        }
    }

    updateBalls(interval) {
        let shouldRemoves = []
        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];
            ball.update(interval);

            if (ball.life < 0) {
                shouldRemoves.push(ball);
            }
        }

        for (let i = 0; i < shouldRemoves.length; i++) {
            const ball = shouldRemoves[i];
            let index = this.balls.indexOf(ball);
            if (index >= 0) {
                this.balls.splice(index);
            }
        }
    }

    drawBalls(ctx) {
        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];
            ball.draw(ctx);
        }
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

function randRange(min, max) {
    return Math.random() * (max - min) + min;
}

function getSquareSpeedScale() {
    let calcTime = Math.min(totalTime, 60000)
    let ratio = calcTime / 60000 * 4 + 1;
    return ratio;
}

function checkEmitSquare(interval) {

    emitAcc += interval;

    if (emitAcc <= 2000) {
        return;
    }

    // if (squares.length > 0) {
    //     return;
    // }

    emitAcc = 0;

    let width = 60;
    let height = 60;
    let x = bound.centerX - width / 2 //+ randInt(-bound.width / 2, bound.width / 2);
    let y = bound.yMin;
    let obj = new RoundedRectConfig(x, y, width, height, 0);
    objects.push(obj);
    squares.push(obj);

    if (emitIndex == 2) {
        obj.boxType = BoxType.Red;
        obj.color = '#f6416c';
    }
    else {
        obj.boxType = BoxType.Black;
        obj.color = '#252a34';
    }
    emitIndex = (emitIndex + 1) % 3;

    let speedScale = getSquareSpeedScale();
    let speedX = randRange(-0.8, 0.8) * speedScale
    let speedY = 2 * speedScale
    obj.setVelocity(speedX, speedY)
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
        removeSquare(obj);
    }
}

function removeSquare(obj) {
    let index = squares.indexOf(obj);
    if (index >= 0) {
        squares.splice(index, 1);
    }

    index = objects.indexOf(obj);
    if (index >= 0) {
        objects.splice(index, 1);
    }
}

function checkCollision() {
    let square = findIntersectingSquares(circle, squares);
    if (square) {
        if (square.boxType === BoxType.Red) {
            score += 1;
            removeSquare(square);

            ball_collect.play();
        }
        else {
            initData();

            removeSquare(square);
            circle.blast();

            ball_bomb.play();

        }

        if (score > maxScore) {
            maxScore = score;
        }
    }
}

// 带描边的文字
function drawStrokedText(ctx, text, x, y, options = {}) {
    ctx.save();

    // 设置文字样式
    ctx.font = options.font || '52px Courier New';
    ctx.textAlign = options.align || 'center';
    ctx.textBaseline = options.baseline || 'center';

    // 设置描边
    ctx.strokeStyle = options.strokeColor || 'black';
    ctx.lineWidth = options.strokeWidth || 5;
    ctx.strokeText(text, x, y);

    // 设置填充
    ctx.fillStyle = options.fillColor || 'white';
    ctx.fillText(text, x, y);

    ctx.restore();
}

let lastFrameTickTime = 0;
const onFrameTick = () => {

    if (!ctx || !canvasRef.value) {
        return;
    }

    if (gameState == GameState.Play) {
        if (!lastFrameTickTime) {
            lastFrameTickTime = Date.now();
        }
        let now = Date.now();
        let interval = now - lastFrameTickTime;

        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            if (obj.update) {
                obj.update(interval);
            }
        }

        checkEmitSquare(interval);
        checkSquareAnim(interval);
        checkCollision(interval);

        lastFrameTickTime = now;
        totalTime += interval;
    }

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)

    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        obj.draw(ctx);
    }

    if (gameState == GameState.Wait) {
        drawStrokedText(ctx, `点击屏幕开始游戏`, bound.centerX, bound.yMax * 0.5)
    }

    drawStrokedText(ctx, `当前得分:${score}`, bound.centerX, bound.yMax * 0.75)
    drawStrokedText(ctx, `最高得分:${maxScore}`, bound.centerX, bound.yMax * 0.75 + 64)

    requestAnimationFrame(onFrameTick)
}

function onClick(event) {

    if (gameState == GameState.Wait) {
        gameState = GameState.Play;
        ball_collect.load();
        ball_bgm.load();
        ball_bomb.load();
        ball_click.load();
        ball_bgm.play();
        initData();
        onFrameTick();
    }
    else {
        // ball_bgm.play();
        // ball_bomb.play();
        // ball_collect.play();
        circle.speed = -circle.speed;
    }
}

// 鼠标事件处理
function handleMouseDown(event) {
    onClick();
    event.preventDefault();
}

function handleMouseMove(event) {
}

function handleMouseUp(event) {
}

// 触摸事件处理
function handleTouchStart(event) {
    onClick();
    event.preventDefault();
}

function handleTouchMove(event) {

    // 防止触发默认行为（如滚动）
    event.preventDefault();
}

function handleTouchEnd(event) {
    console.log('Touch end');
}

function initData() {
    emitAcc = 0;
    score = 0;
    totalTime = 0;
    emitIndex = 0;
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

    const centerX = canvasRef.value.width / 2
    const centerY = canvasRef.value.height / 2
    // background = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(centerX, centerY))
    background = ctx.createLinearGradient(0, 0, canvasRef.value.width, 0)
    background.addColorStop(0, '#71c9ce');
    background.addColorStop(0.5, '#8edbdf');
    background.addColorStop(1, '#71c9ce');

    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    ball_bgm = document.getElementById("ball_bgm");
    ball_collect = document.getElementById("ball_collect");
    ball_bomb = document.getElementById("ball_bomb");
    ball_click = document.getElementById("ball_click");

    gameState = GameState.Wait;
    initData();

    // bound
    {
        let width = bound.width;
        let height = bound.height;
        let x = centerX - width / 2;
        let y = centerY - height / 2;
        let obj = new RoundedRectConfig(x, y, width, height, 5);
        obj.color = '#A9A9A988';
        // objects.push(obj);
    }

    // 小球背景框
    let ballBgWidth = 0;
    let ballBgHeight = 0;
    {
        let width = bound.width * 0.6;
        let height = 60;
        let x = centerX - width / 2;
        let y = bound.yMax * 0.6;
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
        let y = bound.yMax * 0.6 + radius;
        let obj = new CircleConfig(x, y, radius);
        obj.color = '#FF4500';
        obj.speed = 300;
        obj.updateSelf = ((interval) => {
            obj.x += (obj.speed * interval / 1000);

            if (obj.x > x + ballBgWidth / 2 - radius) {
                obj.speed = -Math.abs(obj.speed);
            }
            else if (obj.x < x - ballBgWidth / 2 + radius) {
                obj.speed = Math.abs(obj.speed);
            }

            if (obj.x > bound.xMax) {
                obj.x = bound.xMin;
                obj.speed = Math.abs(obj.speed);
            }
            if (obj.x < bound.xMin) {
                obj.x = bound.xMax;
                obj.speed = -Math.abs(obj.speed);
            }
        }).bind(obj);
        objects.push(obj);

        circle = obj;
    }

    onFrameTick()
})

onUnmounted(() => {
    window.removeEventListener('resize', resizeCanvas)
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    ball_bgm.pause();
})
</script>


