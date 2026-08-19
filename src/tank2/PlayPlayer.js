import PlayTankBase from './PlayTankBase.js'

export default class PlayPlayer extends PlayTankBase {
    constructor(dialog, tankType) {
        super(dialog, tankType)
        this.setBulletLevel(dialog.app.data.playerStarLevel || 0)
    }

    upgradeBullet() {
        super.upgradeBullet()
        this.app.data.playerStarLevel = this.bulletLevel
    }

    onAppearFinish() {
        super.onAppearFinish()
        this.setInvincible(2.5)
    }
}
