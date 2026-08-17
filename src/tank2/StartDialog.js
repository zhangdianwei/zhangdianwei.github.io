import * as PIXI from 'pixi.js'
import Dialog from './Dialog.js'
import PlayDialog from './PlayDialog.js'

export default class StartDialog extends Dialog {
    onCreate() {
        this.createLogo()
        this.createMenu()
    }

    onResize(screen) {
        this.position.set(screen.width / 2, screen.height / 2)
    }

    createLogo() {
        this.logo = this.addChild(new PIXI.Sprite(this.app.textures.startLogo))
        this.logo.anchor.set(0.5)
        this.logo.width = 720
        this.logo.height = 720 * this.logo.texture.height / this.logo.texture.width
        this.logo.position.set(0, -105)
    }

    createMenu() {
        const cursor = this.addChild(new PIXI.Sprite(this.app.textures.playerRun1))
        cursor.anchor.set(0.5)
        cursor.position.set(-132, 132)
        cursor.width = 48
        cursor.height = 48

        const label = this.addChild(new PIXI.Text('1 PLAYER', {
            fontFamily: 'Courier New, monospace',
            fontSize: 38,
            fontWeight: 'bold',
            fill: 0xF5EEE0,
            letterSpacing: 2,
        }))
        label.anchor.set(0, 0.5)
        label.position.set(-82, 132)
    }

    onSinglePlayer() {
        this.app.resetPlayerData()
        this.app.dialogMgr.replace(PlayDialog)
    }

    onControl(control, pressed) {
        if (pressed && (control === 'a' || control === 'start')) this.onSinglePlayer()
    }
}
