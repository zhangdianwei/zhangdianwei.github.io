
class GameLogic {
    constructor() {
        setInterval(this.onTick.bind(this), 0);

        window.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        window.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        window.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));

        // window.controls.enabled = false;
    }

    onTick(dt) {
    }

    updateCamera() {
    }

    onTouchStart(event) {
    }
    onTouchEnd(event) {
    }
    onMouseDown(event) {
    }
    onMouseMove(event) {
    }
    onMouseUp(event) {

    }

}
export { GameLogic }