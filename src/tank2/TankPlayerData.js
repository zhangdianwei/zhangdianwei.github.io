export default class TankPlayerData {
    constructor() {
        this.resetPlayerData();
        this.resetOneLevelData();
    }

    resetPlayerData(){
        this.levelId = 0; // 当前关卡ID
        this.playerLives = 3; // 还有几条命
    }

    resetOneLevelData(){
        this.enermyDestroyed = []; // 敌人被摧毁的数量
        this.levelEndType = 0; // 1=胜利 2=失败
        this.levelStartTime = Date.now(); // 关卡开始时间
    }

    addEnemyDestroyed(enermyType, count){
        if(!this.enermyDestroyed[enermyType]) {
            this.enermyDestroyed[enermyType] = 0;
        }
        this.enermyDestroyed[enermyType] += count;
    }

    // 计算关卡用时
    calculateLevelTime() {
        const currentTime = Date.now();
        return Math.floor((currentTime - this.levelStartTime) / 1000);
    }

    // 获取格式化的关卡用时
    getFormattedLevelTime() {
        const time = this.calculateLevelTime();
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}