import Dialog from './Dialog.js'
import PlayMgr from './PlayMgr.js'
import ResultDialog from './ResultDialog.js'

export default class PlayDialog extends Dialog {
    onCreate(initialValue) {
        this.playMgr = this.use(
            new PlayMgr(initialValue, () => {
                this.timeout(() => this.app.dialogMgr.replace(ResultDialog), 500)
            }),
        )
    }

    onUpdate(delta) {
        this.playMgr.update(delta)
    }

    onResize(screen) {
        this.playMgr?.layout(screen)
    }
}
