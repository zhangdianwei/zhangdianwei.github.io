import * as PIXI from 'pixi.js';

export default class Ticker {
    constructor() {

        this._entries = [];
        
        this._ticker = new PIXI.Ticker();
        this._ticker.start();
        
        this._onTick = this._onTick.bind(this);
        this._ticker.add(this._onTick, this);
    }


    _onTick() {
        const dt = this._ticker.deltaMS / 1000;
        if (this._entries.length === 0) return;

        const toRemove = new Set();
        for (const ent of this._entries) {
            if (ent.interval <= 0) {
                try {
                    ent.cb(dt);
                } catch (e) {
                    console.error('Ticker tick error:', e);
                }
                if (ent.once) toRemove.add(ent.id);
                continue;
            }

            ent.acc += dt;
            while (ent.acc >= ent.interval) {
                ent.acc -= ent.interval;
                try {
                    ent.cb(ent.interval);
                } catch (e) {
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
        }
    }

    _genId() {
        return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    _removeById(id) {
        const idx = this._entries.findIndex(e => e.id === id);
        if (idx === -1) return false;
        const ent = this._entries[idx];
        if (ent && ent.target && typeof ent.target.off === 'function' && ent._onRemoved) {
            try { ent.target.off('removed', ent._onRemoved); } catch (_) {}
        }
        this._entries.splice(idx, 1);
        return true;
    }

    _bindAutoRemove(entry) {
        const target = entry.target;
        if (!target || typeof target.on !== 'function') return;
        const handler = () => this.removeTick(entry.id);
        entry._onRemoved = handler;
        try { target.on('removed', handler); } catch (_) {}
    }

    tick(callback, interval = 0, pixiObj = null) {
        const id = this._genId();
        const entry = { id, cb: callback, interval: Number(interval) || 0, acc: 0, once: false, target: pixiObj };
        this._entries.push(entry);
        if (pixiObj) this._bindAutoRemove(entry);
        return id;
    }

    tickOnce(callback, interval = 0, pixiObj = null) {
        const id = this._genId();
        const entry = { id, cb: callback, interval: Number(interval) || 0, acc: 0, once: true, target: pixiObj };
        this._entries.push(entry);
        if (pixiObj) this._bindAutoRemove(entry);
        return id;
    }

    removeTick(idOrCallback) {
        if (typeof idOrCallback === 'string') {
            this._removeById(idOrCallback);
            return;
        }
        if (typeof idOrCallback === 'function') {
            this._entries = this._entries.filter(e => e.cb !== idOrCallback);
        }
    }

    stop() {
        this._entries = [];
        this._ticker.stop();
    }
}

export const GlobalTicker = new Ticker();
