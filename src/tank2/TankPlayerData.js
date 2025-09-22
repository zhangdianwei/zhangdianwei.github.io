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
    }

    addEnemyDestroyed(enermyType, count){
        if(!this.enermyDestroyed[enermyType]) {
            this.enermyDestroyed[enermyType] = 0;
        }
        this.enermyDestroyed[enermyType] += count;
    }

}