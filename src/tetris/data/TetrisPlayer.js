export default class TetrisPlayer {
    constructor(options = {}) {
        this.userId = options.userId;
        this.actorId = options.actorId || null;
        this.isMaster = options.isMaster || false;
        this.isRobot = options.isRobot || false;
        this.customProperties = options.customProperties || {};
        this.frames = []; // 操作记录数组，每个元素为 {elapsed, ...操作细节}
    }

    static generateUserId(prefix) {
        // const storageKey = 'tetris.userId';
        // const storedUserId = localStorage.getItem(storageKey);
        
        // if (storedUserId) {
        //     return storedUserId;
        // }
        
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const time = (Date.now() % 100).toString().padStart(2, '0');
        const userId = `${prefix}${random}${time}`;
        
        // localStorage.setItem(storageKey, userId);
        return userId;
    }

    static fromJson(json) {
        return new TetrisPlayer({
            userId: json.userId,
            isRobot: json.isRobot,
            customProperties: json.customProperties
        });
    }

    toJson() {
        return {
            userId: this.userId,
            isRobot: this.isRobot,
            customProperties: this.customProperties
        };
    }

}
