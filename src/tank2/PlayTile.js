import * as PIXI from 'pixi.js'
import { TileType, TileSize } from './TileType.js'

export default class PlayTile extends PIXI.Container {
  constructor(dialog, row, col, type) {
    super()

    this.dialog = dialog
    this.app = dialog.app
    this.row = row
    this.col = col
    this.type = type
    this.tileSize = TileSize
    this.blood = 2

    this.createSprite()
    this.setPosition()
  }

  getBlood() {
    return this.blood
  }

  setBlood(blood) {
    this.blood = blood
    if (this.blood === 1) {
      this.sprite.alpha = 0.5
    }
  }

  createSprite() {
    switch (this.type) {
      case TileType.BRICK:
        this.sprite = new PIXI.Sprite(this.app.textures.tileBrick)
        break
      case TileType.IRON:
        this.sprite = new PIXI.Sprite(this.app.textures.tileIron)
        break
      case TileType.GRASS:
        this.sprite = new PIXI.Sprite(this.app.textures.tileGrass)
        break
      case TileType.WATER:
        this.sprite = new PIXI.Sprite(this.app.textures.tileWater)
        break
      default:
        this.sprite = new PIXI.Graphics()
        this.sprite.beginFill(0x808080)
        this.sprite.drawRect(0, 0, this.tileSize, this.tileSize)
        this.sprite.endFill()
    }

    this.sprite.width = this.tileSize
    this.sprite.height = this.tileSize
    this.addChild(this.sprite)
  }

  setPosition() {
    this.x = this.col * this.tileSize
    this.y = this.row * this.tileSize
  }

  setType(newType) {
    this.type = newType
    this.removeChild(this.sprite)
    this.createSprite()
    this.setPosition()
  }

  getType() {
    return this.type
  }

  makeDead() {
    this.parent?.removeChild(this)
  }
}
