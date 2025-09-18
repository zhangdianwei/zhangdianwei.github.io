import * as PIXI from 'pixi.js';

// 通用定时调度器，基于 PIXI.Ticker.shared，interval 单位为“秒”
// 提供三种方法：
// - tick(callback, interval, pixiObj?): 周期性调用，返回 id，可用于移除；若提供 pixiObj，被移除时自动取消
// - tickOnce(callback, interval, pixiObj?): 仅调用一次，返回 id；若提供 pixiObj，被移除时自动取消
// - removeTick(idOrCallback): 取消周期或一次性调用（支持传入 id 或原始回调引用）
export default class Ticker {
    constructor() {
        this._ticker = PIXI.Ticker.shared;
        this._entries = []; // [{ id, cb, interval, acc, once, target?, _onRemoved? }]
        this._running = false;
        this._onTick = this._onTick.bind(this);
    }

    // 开始监听帧驱动（当有任务时自动启动）
    _ensureRunning() {
        if (!this._running) {
            this._ticker.add(this._onTick, this);
            this._running = true;
        }
    }

    // 当没有任务时自动停止监听，节省资源
    _maybeStop() {
        if (this._running && this._entries.length === 0) {
            this._ticker.remove(this._onTick, this);
            this._running = false;
        }
    }

    _onTick() {
        // 使用 deltaMS 转为秒，更精确，避免依赖 FPS 变化
        const dt = this._ticker.deltaMS / 1000;
        if (this._entries.length === 0) return;

        const toRemove = new Set();
        for (const ent of this._entries) {
            // interval 为 0 表示每帧都回调
            if (ent.interval <= 0) {
                try {
                    ent.cb(dt);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error('Ticker tick error:', e);
                }
                if (ent.once) toRemove.add(ent.id);
                continue;
            }

            ent.acc += dt;
            // 允许在低帧率时补齐多次调用
            while (ent.acc >= ent.interval) {
                ent.acc -= ent.interval;
                try {
                    ent.cb(ent.interval);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error('Ticker tick error:', e);
                }
                if (ent.once) {
                    toRemove.add(ent.id);
                    break;
                }
            }
        }

        if (toRemove.size) {
            for (const id of toRemove) this._removeById(id);
            this._maybeStop();
        }
    }

    _genId() {
        return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    _removeById(id) {
        const idx = this._entries.findIndex(e => e.id === id);
        if (idx === -1) return false;
        const ent = this._entries[idx];
        // 清理事件绑定
        if (ent && ent.target && typeof ent.target.off === 'function' && ent._onRemoved) {
            try { ent.target.off('removed', ent._onRemoved); } catch (_) {}
        }
        this._entries.splice(idx, 1);
        return true;
    }

    _bindAutoRemove(entry) {
        const target = entry.target;
        if (!target || typeof target.on !== 'function') return;
        const handler = () => {
            this.removeTick(entry.id);
        };
        entry._onRemoved = handler;
        try { target.on('removed', handler); } catch (_) {}
    }

    // 周期性任务：interval(秒) 后触发一次，之后每隔 interval 触发
    tick(callback, interval = 0, pixiObj = null) {
        const id = this._genId();
        const entry = { id, cb: callback, interval: Number(interval) || 0, acc: 0, once: false, target: pixiObj };
        this._entries.push(entry);
        if (pixiObj) this._bindAutoRemove(entry);
        this._ensureRunning();
        return id;
    }

    // 单次任务：interval(秒) 后触发一次
    tickOnce(callback, interval = 0, pixiObj = null) {
        const id = this._genId();
        const entry = { id, cb: callback, interval: Number(interval) || 0, acc: 0, once: true, target: pixiObj };
        this._entries.push(entry);
        if (pixiObj) this._bindAutoRemove(entry);
        this._ensureRunning();
        return id;
    }

    // 取消任务：支持传入 id 或原始 callback 引用
    removeTick(idOrCallback) {
        if (typeof idOrCallback === 'string') {
            this._removeById(idOrCallback);
            this._maybeStop();
            return;
        }
        if (typeof idOrCallback === 'function') {
            this._entries = this._entries.filter(e => e.cb !== idOrCallback);
            this._maybeStop();
        }
    }

    // 取消全部
    clear() {
        this._entries = [];
        this._maybeStop();
    }
}

// 便捷的全局实例
export const GlobalTicker = new Ticker();
