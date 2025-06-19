import * as PIXI from 'pixi.js';

class AnimationManager {
    constructor(gameApp) {
        this.gameApp = gameApp;
    }

    // 播放Cell破碎动画
    playCellBreakAnim(cell, result) {
        if (!cell || cell.isDestroyed) return;

        const center = this.getCellCenter(cell);

        // 创建飞向颜色指示器的泡泡
        this.createFlyingBubble(center, cell, result);

        // 创建扩散的泡泡（保持原有效果）
        const bubbles = this.createBubbles(center, cell.color);
        this.animateBubbles(bubbles);

        // 播放分数动画
        this.playScoreAnim(cell, result.score);
    }

    // 获取Cell中心位置
    getCellCenter(cell) {
        const bounds = cell.getDisplayPoints();
        if (bounds.length < 3) return { x: 0, y: 0 };

        return {
            x: bounds.reduce((sum, p) => sum + p.x, 0) / bounds.length,
            y: bounds.reduce((sum, p) => sum + p.y, 0) / bounds.length
        };
    }

    // 创建泡泡
    createBubbles(center, color) {
        const bubbleCount = 12;
        const radius = 50;
        const bubbles = [];

        for (let i = 0; i < bubbleCount; i++) {
            const bubble = this.createSingleBubble(center, radius, i, bubbleCount, color);
            bubbles.push(bubble);
        }

        return bubbles;
    }

    // 创建单个泡泡
    createSingleBubble(center, radius, index, total, color) {
        const bubble = new PIXI.Graphics();
        this.gameApp.effectGraphic.addChild(bubble);

        // 初始位置
        const angle = (index / total) * Math.PI * 2;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y + Math.sin(angle) * radius;

        // 绘制泡泡 - 在本地坐标(0,0)绘制
        const size = Math.random() * 8 + 4;
        bubble.beginFill(color, 0.8);
        bubble.drawCircle(0, 0, size);
        bubble.endFill();

        // 设置泡泡的世界位置
        bubble.position.set(x, y);

        // 设置属性
        Object.assign(bubble, {
            originalX: x,
            originalY: y,
            size: size,
            diffusionAngle: angle,
            diffusionSpeed: Math.random() * 0.5 + 0.5,
            alpha: 1,
            scale: { x: 1, y: 1 }
        });

        return bubble;
    }

    // 动画泡泡
    animateBubbles(bubbles) {
        const duration = 500;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            bubbles.forEach((bubble, index) => {
                this.updateBubble(bubble, progress, index);
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.cleanupBubbles(bubbles);
            }
        };

        animate();
    }

    // 更新单个泡泡
    updateBubble(bubble, progress, index) {
        // 确保泡泡在动画开始时显示
        if (progress <= 0) {
            // 动画开始时，设置初始状态
            bubble.x = bubble.originalX;
            bubble.y = bubble.originalY;
            bubble.scale.set(1);
            bubble.alpha = 1;
            return;
        }

        const easeBubble = 1 - Math.pow(1 - progress, 2);
        const spreadDistance = easeBubble * 80 * bubble.diffusionSpeed;

        // 更新位置 - 从原始位置开始扩散
        bubble.x = bubble.originalX + Math.cos(bubble.diffusionAngle) * spreadDistance;
        bubble.y = bubble.originalY + Math.sin(bubble.diffusionAngle) * spreadDistance;

        // 更新缩放和透明度
        const scale = 1 + easeBubble * 0.8;
        bubble.scale.set(scale);
        bubble.alpha = 1 - easeBubble;
    }

    // 清理泡泡
    cleanupBubbles(bubbles) {
        bubbles.forEach(bubble => {
            if (bubble.parent) {
                bubble.parent.removeChild(bubble);
            }
            bubble.destroy();
        });
    }

    // 播放分数动画
    playScoreAnim(cell, score) {
        const scoreText = new PIXI.Text(`+${score}`, {
            fontFamily: 'Arial',
            fontSize: 72,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 3,
            align: 'center'
        });

        const center = this.getCellCenter(cell);
        scoreText.position.set(center.x, center.y);
        scoreText.anchor.set(0.5, 0.5);

        // 添加到特效层
        this.gameApp.effectGraphic.addChild(scoreText);

        this.animateScore(scoreText, center.y);
    }

    // 动画分数
    animateScore(scoreText, startY) {
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 向上飘动并淡出
            scoreText.y = startY - progress * 50;
            scoreText.alpha = 1 - progress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 移除分数文本
                if (scoreText.parent) {
                    scoreText.parent.removeChild(scoreText);
                }
                scoreText.destroy();
            }
        };

        animate();
    }

    // 播放爆炸动画
    playExplosionAnim(center, color = 0xFF0000) {
        const particles = this.createExplosionParticles(center, color);
        this.animateExplosion(particles);
    }

    // 创建爆炸粒子
    createExplosionParticles(center, color) {
        const particleCount = 20;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Graphics();
            this.gameApp.effectGraphic.addChild(particle);

            const size = Math.random() * 6 + 3;
            particle.beginFill(color, 0.9);
            particle.drawCircle(0, 0, size);
            particle.endFill();

            particle.position.set(center.x, center.y);

            Object.assign(particle, {
                velocity: {
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200
                },
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01,
                size: size
            });

            particles.push(particle);
        }

        return particles;
    }

    // 动画爆炸效果
    animateExplosion(particles) {
        const animate = () => {
            let allDead = true;

            particles.forEach(particle => {
                if (particle.life > 0) {
                    allDead = false;

                    // 更新位置
                    particle.x += particle.velocity.x * 0.016; // 假设60fps
                    particle.y += particle.velocity.y * 0.016;

                    // 减速
                    particle.velocity.x *= 0.98;
                    particle.velocity.y *= 0.98;

                    // 更新生命值
                    particle.life -= particle.decay;

                    // 更新透明度
                    particle.alpha = particle.life;

                    // 更新大小
                    const scale = 1 + (1 - particle.life) * 0.5;
                    particle.scale.set(scale);
                }
            });

            if (allDead) {
                this.cleanupParticles(particles);
            } else {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    // 清理粒子
    cleanupParticles(particles) {
        particles.forEach(particle => {
            if (particle.parent) {
                particle.parent.removeChild(particle);
            }
            particle.destroy();
        });
    }

    // 创建飞向颜色指示器的泡泡
    createFlyingBubble(startPos, cell, result) {
        // 从result中获取颜色索引
        const colorIndex = result.colorIndex;

        // 获取对应的颜色指示器位置
        const targetPos = this.getColorIndicatorPosition(colorIndex);
        if (!targetPos) return;

        const bubble = new PIXI.Graphics();
        this.gameApp.effectGraphic.addChild(bubble);

        // 绘制泡泡
        const size = 24;
        bubble.beginFill(cell.color, 0.9);
        bubble.drawCircle(0, 0, size);
        bubble.endFill();

        // 设置初始位置
        bubble.position.set(startPos.x, startPos.y);

        // 动画飞向目标
        this.animateFlyingBubble(bubble, startPos, targetPos, result);
    }

    // 获取颜色指示器位置
    getColorIndicatorPosition(colorIndex) {
        // 通过gameApp访问UIManager获取颜色指示器位置
        if (this.gameApp && this.gameApp.uiManager && this.gameApp.uiManager.levelColorIndicators) {
            const colorIndicator = this.gameApp.uiManager.levelColorIndicators[colorIndex];
            if (colorIndicator) {
                // 获取颜色指示器在屏幕上的位置
                const globalPos = colorIndicator.toGlobal(new PIXI.Point(0, 0));
                return {
                    x: globalPos.x,
                    y: globalPos.y
                };
            }
        }
        return null;
    }

    // 动画飞向目标
    animateFlyingBubble(bubble, startPos, targetPos, result) {
        const duration = 800;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 使用缓动函数让动画更自然
            const easeProgress = this.easeInOutQuad(progress);

            // 更新位置
            bubble.x = startPos.x + (targetPos.x - startPos.x) * easeProgress;
            bubble.y = startPos.y + (targetPos.y - startPos.y) * easeProgress;

            // 添加一些弧线效果
            const arcHeight = 50;
            bubble.y -= Math.sin(progress * Math.PI) * arcHeight;

            // 更新缩放和透明度
            const scale = 1 + progress * 0.5;
            bubble.scale.set(scale);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 到达目标，播放击中效果
                this.playColorIndicatorHitEffect(result);

                // 清理泡泡
                if (bubble.parent) {
                    bubble.parent.removeChild(bubble);
                }
                bubble.destroy();
            }
        };

        animate();
    }

    // 缓动函数
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    // 播放颜色指示器击中效果
    playColorIndicatorHitEffect(result) {
        if (this.gameApp && this.gameApp.uiManager) {
            this.gameApp.uiManager.playColorIndicatorHitEffect(result);
        }
    }
}

export default AnimationManager; 