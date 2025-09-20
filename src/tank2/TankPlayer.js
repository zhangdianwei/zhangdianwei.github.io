import * as PIXI from 'pixi.js';
import { createSpriteSeqAnim } from './SpriteSeqAnim.js';
import { TankApp } from './TankApp.js';
import TankBase from './TankBase.js';
import { Dir, TileSize } from './TileType.js';

export default class TankPlayer extends TankBase {

    destroy() {
        super.destroy();
    }
    
} 