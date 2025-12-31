export default class TetrisPlayer {
    constructor(options = {}) {
        this.userId = options.userId;
        this.actorId = options.actorId || null;
        this.isMaster = options.isMaster || false;
        this.isRobot = options.isRobot || false;
        this.customProperties = options.customProperties || {};
    }

    static generateUserId(prefix) {
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const time = (Date.now() % 100).toString().padStart(2, '0');
        return `${prefix}${random}${time}`;
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
