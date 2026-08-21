import PlayTankBase from './PlayTankBase.js'

export default class PlayPlayer extends PlayTankBase {
    constructor(dialog, tankType) {
        super(dialog, tankType)
        this.moveSoundPlaying = false
        this.setBulletLevel(dialog.app.data.playerStarLevel || 0)
    }

    upgradeBullet() {
        super.upgradeBullet()
        this.app.data.playerStarLevel = this.bulletLevel
    }

    onAppearFinish() {
        super.onAppearFinish()
        this.setInvincible(2.5)
        this.syncMoveSound()
    }

    setMoving(moving) {
        super.setMoving(moving)
        this.syncMoveSound()
    }

    syncMoveSound() {
        const playing = (this.isMoving || this.isSliding()) && !this.isDead && !this.appearAnim
        if (playing === this.moveSoundPlaying) return
        this.moveSoundPlaying = playing
        if (playing) this.app.audioMgr.play('move', { loop: true, volume: 1.3 })
        else this.app.audioMgr.stop('move')
    }

    makeDead() {
        super.makeDead()
        this.syncMoveSound()
    }

    update(deltaTime) {
        super.update(deltaTime)
        this.syncMoveSound()
    }
}
