import * as PIXI from 'pixi.js';

export default class TetrisTile extends PIXI.Container {
    constructor(game, colorIndex) {
        super();
        this.game = game;
        this.colorIndex = colorIndex;

        let textureUrl = 'tetris/tile' + (colorIndex+1) + '.png';
        let texture = this.game.textures[textureUrl];
        this.image = new PIXI.Sprite(texture);
        this.image.anchor.set(0.5, 0.5);
        this.addChild(this.image);
    }
}