<template>
    <div class="game-container">
        <canvas ref="pixiContainer"></canvas>
    </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { initDom, createPixi } from '../pixi/PixiHelper';
import { PixiPlugin } from "gsap/PixiPlugin";

// 关卡配置
const AllLevelConfig = [
    {
        name: "新手村",
        targetScore: 5,
        path: {
            type: "line",
            start: { x: 0.1, y: 0.7 },
            end: { x: 0.9, y: 0.7 },
            width: 0.06
        },
        obstacles: {
            interval: 2000,
            types: ["hankey", "hankey", "bomb"] // 70% 狗屎, 30% 炸弹
        },
        playerSpeed: 0.006
    },
    {
        name: "弯道挑战",
        targetScore: 8,
        path: {
            type: "arc",
            center: { x: 0.5, y: 0.7 },
            radiusX: 0.4, // 左右半径更大
            radiusY: 0.15, // 上下半径更小，使弧度更扁平
            startAngle: 0,
            endAngle: Math.PI,
            width: 0.06
        },
        obstacles: {
            interval: 1800,
            types: ["hankey", "hankey", "hankey", "bomb"] // 75% 狗屎, 25% 炸弹
        },
        playerSpeed: 0.007
    },
    {
        name: "波浪之旅",
        targetScore: 12,
        path: {
            type: "sin",
            start: { x: 0.1, y: 0.7 },
            end: { x: 0.9, y: 0.7 },
            amplitude: 0.08,
            frequency: 2,
            width: 0.06
        },
        obstacles: {
            interval: 1600,
            types: ["hankey", "hankey", "bomb", "bomb"] // 50% 狗屎, 50% 炸弹
        },
        playerSpeed: 0.008
    },
    {
        name: "环形赛道",
        targetScore: 15,
        path: {
            type: "circle",
            center: { x: 0.5, y: 0.7 },
            radius: 0.4,
            width: 0.06
        },
        obstacles: {
            interval: 1400,
            types: ["hankey", "bomb", "bomb"] // 33% 狗屎, 67% 炸弹
        },
        playerSpeed: 0.009
    },
    {
        name: "终极挑战",
        targetScore: 20,
        path: {
            type: "wave",
            start: { x: 0.1, y: 0.7 },
            end: { x: 0.9, y: 0.7 },
            amplitude: 0.12,
            frequency: 2,
            width: 0.06
        },
        obstacles: {
            interval: 1200,
            types: ["hankey", "bomb", "bomb", "bomb"] // 25% 狗屎, 75% 炸弹
        },
        playerSpeed: 0.015
    }
];

class Player {
    constructor(pixi, path, speed) {
        this.pixi = pixi;
        this.path = path;
        this.speed = speed;
        this.sprite = null;
        this.currentPosition = 0; // 在路径上的位置 (0-1)
        this.direction = 1; // 1: 正向, -1: 反向
        this.isMoving = false;

        this.init();
    }

    init() {
        // 加载玩家图片
        this.sprite = new PIXI.Sprite(this.pixi.gameApp.textures['/ballgame/player_run.png']);
        this.sprite.anchor.set(0.5);
        this.pixi.stage.addChild(this.sprite);

        // 设置初始位置
        this.updatePosition();
    }

    updatePosition() {
        const pos = this.getPathPosition(this.currentPosition);
        this.sprite.x = pos.x;
        this.sprite.y = pos.y;

        // 根据移动方向翻转图片
        if (this.direction < 0) {
            this.sprite.scale.x = -1;
        } else {
            this.sprite.scale.x = 1;
        }
    }

    getPathPosition(t) {
        const width = this.pixi.screen.width;
        const height = this.pixi.screen.height;

        switch (this.path.type) {
            case "line":
                return {
                    x: this.path.start.x * width + (this.path.end.x * width - this.path.start.x * width) * t,
                    y: this.path.start.y * height + (this.path.end.y * height - this.path.start.y * height) * t
                };
            case "arc":
                const angle = this.path.startAngle + (this.path.endAngle - this.path.startAngle) * t;
                return {
                    x: this.path.center.x * width + Math.cos(angle) * this.path.radiusX * width,
                    y: this.path.center.y * height + Math.sin(angle) * this.path.radiusY * height
                };
            case "sin":
                // 使用正弦函数计算玩家位置
                const x = this.path.start.x * width + (this.path.end.x * width - this.path.start.x * width) * t;
                const sinY = Math.sin(t * this.path.frequency * Math.PI * 2) * this.path.amplitude * height;
                return {
                    x: x,
                    y: this.path.start.y * height + sinY
                };
            case "wave":
                // 使用贝塞尔曲线计算玩家位置，与绘制路径保持一致
                const startX = this.path.start.x * width;
                const endX = this.path.end.x * width;
                const centerY = this.path.start.y * height;
                const amplitude = this.path.amplitude * height;
                const frequency = this.path.frequency;

                // 计算波浪的周期
                const totalDistance = endX - startX;
                const wavelength = totalDistance / frequency;

                // 计算当前t值对应的波浪周期和周期内的位置
                const currentX = startX + t * totalDistance;
                const waveIndex = Math.floor((currentX - startX) / wavelength);
                const waveT = ((currentX - startX) % wavelength) / wavelength;

                // 使用贝塞尔曲线公式计算Y坐标
                const waveStartX = startX + waveIndex * wavelength;
                const cp1X = waveStartX + wavelength * 0.25;
                const cp1Y = centerY + amplitude;
                const cp2X = waveStartX + wavelength * 0.75;
                const cp2Y = centerY - amplitude;
                const waveEndX = waveStartX + wavelength;

                // 贝塞尔曲线公式：B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
                const t1 = 1 - waveT;
                const t2 = waveT;
                const y = t1 * t1 * t1 * centerY +
                    3 * t1 * t1 * t2 * cp1Y +
                    3 * t1 * t2 * t2 * cp2Y +
                    t2 * t2 * t2 * centerY;

                return {
                    x: currentX,
                    y: y
                };
            case "circle":
                const circleAngle = t * Math.PI * 2;
                // 使用相同的半径值确保玩家移动路径与绘制路径一致
                const radius = this.path.radius * Math.min(width, height);
                return {
                    x: this.path.center.x * width + Math.cos(circleAngle) * radius,
                    y: this.path.center.y * height + Math.sin(circleAngle) * radius
                };
            case "polyline":
                const segmentCount = this.path.points.length - 1;
                const segmentIndex = Math.floor(t * segmentCount);
                const segmentT = (t * segmentCount) % 1;
                const segment = Math.min(segmentIndex, segmentCount - 1);
                const p1 = this.path.points[segment];
                const p2 = this.path.points[segment + 1];
                return {
                    x: p1.x * width + (p2.x * width - p1.x * width) * segmentT,
                    y: p1.y * height + (p2.y * height - p1.y * height) * segmentT
                };
        }
    }

    update() {
        if (!this.isMoving) return;

        this.currentPosition += this.speed * this.direction;

        // 检查边界
        if (this.currentPosition >= 1) {
            this.currentPosition = 1;
            this.direction = -1;
        } else if (this.currentPosition <= 0) {
            this.currentPosition = 0;
            this.direction = 1;
        }

        this.updatePosition();
    }

    reverse() {
        this.direction *= -1;
    }

    start() {
        this.isMoving = true;
    }

    getBounds() {
        const bounds = this.sprite.getBounds();
        const scale = 0.9; // 碰撞区域为原始大小的0.9倍
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const scaledWidth = bounds.width * scale;
        const scaledHeight = bounds.height * scale;
        return {
            x: centerX - scaledWidth / 2,
            y: centerY - scaledHeight / 2,
            width: scaledWidth,
            height: scaledHeight
        };
    }
}

class Obstacle {
    constructor(pixi, type, x, y) {
        this.pixi = pixi;
        this.type = type; // "bomb" 或 "hankey"
        this.sprite = null;
        this.x = x;
        this.y = y;
        this.speed = 4;

        this.init();
    }

    init() {
        const texturePath = this.type === "bomb" ? "/ballgame/bomb.png" : "/ballgame/hankey.png";
        this.sprite = new PIXI.Sprite(this.pixi.gameApp.textures[texturePath]);
        this.sprite.anchor.set(0.5);
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.pixi.stage.addChild(this.sprite);
    }

    update() {
        this.sprite.y += this.speed;
    }

    isOutOfScreen() {
        return this.sprite.y > this.pixi.screen.height + 100;
    }

    getBounds() {
        const bounds = this.sprite.getBounds();
        const scale = 0.9; // 碰撞区域为原始大小的0.9倍
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const scaledWidth = bounds.width * scale;
        const scaledHeight = bounds.height * scale;
        return {
            x: centerX - scaledWidth / 2,
            y: centerY - scaledHeight / 2,
            width: scaledWidth,
            height: scaledHeight
        };
    }

    destroy() {
        if (this.sprite && this.sprite.parent) {
            this.sprite.parent.removeChild(this.sprite);
        }
    }
}

class GameApp {
    constructor() {
        this.pixi = null;
        this.currentLevel = 0;
        this.score = 0;
        this.gameState = "waiting"; // "waiting", "playing", "gameover", "win"

        this.player = null;
        this.obstacles = [];
        this.pathGraphics = null;
        this.scoreText = null;
        this.levelText = null;
        this.instructionText = null;

        this.obstacleTimer = 0;
        this.lastObstacleTime = 0;

        this.audioContext = null;
        this.sounds = {};

        // 资源管理
        this.textures = {};
        this.resourcesLoaded = false;

        // 星星容器
        this.starContainer = null;

        // 基础字体样式
        this.baseFontStyle = {
            fontFamily: 'Verdana, Geneva, sans-serif',
            fontWeight: 'bold',
            strokeThickness: 5
        };
    }

    async init() {
        const options = { designWidth: 1080, designHeight: 1920, scale: 1 };
        initDom(pixiContainer.value, options);
        this.pixi = createPixi(pixiContainer.value);
        this.pixi.gameApp = this; // 让pixi实例可以访问gameApp

        // 加载资源
        await this.loadResources();

        // 创建星星容器
        this.starContainer = new PIXI.Container();
        this.pixi.stage.addChildAt(this.starContainer, 0); // 放在最底层

        // 添加背景装饰
        this.createBackground();

        // 初始化音频
        this.initAudio();

        // 初始化UI
        this.initUI();

        // 开始游戏循环
        this.gameLoop();
    }

    async loadResources() {
        const resources = [
            '/ballgame/player_run.png',
            '/ballgame/player_win.png',
            '/ballgame/player_fail.png',
            '/ballgame/bomb.png',
            '/ballgame/hankey.png',
            '/ballgame/star_small.png'
        ];

        const loadPromises = resources.map(url => {
            return new Promise((resolve, reject) => {
                const texture = PIXI.Texture.from(url);
                texture.baseTexture.on('loaded', () => {
                    this.textures[url] = texture;
                    resolve();
                });
                texture.baseTexture.on('error', reject);
            });
        });

        try {
            await Promise.all(loadPromises);
            this.resourcesLoaded = true;
            console.log('所有资源加载完成');
        } catch (error) {
            console.error('资源加载失败:', error);
        }
    }

    createBackground() {
        // 创建固定的星星背景
        for (let i = 0; i < 30; i++) {
            const star = new PIXI.Sprite(this.textures['/ballgame/star_small.png']);
            star.anchor.set(0.5);

        // 随机位置
            star.x = Math.random() * this.pixi.screen.width;
            star.y = Math.random() * this.pixi.screen.height;

            // 随机大小和透明度
            star.scale.set(Math.random() * 0.5 + 0.5);
            star.alpha = Math.random() * 0.4 + 0.2; // 0.2-0.6

            this.starContainer.addChild(star);
        }
    }

    initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // 预加载音效
        this.loadSound('/ballgame/ball_click.mp3', 'click');
        this.loadSound('/ballgame/ball_bomb.mp3', 'bomb');
        this.loadSound('/ballgame/ball_collect.mp3', 'collect');
    }

    async loadSound(url, name) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds[name] = audioBuffer;
        } catch (error) {
            console.log('音频加载失败:', error);
        }
    }

    playSound(name) {
        if (this.sounds[name] && this.audioContext.state === 'running') {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[name];
            source.connect(this.audioContext.destination);
            source.start();
        }
    }

    initUI() {
        // 游戏标题 (左上角)
        this.titleText = new PIXI.Text('抓住狗屎运', {
            ...this.baseFontStyle,
            fontSize: 64,
            fill: 0xDDDDE6,
            dropShadow: true,
            dropShadowColor: 0xFFFFFF,
            dropShadowBlur: 4,
            dropShadowDistance: 2
        });
        this.titleText.anchor.set(0, 0.5);
        this.titleText.x = this.pixi.screen.width * 0.05;
        this.titleText.y = this.pixi.screen.height * 0.04;
        this.pixi.stage.addChild(this.titleText);

        // 关卡显示 (游戏名下面)
        this.levelText = new PIXI.Text('', {
            ...this.baseFontStyle,
            fontSize: 48,
            fill: 0xB0E0E6,
            dropShadow: true,
            dropShadowColor: 0xFFFFFF,
            dropShadowBlur: 2,
            dropShadowDistance: 1
        });
        this.levelText.anchor.set(0, 0.5);
        this.levelText.x = this.pixi.screen.width * 0.05;
        this.levelText.y = this.pixi.screen.height * 0.08;
        this.pixi.stage.addChild(this.levelText);

        // 分数显示 (右上角)
        this.scoreText = new PIXI.Text('目标：0/5', {
            ...this.baseFontStyle,
            fontSize: 56,
            fill: 0xB0E0E6,
            dropShadow: true,
            dropShadowColor: 0xFFFFFF,
            dropShadowBlur: 2,
            dropShadowDistance: 1
        });
        this.scoreText.anchor.set(1, 0.5);
        this.scoreText.x = this.pixi.screen.width * 0.95;
        this.scoreText.y = this.pixi.screen.height * 0.04;
        this.pixi.stage.addChild(this.scoreText);

        // 说明文字
        this.instructionText = new PIXI.Text('点击屏幕开始游戏', {
            ...this.baseFontStyle,
            fontSize: 60,
            fill: 0xB0E0E6
        });
        this.instructionText.anchor.set(0.5);
        this.instructionText.x = this.pixi.screen.width * 0.5;
        this.instructionText.y = this.pixi.screen.height * 0.35;
        this.pixi.stage.addChild(this.instructionText);

        // 游戏说明
        this.helpText = new PIXI.Text('收集狗屎得分，避开炸弹', {
            ...this.baseFontStyle,
            fontSize: 50,
            fill: 0xB0E0E6,
            align: 'center'
        });
        this.helpText.anchor.set(0.5);
        this.helpText.x = this.pixi.screen.width * 0.5;
        this.helpText.y = this.pixi.screen.height * 0.45;
        this.pixi.stage.addChild(this.helpText);
    }

    initGame() {
        this.loadLevel(this.currentLevel);
        this.updateUI();
    }

    loadLevel(levelIndex) {
        // 清理当前关卡
        this.cleanupLevel();

        const levelConfig = AllLevelConfig[levelIndex];
        this.levelText.text = `${levelConfig.name}`;

        // 绘制路径
        this.drawPath(levelConfig.path);

        // 创建玩家
        this.player = new Player(this.pixi, levelConfig.path, levelConfig.playerSpeed);

        // 重置游戏状态
        this.score = 0;
        this.gameState = "waiting";
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.lastObstacleTime = 0;

        this.updateUI();
    }

    drawPath(pathConfig) {
        if (this.pathGraphics) {
            this.pixi.stage.removeChild(this.pathGraphics);
        }

        this.pathGraphics = new PIXI.Graphics();
        const width = this.pixi.screen.width;
        const height = this.pixi.screen.height;
        const pathWidth = pathConfig.width * width;

        this.pathGraphics.lineStyle(pathWidth, 0x666666, 0.5);
        // 移除填充，只绘制线条

        switch (pathConfig.type) {
            case "line":
                // 绘制圆头直线
                this.drawRoundedLine(
                    pathConfig.start.x * width, pathConfig.start.y * height,
                    pathConfig.end.x * width, pathConfig.end.y * height,
                    pathWidth / 2
                );
                break;
            case "arc":
                // 绘制椭圆弧，使用多个线段近似
                const arcSegments = 100;
                for (let i = 0; i <= arcSegments; i++) {
                    const t = i / arcSegments;
                    const angle = pathConfig.startAngle + (pathConfig.endAngle - pathConfig.startAngle) * t;
                    const x = pathConfig.center.x * width + Math.cos(angle) * pathConfig.radiusX * width;
                    const y = pathConfig.center.y * height + Math.sin(angle) * pathConfig.radiusY * height;

                    if (i === 0) {
                        this.pathGraphics.moveTo(x, y);
                    } else {
                        this.pathGraphics.lineTo(x, y);
                    }
                }
                break;
            case "sin":
                // 使用正弦函数绘制平滑的波浪
                const sinSegments = 200;
                for (let i = 0; i <= sinSegments; i++) {
                    const t = i / sinSegments;
                    const x = pathConfig.start.x * width + (pathConfig.end.x * width - pathConfig.start.x * width) * t;
                    const sinY = Math.sin(t * pathConfig.frequency * Math.PI * 2) * pathConfig.amplitude * height;
                    const y = pathConfig.start.y * height + sinY;

                    if (i === 0) {
                        this.pathGraphics.moveTo(x, y);
                    } else {
                        this.pathGraphics.lineTo(x, y);
                    }
                }
                break;
            case "wave":
                // 使用贝塞尔曲线绘制平滑的波浪
                const waveStartX = pathConfig.start.x * width;
                const waveEndX = pathConfig.end.x * width;
                const waveCenterY = pathConfig.start.y * height;
                const waveAmplitude = pathConfig.amplitude * height;
                const waveFrequency = pathConfig.frequency;

                // 计算波浪的周期
                const waveTotalDistance = waveEndX - waveStartX;
                const waveWavelength = waveTotalDistance / waveFrequency;

                // 绘制贝塞尔曲线波浪
                this.pathGraphics.moveTo(waveStartX, waveCenterY);

                for (let i = 0; i < waveFrequency; i++) {
                    const periodStartX = waveStartX + i * waveWavelength;
                    const periodEndX = waveStartX + (i + 1) * waveWavelength;

                    // 每个波浪周期的控制点
                    const cp1X = periodStartX + waveWavelength * 0.25;
                    const cp1Y = waveCenterY + waveAmplitude;
                    const cp2X = periodStartX + waveWavelength * 0.75;
                    const cp2Y = waveCenterY - waveAmplitude;

                    // 绘制贝塞尔曲线
                    this.pathGraphics.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, periodEndX, waveCenterY);
                }
                break;
            case "circle":
                // 绘制圆形路径，使用多个线段近似
                const circleSegments = 100;
                for (let i = 0; i <= circleSegments; i++) {
                    const t = i / circleSegments;
                    const angle = t * Math.PI * 2;
                    // 使用相同的半径值确保绘制的是圆形
                    const radius = pathConfig.radius * Math.min(width, height);
                    const x = pathConfig.center.x * width + Math.cos(angle) * radius;
                    const y = pathConfig.center.y * height + Math.sin(angle) * radius;

                    if (i === 0) {
                        this.pathGraphics.moveTo(x, y);
                    } else {
                        this.pathGraphics.lineTo(x, y);
                    }
                }
                break;
            case "polyline":
                this.pathGraphics.moveTo(pathConfig.points[0].x * width, pathConfig.points[0].y * height);
                for (let i = 1; i < pathConfig.points.length; i++) {
                    this.pathGraphics.lineTo(pathConfig.points[i].x * width, pathConfig.points[i].y * height);
                }
                break;
        }

        this.pixi.stage.addChild(this.pathGraphics);
    }

    drawRoundedLine(x1, y1, x2, y2, radius) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) return;

        const unitX = dx / length;
        const unitY = dy / length;

        // 绘制主体线段
        this.pathGraphics.moveTo(x1 + unitX * radius, y1 + unitY * radius);
        this.pathGraphics.lineTo(x2 - unitX * radius, y2 - unitY * radius);
    }

    getWavePosition(pathConfig, t) {
        const width = this.pixi.screen.width;
        const height = this.pixi.screen.height;
        const x = pathConfig.start.x * width + (pathConfig.end.x * width - pathConfig.start.x * width) * t;
        const waveY = Math.sin(t * pathConfig.frequency * Math.PI * 2) * pathConfig.amplitude * height;
        return {
            x: x,
            y: pathConfig.start.y * height + waveY
        };
    }

    cleanupLevel() {
        // 清理障碍物
        this.obstacles.forEach(obstacle => obstacle.destroy());
        this.obstacles = [];

        // 清理玩家
        if (this.player && this.player.sprite) {
            this.pixi.stage.removeChild(this.player.sprite);
        }

        // 清理路径
        if (this.pathGraphics) {
            this.pixi.stage.removeChild(this.pathGraphics);
        }
    }

    updateUI() {
        const levelConfig = AllLevelConfig[this.currentLevel];
        this.scoreText.text = `目标：${this.score}/${levelConfig.targetScore}`;

        if (this.gameState === "waiting") {
            this.instructionText.text = "点击屏幕开始游戏";
            this.instructionText.visible = true;
            this.helpText.visible = true;
        } else if (this.gameState === "playing") {
            this.instructionText.visible = false;
            this.helpText.visible = false;
        } else if (this.gameState === "gameover") {
            this.instructionText.text = "游戏结束！点击重新开始";
            this.instructionText.visible = true;
            this.helpText.visible = false;
        } else if (this.gameState === "win") {
            this.instructionText.text = "恭喜通关！点击继续";
            this.instructionText.visible = true;
            this.helpText.visible = false;
        }
    }

    startGame() {
        if (this.gameState === "waiting") {
            this.gameState = "playing";
            this.player.start();
            this.playSound('click');
            this.updateUI();
        } else if (this.gameState === "gameover") {
            this.loadLevel(this.currentLevel);
        } else if (this.gameState === "win") {
            this.currentLevel++;
            if (this.currentLevel >= AllLevelConfig.length) {
                this.currentLevel = 0; // 重新开始
            }
            this.loadLevel(this.currentLevel);
        }
    }

    reversePlayer() {
        if (this.gameState === "playing" && this.player) {
            this.player.reverse();
            this.playSound('click');
        }
    }

    spawnObstacle() {
        const levelConfig = AllLevelConfig[this.currentLevel];
        const type = levelConfig.obstacles.types[Math.floor(Math.random() * levelConfig.obstacles.types.length)];
        const x = Math.random() * this.pixi.screen.width * 0.8 + this.pixi.screen.width * 0.1; // 随机X位置
        const obstacle = new Obstacle(this.pixi, type, x, -50);
        this.obstacles.push(obstacle);
    }

    checkCollisions() {
        if (!this.player) return;

        const playerBounds = this.player.getBounds();

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            const obstacleBounds = obstacle.getBounds();

            if (this.isColliding(playerBounds, obstacleBounds)) {
                if (obstacle.type === "bomb") {
                    this.score = 0;
                    this.playSound('bomb');
                    this.gameState = "gameover";
                    this.updateUI();
                    this.createExplosion(obstacle.sprite.x, obstacle.sprite.y);
                    this.showFailScreen();
                } else if (obstacle.type === "hankey") {
                    this.score++;
                    this.playSound('collect');
                    this.createHankeyFlyEffect(obstacle.sprite.x, obstacle.sprite.y);

                    // 检查是否达到目标分数
                    const levelConfig = AllLevelConfig[this.currentLevel];
                    if (this.score >= levelConfig.targetScore) {
                        this.gameState = "win";
                        this.updateUI();
                        this.showWinScreen();
                    }
                }

                obstacle.destroy();
                this.obstacles.splice(i, 1);
            }
        }
    }

    createExplosion(x, y) {
        const explosion = new PIXI.Graphics();
        explosion.beginFill(0xFF0000, 0.8);
        explosion.drawCircle(0, 0, 50);
        explosion.endFill();
        explosion.x = x;
        explosion.y = y;
        this.pixi.stage.addChild(explosion);

        // 使用GSAP + PixiPlugin创建爆炸动画
        gsap.to(explosion, {
            alpha: 0,
            pixi: { scale: 2 }, // 使用PixiPlugin的scale属性
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {
                this.pixi.stage.removeChild(explosion);
            }
        });
    }

    createHankeyFlyEffect(x, y) {
        // 创建狗屎精灵
        const hankeySprite = new PIXI.Sprite(this.textures['/ballgame/hankey.png']);
        hankeySprite.anchor.set(0.5);
        hankeySprite.x = x;
        hankeySprite.y = y;
        this.pixi.stage.addChild(hankeySprite);

        // 目标位置（分数显示区域）
        const targetX = this.scoreText.x - this.scoreText.width / 2;
        const targetY = this.scoreText.y;

        gsap.to(hankeySprite, {
            pixi: {
                x: targetX,
                y: targetY,
                scale: 0.5
            },
            duration: 0.6,
            ease: "power2.inOut",
            onComplete: () => {
                this.pixi.stage.removeChild(hankeySprite);
                this.updateUI(); // 更新分数显示
            }
        });
    }



    showFailScreen() {
        // 创建失败图片
        const failSprite = new PIXI.Sprite(this.textures['/ballgame/player_fail.png']);
        failSprite.anchor.set(0.5);
        failSprite.x = this.pixi.screen.width * 0.5;
        failSprite.y = this.pixi.screen.height * 0.5;
        failSprite.alpha = 0;
        this.pixi.stage.addChild(failSprite);

        // 使用GSAP创建淡入淡出动画
        const timeline = gsap.timeline({
            onComplete: () => {
                this.pixi.stage.removeChild(failSprite);
            }
        });

        timeline.to(failSprite, {
            alpha: 1,
            duration: 0.5,
            ease: "power2.out"
        }).to(failSprite, {
            alpha: 0,
            duration: 0.5,
            ease: "power2.in",
            delay: 1
        });
    }

    showWinScreen() {
        // 创建胜利图片
        const winSprite = new PIXI.Sprite(this.textures['/ballgame/player_win.png']);
        winSprite.anchor.set(0.5);
        winSprite.x = this.pixi.screen.width * 0.5;
        winSprite.y = this.pixi.screen.height * 0.5;
        winSprite.alpha = 0;
        this.pixi.stage.addChild(winSprite);

        // 创建庆祝粒子效果
        for (let i = 0; i < 20; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0xFFFF00, 0.8);
            particle.drawCircle(0, 0, 5);
            particle.endFill();
            particle.x = this.pixi.screen.width * 0.5;
            particle.y = this.pixi.screen.height * 0.5;
            particle.alpha = 0;
            this.pixi.stage.addChild(particle);

            // 使用GSAP创建粒子动画
            const angle = (Math.PI * 2 * i) / 20;
            const distance = 100 + Math.random() * 50;
            const targetX = this.pixi.screen.width * 0.5 + Math.cos(angle) * distance;
            const targetY = this.pixi.screen.height * 0.5 + Math.sin(angle) * distance;

            const timeline = gsap.timeline({
                onComplete: () => {
                    this.pixi.stage.removeChild(particle);
                }
            });

            timeline.to(particle, {
                alpha: 1,
                duration: 0.3,
                delay: i * 0.1,
                ease: "power2.out"
            }).to(particle, {
                x: targetX,
                y: targetY,
                alpha: 0,
                duration: 1.5,
                ease: "power2.in"
            });
        }

        // 使用GSAP创建胜利图片动画
        const timeline = gsap.timeline({
            onComplete: () => {
                this.pixi.stage.removeChild(winSprite);
            }
        });

        timeline.to(winSprite, {
            alpha: 1,
            pixi: { scale: 1.2 }, // 使用PixiPlugin的scale属性
            duration: 0.8,
            ease: "back.out(1.7)"
        }).to(winSprite, {
            pixi: { scale: 1 }, // 使用PixiPlugin的scale属性
            duration: 0.3,
            ease: "power2.out"
        }).to(winSprite, {
            alpha: 0,
            duration: 0.5,
            ease: "power2.in",
            delay: 2
        });
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    }

    gameLoop() {
        const currentTime = Date.now();

        if (this.gameState === "playing") {
            // 更新玩家
            if (this.player) {
                this.player.update();
            }

            // 生成障碍物
            const levelConfig = AllLevelConfig[this.currentLevel];
            if (currentTime - this.lastObstacleTime > levelConfig.obstacles.interval) {
                this.spawnObstacle();
                this.lastObstacleTime = currentTime;
            }

            // 更新障碍物
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obstacle = this.obstacles[i];
                obstacle.update();

                if (obstacle.isOutOfScreen()) {
                    obstacle.destroy();
                    this.obstacles.splice(i, 1);
                }
            }

            // 检查碰撞
            this.checkCollisions();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    handleClick() {
        if (this.gameState === "waiting" || this.gameState === "gameover" || this.gameState === "win") {
            this.startGame();
        } else if (this.gameState === "playing") {
            this.reversePlayer();
        }
    }

    destroy() {
        this.cleanupLevel();
        if (this.pixi) {
            this.pixi.destroy(true);
        }
        // 清理星星容器
        if (this.starContainer) {
            this.starContainer.destroy({ children: true });
        }
        // 清理所有GSAP动画
        gsap.killTweensOf("*");
    }
}

const gameApp = new GameApp();
const pixiContainer = ref(null);

onMounted(async () => {
    gsap.registerPlugin(PixiPlugin);
    PixiPlugin.registerPIXI(PIXI);
    await gameApp.init();
    gameApp.initGame();

    // 添加点击事件
    const handleClick = () => {
        gameApp.handleClick();
    };

    document.addEventListener('click', handleClick);

    // 清理事件监听器
    onUnmounted(() => {
        document.removeEventListener('click', handleClick);
        gameApp.destroy();
    });
});
</script>

<style scoped>
.game-container {
    margin: 0;
    padding: 0;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}
</style>
