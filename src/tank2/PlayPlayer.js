import PlayTankBase from './PlayTankBase.js'

export default class PlayPlayer extends PlayTankBase {
    onAppearFinish() {
        super.onAppearFinish()
        this.setInvincible(2.5)
    }
}
