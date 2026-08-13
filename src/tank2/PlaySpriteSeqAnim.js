import * as PIXI from 'pixi.js'

const animDefs = {
  tankAppear: {
    keys: ['tankAppear1', 'tankAppear2', 'tankAppear3', 'tankAppear4', 'tankAppear5', 'tankAppear6'],
    frameRate: 8,
  },
  tankExplode: {
    keys: ['tankExplode1', 'tankExplode2', 'tankExplode3'],
    frameRate: 8,
  },
}

export default class PlaySpriteSeqAnim extends PIXI.Container {
  constructor(app, keys, frameRate = 8, onComplete = null) {
    super()

    this.frameRate = frameRate
    this.frameTime = 1 / frameRate
    this.accumulator = 0
    this.currentFrame = 0
    this.isPlaying = false
    this.onComplete = onComplete

    this.sprites = keys.map((key) => {
      const sprite = new PIXI.Sprite(app.textures[key])
      sprite.anchor.set(0.5)
      sprite.visible = false
      this.addChild(sprite)
      return sprite
    })

    this.visible = false
  }

  play() {
    this.isPlaying = true
    this.currentFrame = 0
    this.accumulator = 0
    this.visible = true
    this.updateFrame()
  }

  update(deltaTime) {
    if (!this.isPlaying) return

    this.accumulator += deltaTime
    let updated = false
    while (this.accumulator >= this.frameTime) {
      this.accumulator -= this.frameTime
      this.currentFrame++
      updated = true

      if (this.currentFrame >= this.sprites.length) {
        this.stop()
        this.onComplete?.()
        return
      }
    }
    if (updated) this.updateFrame()
  }

  updateFrame() {
    this.sprites.forEach((sprite, index) => {
      sprite.visible = index === this.currentFrame
    })
  }

  stop() {
    this.isPlaying = false
    this.visible = false
    this.removeFromParent()
  }
}

export function createSpriteSeqAnim(app, animName, onComplete) {
  const def = animDefs[animName]
  const anim = new PlaySpriteSeqAnim(app, def.keys, def.frameRate, onComplete)
  anim.play()
  return anim
}
