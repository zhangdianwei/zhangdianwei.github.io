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
        name: "新手村",
        targetScore: 5,
        path: {
            type: "line",
            start: { x: 0.1, y: 0.5 },
            end: { x: 0.9, y: 0.5 },
            width: 0.03
        },
        obstacles: {
            interval: 1800,
            types: ["hankey", "hankey", "bomb"] // 70% 狗屎, 30% 炸弹
        },
        playerSpeed: 0.004
    },
    {
        name: "弯道挑战",
        targetScore: 8,
        path: {
            type: "arc",
            center: { x: 0.5, y: 0.5 },
            radius: 0.2,
            startAngle: 0,
            endAngle: Math.PI,
            width: 0.03
        },
        obstacles: {
            interval: 1600,
            types: ["hankey", "hankey", "hankey", "bomb"] // 75% 狗屎, 25% 炸弹
        },
        playerSpeed: 0.005
    },
    {
        name: "波浪之旅",
        targetScore: 12,
        path: {
            type: "wave",
            start: { x: 0.1, y: 0.5 },
            end: { x: 0.9, y: 0.5 },
            amplitude: 0.08,
            frequency: 3,
            width: 0.03
        },
        obstacles: {
            interval: 1400,
            types: ["hankey", "hankey", "bomb", "bomb"] // 50% 狗屎, 50% 炸弹
        },
        playerSpeed: 0.006
    },
    {
        name: "环形赛道",
        targetScore: 15,
        path: {
            type: "circle",
            center: { x: 0.5, y: 0.5 },
            radius: 0.15,
            width: 0.03
        },
        obstacles: {
            interval: 1200,
            types: ["hankey", "bomb", "bomb"] // 33% 狗屎, 67% 炸弹
        },
        playerSpeed: 0.007
    },
    {
        name: "终极挑战",
        targetScore: 20,
        path: {
            type: "polyline",
            points: [
                { x: 0.1, y: 0.3 },
                { x: 0.3, y: 0.6 },
                { x: 0.5, y: 0.3 },
                { x: 0.7, y: 0.6 },
                { x: 0.9, y: 0.3 }
            ],
            width: 0.03
        },
        obstacles: {
            interval: 1000,
            types: ["hankey", "bomb", "bomb", "bomb"] // 25% 狗屎, 75% 炸弹
        },
        playerSpeed: 0.008
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
                    x: this.path.center.x * width + Math.cos(angle) * this.path.radius * width,
                    y: this.path.center.y * height + Math.sin(angle) * this.path.radius * height
                };
            case "wave":
                const x = this.path.start.x * width + (this.path.end.x * width - this.path.start.x * width) * t;
                const waveY = Math.sin(t * this.path.frequency * Math.PI * 2) * this.path.amplitude * height;
                return {
                    x: x,
                    y: this.path.start.y * height + waveY
                };
            case "circle":
                const circleAngle = t * Math.PI * 2;
                return {
                    x: this.path.center.x * width + Math.cos(circleAngle) * this.path.radius * width,
                    y: this.path.center.y * height + Math.sin(circleAngle) * this.path.radius * height
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
        return this.sprite.y > this.pixi.screen.height + 100;
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
    }

    init() {
        const options = { designWidth: 1080, designHeight: 1920, scale: 0.9 };
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
            star.x = Math.random() * this.pixi.screen.width;
            star.y = Math.random() * this.pixi.screen.height;
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
        if (this.sounds[name] && this.audioContext.state === 'running') {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[name];
            source.connect(this.audioContext.destination);
            source.start();
        }
    }

    initUI() {
        // 分数显示 (目标：1/8 格式)
        this.scoreText = new PIXI.Text('目标：0/5', {
            fontFamily: 'Arial',
            fontSize: 56,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 4
        });
        this.scoreText.x = this.pixi.screen.width * 0.85;
        this.scoreText.y = this.pixi.screen.height * 0.05;
        this.pixi.stage.addChild(this.scoreText);

        // 关卡显示
        this.levelText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 4
        });
        this.levelText.x = this.pixi.screen.width * 0.05;
        this.levelText.y = this.pixi.screen.height * 0.05;
        this.pixi.stage.addChild(this.levelText);

        // 游戏标题
        this.titleText = new PIXI.Text('抓住狗屎运', {
            fontFamily: 'Arial',
            fontSize: 64,
            fill: 0xFFFF00,
            stroke: 0x000000,
            strokeThickness: 6
        });
        this.titleText.anchor.set(0.5);
        this.titleText.x = this.pixi.screen.width * 0.5;
        this.titleText.y = this.pixi.screen.height * 0.08;
        this.pixi.stage.addChild(this.titleText);

        // 说明文字
        this.instructionText = new PIXI.Text('点击屏幕开始游戏', {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 6
        });
        this.instructionText.anchor.set(0.5);
        this.instructionText.x = this.pixi.screen.width * 0.5;
        this.instructionText.y = this.pixi.screen.height * 0.35;
        this.pixi.stage.addChild(this.instructionText);

        // 游戏说明
        this.helpText = new PIXI.Text('点击屏幕让角色反向移动\n收集狗屎得分，避开炸弹', {
            fontFamily: 'Arial',
            fontSize: 28,
            fill: 0xCCCCCC,
            stroke: 0x000000,
            strokeThickness: 2,
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
        this.levelText.text = levelConfig.name;

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
        this.pathGraphics.beginFill(0x444444, 0.3);

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
                this.pathGraphics.arc(
                    pathConfig.center.x * width, pathConfig.center.y * height,
                    pathConfig.radius * width, pathConfig.startAngle, pathConfig.endAngle
                );
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
                this.pathGraphics.drawCircle(
                    pathConfig.center.x * width, pathConfig.center.y * height,
                    pathConfig.radius * width
                );
                break;
            case "polyline":
                this.pathGraphics.moveTo(pathConfig.points[0].x * width, pathConfig.points[0].y * height);
                for (let i = 1; i < pathConfig.points.length; i++) {
                    this.pathGraphics.lineTo(pathConfig.points[i].x * width, pathConfig.points[i].y * height);
                }
                break;
        }

        this.pathGraphics.endFill();
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

    createHankeyFlyEffect(x, y) {
        // 创建狗屎精灵
        const hankeySprite = PIXI.Sprite.from('/ballgame/hankey.png');
        hankeySprite.anchor.set(0.5);
        hankeySprite.scale.set(0.3);
        hankeySprite.x = x;
        hankeySprite.y = y;
        this.pixi.stage.addChild(hankeySprite);

        // 目标位置（分数显示区域）
        const targetX = this.pixi.screen.width * 0.85;
        const targetY = this.pixi.screen.height * 0.05;

        // 动画效果
        const startX = x;
        const startY = y;
        const duration = 30; // 帧数
        let frame = 0;

        const animate = () => {
            frame++;
            const progress = frame / duration;

            // 抛物线轨迹
            const currentX = startX + (targetX - startX) * progress;
            const currentY = startY + (targetY - startY) * progress - Math.sin(progress * Math.PI) * 100;

            hankeySprite.x = currentX;
            hankeySprite.y = currentY;

            // 缩小效果
            hankeySprite.scale.set(0.3 - progress * 0.2);

            if (frame < duration) {
                requestAnimationFrame(animate);
            } else {
                this.pixi.stage.removeChild(hankeySprite);
                this.updateUI(); // 更新分数显示
            }
        };
        animate();
    }

    showFailScreen() {
        // 创建失败图片
        const failSprite = PIXI.Sprite.from('/ballgame/player_fail.png');
        failSprite.anchor.set(0.5);
        failSprite.scale.set(0.4);
        failSprite.x = this.pixi.screen.width * 0.5;
        failSprite.y = this.pixi.screen.height * 0.5;
        failSprite.alpha = 0;
        this.pixi.stage.addChild(failSprite);

        // 淡入动画
        let alpha = 0;
        const fadeIn = () => {
            alpha += 0.1;
            failSprite.alpha = alpha;

            if (alpha < 1) {
                requestAnimationFrame(fadeIn);
            } else {
                // 1秒后淡出
                setTimeout(() => {
                    const fadeOut = () => {
                        alpha -= 0.1;
                        failSprite.alpha = alpha;

                        if (alpha > 0) {
                            requestAnimationFrame(fadeOut);
                        } else {
                            this.pixi.stage.removeChild(failSprite);
                        }
                    };
                    fadeOut();
                }, 1000);
            }
        };
        fadeIn();
    }

    showWinScreen() {
        // 创建胜利图片
        const winSprite = PIXI.Sprite.from('/ballgame/player_win.png');
        winSprite.anchor.set(0.5);
        winSprite.scale.set(0.4);
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
