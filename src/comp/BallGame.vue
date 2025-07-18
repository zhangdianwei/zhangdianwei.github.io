<template>
    <div class="game-container">
        <canvas ref="pixiContainer"></canvas>
    </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as PIXI from 'pixi.js';
import { initDom, createPixi } from '../pixi/PixiHelper';

// 关卡配置
const AllLevelConfig = [
    {
        name: "第一关 - 直线",
        targetScore: 5,
        path: {
            type: "line",
            start: { x: 200, y: 540 },
            end: { x: 1720, y: 540 },
            width: 60
        },
        obstacles: {
            interval: 2500,
            types: ["hankey", "hankey", "bomb"] // 70% 狗屎, 30% 炸弹
        }
    },
    {
        name: "第二关 - 圆弧",
        targetScore: 8,
        path: {
            type: "arc",
            center: { x: 960, y: 540 },
            radius: 400,
            startAngle: 0,
            endAngle: Math.PI,
            width: 60
        },
        obstacles: {
            interval: 2200,
            types: ["hankey", "hankey", "hankey", "bomb"] // 75% 狗屎, 25% 炸弹
        }
    },
    {
        name: "第三关 - 波浪",
        targetScore: 12,
        path: {
            type: "wave",
            start: { x: 200, y: 540 },
            end: { x: 1720, y: 540 },
            amplitude: 150,
            frequency: 3,
            width: 60
        },
        obstacles: {
            interval: 2000,
            types: ["hankey", "hankey", "bomb", "bomb"] // 50% 狗屎, 50% 炸弹
        }
    },
    {
        name: "第四关 - 圆形",
        targetScore: 15,
        path: {
            type: "circle",
            center: { x: 960, y: 540 },
            radius: 300,
            width: 60
        },
        obstacles: {
            interval: 1800,
            types: ["hankey", "bomb", "bomb"] // 33% 狗屎, 67% 炸弹
        }
    },
    {
        name: "第五关 - 折线",
        targetScore: 20,
        path: {
            type: "polyline",
            points: [
                { x: 200, y: 300 },
                { x: 600, y: 600 },
                { x: 1000, y: 300 },
                { x: 1400, y: 600 },
                { x: 1720, y: 300 }
            ],
            width: 60
        },
        obstacles: {
            interval: 1500,
            types: ["hankey", "bomb", "bomb", "bomb"] // 25% 狗屎, 75% 炸弹
        }
    }
];

class Player {
    constructor(pixi, path) {
        this.pixi = pixi;
        this.path = path;
        this.sprite = null;
        this.currentPosition = 0; // 在路径上的位置 (0-1)
        this.direction = 1; // 1: 正向, -1: 反向
        this.speed = 0.005;
        this.isMoving = false;

        this.init();
    }

    init() {
        // 加载玩家图片
        this.sprite = PIXI.Sprite.from('/ballgame/player_run.png');
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.3);
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
            this.sprite.scale.x = -0.3;
        } else {
            this.sprite.scale.x = 0.3;
        }
    }

    getPathPosition(t) {
        switch (this.path.type) {
            case "line":
                return {
                    x: this.path.start.x + (this.path.end.x - this.path.start.x) * t,
                    y: this.path.start.y + (this.path.end.y - this.path.start.y) * t
                };
            case "arc":
                const angle = this.path.startAngle + (this.path.endAngle - this.path.startAngle) * t;
                return {
                    x: this.path.center.x + Math.cos(angle) * this.path.radius,
                    y: this.path.center.y + Math.sin(angle) * this.path.radius
                };
            case "wave":
                const x = this.path.start.x + (this.path.end.x - this.path.start.x) * t;
                const waveY = Math.sin(t * this.path.frequency * Math.PI * 2) * this.path.amplitude;
                return {
                    x: x,
                    y: this.path.start.y + waveY
                };
            case "circle":
                const circleAngle = t * Math.PI * 2;
                return {
                    x: this.path.center.x + Math.cos(circleAngle) * this.path.radius,
                    y: this.path.center.y + Math.sin(circleAngle) * this.path.radius
                };
            case "polyline":
                const segmentCount = this.path.points.length - 1;
                const segmentIndex = Math.floor(t * segmentCount);
                const segmentT = (t * segmentCount) % 1;
                const segment = Math.min(segmentIndex, segmentCount - 1);
                const p1 = this.path.points[segment];
                const p2 = this.path.points[segment + 1];
                return {
                    x: p1.x + (p2.x - p1.x) * segmentT,
                    y: p1.y + (p2.y - p1.y) * segmentT
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
        return {
            x: this.sprite.x - 30,
            y: this.sprite.y - 30,
            width: 60,
            height: 60
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
        this.speed = 2;

        this.init();
    }

    init() {
        const texturePath = this.type === "bomb" ? "/ballgame/bomb.png" : "/ballgame/hankey.png";
        this.sprite = PIXI.Sprite.from(texturePath);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.4);
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.pixi.stage.addChild(this.sprite);
    }

    update() {
        this.sprite.y += this.speed;
    }

    isOutOfScreen() {
        return this.sprite.y > 1200;
    }

    getBounds() {
        return {
            x: this.sprite.x - 25,
            y: this.sprite.y - 25,
            width: 50,
            height: 50
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
        this.gameState = "waiting"; // "waiting", "playing", "paused", "gameover", "win"
        this.completedLevels = 0;

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
        this.soundEnabled = true;
    }

    init() {
        const options = { designWidth: 1920, designHeight: 1080, scale: 0.9 };
        initDom(pixiContainer.value, options);
        this.pixi = createPixi(pixiContainer.value);

        // 添加背景装饰
        this.createBackground();

        // 初始化音频
        this.initAudio();

        // 初始化UI
        this.initUI();

        // 开始游戏循环
        this.gameLoop();
    }

    createBackground() {
        // 创建一些装饰性的星星
        for (let i = 0; i < 50; i++) {
            const star = new PIXI.Graphics();
            star.beginFill(0xFFFFFF, Math.random() * 0.5 + 0.2);
            star.drawCircle(0, 0, Math.random() * 3 + 1);
            star.endFill();
            star.x = Math.random() * 1920;
            star.y = Math.random() * 1080;
            this.pixi.stage.addChild(star);

            // 让星星闪烁
            let alpha = star.alpha;
            let direction = 1;
            const twinkle = () => {
                alpha += 0.02 * direction;
                if (alpha >= 0.7) direction = -1;
                if (alpha <= 0.2) direction = 1;
                star.alpha = alpha;
                setTimeout(twinkle, 50);
            };
            setTimeout(twinkle, Math.random() * 2000);
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
        if (this.soundEnabled && this.sounds[name] && this.audioContext.state === 'running') {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[name];
            source.connect(this.audioContext.destination);
            source.start();
        }
    }

    initUI() {
        // 分数显示
        this.scoreText = new PIXI.Text('分数: 0', {
            fontFamily: 'Arial',
            fontSize: 36,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 4
        });
        this.scoreText.x = 1600;
        this.scoreText.y = 50;
        this.pixi.stage.addChild(this.scoreText);

        // 关卡显示
        this.levelText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 4
        });
        this.levelText.x = 50;
        this.levelText.y = 50;
        this.pixi.stage.addChild(this.levelText);

        // 已通关数显示
        this.completedText = new PIXI.Text('已通关: 0', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0x00FF00,
            stroke: 0x000000,
            strokeThickness: 3
        });
        this.completedText.x = 50;
        this.completedText.y = 90;
        this.pixi.stage.addChild(this.completedText);

        // 目标分数显示
        this.targetText = new PIXI.Text('目标: 0', {
            fontFamily: 'Arial',
            fontSize: 28,
            fill: 0xFFFF00,
            stroke: 0x000000,
            strokeThickness: 3
        });
        this.targetText.x = 1600;
        this.targetText.y = 100;
        this.pixi.stage.addChild(this.targetText);

        // 说明文字
        this.instructionText = new PIXI.Text('点击屏幕开始游戏', {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 6
        });
        this.instructionText.anchor.set(0.5);
        this.instructionText.x = 960;
        this.instructionText.y = 300;
        this.pixi.stage.addChild(this.instructionText);

        // 游戏说明
        this.helpText = new PIXI.Text('点击屏幕或按空格键让角色反向移动\n收集狗屎得分，避开炸弹\n按P键暂停游戏', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xCCCCCC,
            stroke: 0x000000,
            strokeThickness: 2,
            align: 'center'
        });
        this.helpText.anchor.set(0.5);
        this.helpText.x = 960;
        this.helpText.y = 400;
        this.pixi.stage.addChild(this.helpText);

        // 音效开关按钮
        this.soundButton = new PIXI.Text('🔊', {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 3
        });
        this.soundButton.x = 1800;
        this.soundButton.y = 50;
        this.soundButton.interactive = true;
        this.soundButton.buttonMode = true;
        this.soundButton.on('pointerdown', () => {
            this.soundEnabled = !this.soundEnabled;
            this.soundButton.text = this.soundEnabled ? '🔊' : '🔇';
        });
        this.pixi.stage.addChild(this.soundButton);

        // 暂停按钮
        this.pauseButton = new PIXI.Text('⏸️', {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 3
        });
        this.pauseButton.x = 1750;
        this.pauseButton.y = 50;
        this.pauseButton.interactive = true;
        this.pauseButton.buttonMode = true;
        this.pauseButton.on('pointerdown', () => {
            this.togglePause();
        });
        this.pixi.stage.addChild(this.pauseButton);
    }

    initGame() {
        this.loadLevel(this.currentLevel);
        this.updateUI();
    }

    loadLevel(levelIndex) {
        // 清理当前关卡
        this.cleanupLevel();

        const levelConfig = AllLevelConfig[levelIndex];
        this.levelText.text = levelConfig.name;
        this.targetText.text = `目标: ${levelConfig.targetScore}`;

        // 绘制路径
        this.drawPath(levelConfig.path);

        // 创建玩家
        this.player = new Player(this.pixi, levelConfig.path);

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
        this.pathGraphics.lineStyle(pathConfig.width, 0x666666, 0.5);
        this.pathGraphics.beginFill(0x444444, 0.3);

        switch (pathConfig.type) {
            case "line":
                this.pathGraphics.moveTo(pathConfig.start.x, pathConfig.start.y);
                this.pathGraphics.lineTo(pathConfig.end.x, pathConfig.end.y);
                break;
            case "arc":
                this.pathGraphics.arc(pathConfig.center.x, pathConfig.center.y,
                    pathConfig.radius, pathConfig.startAngle, pathConfig.endAngle);
                break;
            case "wave":
                const segments = 100;
                for (let i = 0; i <= segments; i++) {
                    const t = i / segments;
                    const pos = this.getWavePosition(pathConfig, t);
                    if (i === 0) {
                        this.pathGraphics.moveTo(pos.x, pos.y);
                    } else {
                        this.pathGraphics.lineTo(pos.x, pos.y);
                    }
                }
                break;
            case "circle":
                this.pathGraphics.drawCircle(pathConfig.center.x, pathConfig.center.y, pathConfig.radius);
                break;
            case "polyline":
                this.pathGraphics.moveTo(pathConfig.points[0].x, pathConfig.points[0].y);
                for (let i = 1; i < pathConfig.points.length; i++) {
                    this.pathGraphics.lineTo(pathConfig.points[i].x, pathConfig.points[i].y);
                }
                break;
        }

        this.pathGraphics.endFill();
        this.pixi.stage.addChild(this.pathGraphics);
    }

    getWavePosition(pathConfig, t) {
        const x = pathConfig.start.x + (pathConfig.end.x - pathConfig.start.x) * t;
        const waveY = Math.sin(t * pathConfig.frequency * Math.PI * 2) * pathConfig.amplitude;
        return {
            x: x,
            y: pathConfig.start.y + waveY
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
        this.scoreText.text = `分数: ${this.score}`;
        this.completedText.text = `已通关: ${this.completedLevels}`;

        if (this.gameState === "waiting") {
            this.instructionText.text = "点击屏幕开始游戏";
            this.instructionText.visible = true;
            this.helpText.visible = true;
        } else if (this.gameState === "playing") {
            this.instructionText.visible = false;
            this.helpText.visible = false;
        } else if (this.gameState === "paused") {
            this.instructionText.text = "游戏暂停中，点击继续";
            this.instructionText.visible = true;
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
            this.currentLevel = 0;
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
        const x = Math.random() * 1600 + 160; // 随机X位置
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
                    this.createCollectEffect(obstacle.sprite.x, obstacle.sprite.y);

                    // 检查是否达到目标分数
                    const levelConfig = AllLevelConfig[this.currentLevel];
                    if (this.score >= levelConfig.targetScore) {
                        this.gameState = "win";
                        this.completedLevels++;
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

        // 动画效果
        let scale = 1;
        const animate = () => {
            scale += 0.1;
            explosion.scale.set(scale);
            explosion.alpha -= 0.05;

            if (explosion.alpha > 0) {
                requestAnimationFrame(animate);
            } else {
                this.pixi.stage.removeChild(explosion);
            }
        };
        animate();
    }

    createCollectEffect(x, y) {
        const effect = new PIXI.Text('+1', {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0x00FF00,
            stroke: 0x000000,
            strokeThickness: 3
        });
        effect.anchor.set(0.5);
        effect.x = x;
        effect.y = y;
        this.pixi.stage.addChild(effect);

        // 动画效果
        let alpha = 1;
        let yOffset = 0;
        const animate = () => {
            alpha -= 0.02;
            yOffset -= 1;
            effect.alpha = alpha;
            effect.y = y + yOffset;

            if (alpha > 0) {
                requestAnimationFrame(animate);
            } else {
                this.pixi.stage.removeChild(effect);
            }
        };
        animate();
    }

    showFailScreen() {
        // 创建失败图片
        const failSprite = PIXI.Sprite.from('/ballgame/player_fail.png');
        failSprite.anchor.set(0.5);
        failSprite.scale.set(0.4);
        failSprite.x = 960;
        failSprite.y = 540;
        failSprite.alpha = 0;
        this.pixi.stage.addChild(failSprite);

        // 淡入动画
        let alpha = 0;
        const fadeIn = () => {
            alpha += 0.05;
            failSprite.alpha = alpha;

            if (alpha < 1) {
                requestAnimationFrame(fadeIn);
            } else {
                // 3秒后淡出
                setTimeout(() => {
                    const fadeOut = () => {
                        alpha -= 0.05;
                        failSprite.alpha = alpha;

                        if (alpha > 0) {
                            requestAnimationFrame(fadeOut);
                        } else {
                            this.pixi.stage.removeChild(failSprite);
                        }
                    };
                    fadeOut();
                }, 3000);
            }
        };
        fadeIn();
    }

    showWinScreen() {
        // 创建胜利图片
        const winSprite = PIXI.Sprite.from('/ballgame/player_win.png');
        winSprite.anchor.set(0.5);
        winSprite.scale.set(0.4);
        winSprite.x = 960;
        winSprite.y = 540;
        winSprite.alpha = 0;
        this.pixi.stage.addChild(winSprite);

        // 创建庆祝粒子效果
        for (let i = 0; i < 20; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0xFFFF00, 0.8);
            particle.drawCircle(0, 0, 5);
            particle.endFill();
            particle.x = 960;
            particle.y = 540;
            particle.alpha = 0;
            this.pixi.stage.addChild(particle);

            // 粒子动画
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            let alpha = 0;
            const animate = () => {
                alpha += 0.05;
                particle.alpha = alpha;
                particle.x += vx;
                particle.y += vy;

                if (alpha < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // 淡出
                    const fadeOut = () => {
                        alpha -= 0.02;
                        particle.alpha = alpha;

                        if (alpha > 0) {
                            requestAnimationFrame(fadeOut);
                        } else {
                            this.pixi.stage.removeChild(particle);
                        }
                    };
                    setTimeout(fadeOut, 1000);
                }
            };
            setTimeout(animate, i * 100);
        }

        // 淡入动画
        let alpha = 0;
        const fadeIn = () => {
            alpha += 0.05;
            winSprite.alpha = alpha;

            if (alpha < 1) {
                requestAnimationFrame(fadeIn);
            } else {
                // 3秒后淡出
                setTimeout(() => {
                    const fadeOut = () => {
                        alpha -= 0.05;
                        winSprite.alpha = alpha;

                        if (alpha > 0) {
                            requestAnimationFrame(fadeOut);
                        } else {
                            this.pixi.stage.removeChild(winSprite);
                        }
                    };
                    fadeOut();
                }, 3000);
            }
        };
        fadeIn();
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
        } else if (this.gameState === "paused") {
            // 暂停状态下不更新游戏逻辑，但继续渲染
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    handleClick() {
        if (this.gameState === "waiting" || this.gameState === "gameover" || this.gameState === "win") {
            this.startGame();
        } else if (this.gameState === "playing") {
            this.reversePlayer();
        } else if (this.gameState === "paused") {
            this.resumeGame();
        }
    }

    togglePause() {
        if (this.gameState === "playing") {
            this.gameState = "paused";
            this.pauseButton.text = '▶️';
            this.instructionText.text = "游戏暂停中，点击继续";
            this.instructionText.visible = true;
        } else if (this.gameState === "paused") {
            this.resumeGame();
        }
    }

    resumeGame() {
        this.gameState = "playing";
        this.pauseButton.text = '⏸️';
        this.instructionText.visible = false;
    }

    destroy() {
        this.cleanupLevel();
        if (this.pixi) {
            this.pixi.destroy(true);
        }
    }
}

const gameApp = new GameApp();
const pixiContainer = ref(null);

onMounted(() => {
    gameApp.init();
    gameApp.initGame();

    // 添加点击事件
    const handleClick = () => {
        gameApp.handleClick();
    };

    // 添加键盘事件
    const handleKeyDown = (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            gameApp.handleClick();
        } else if (event.code === 'KeyP') {
            event.preventDefault();
            gameApp.togglePause();
        }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    // 清理事件监听器
    onUnmounted(() => {
        document.removeEventListener('click', handleClick);
        document.removeEventListener('keydown', handleKeyDown);
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
