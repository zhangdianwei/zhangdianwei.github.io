import { Client, Event, ReceiverGroup } from '@leancloud/play';

// LeanCloud 配置 - 请到 https://console.leancloud.cn 注册并创建应用，然后填入以下信息
const APP_ID = 'tQwiRbYg8otBOPgaCK273AnT-gzGzoHsz';
const APP_KEY = 'ByK7t7CGtjc4zRip17NiffHI';
const PLAY_SERVER = "https://tqwirbyg.lc-cn-n1-shared.com"; // Play 服务器地址
const GAME_VERSION = '1.0.0'; // 游戏版本号，不同版本的玩家不会匹配到同一个房间

export default class TetrisNet {
    constructor(game) {
        this.game = game;
        this.client = null;
        this.isConnected = false;
        this.isInRoom = false;
    }

    async init() {
        try {
            // 创建 Play 客户端
            this.client = new Client({
                appId: APP_ID,
                appKey: APP_KEY,
                playServer: PLAY_SERVER,
                userId: this.game.userId, // 使用游戏中的 userId
                gameVersion: GAME_VERSION
            });

            // 设置事件监听
            this.setupEventListeners();

            // 连接服务器
            await this.client.connect();
            this.isConnected = true;
            console.log('已连接到 LeanCloud Play 服务器');

            // 尝试加入房间
            await this.joinRoom();
        } catch (error) {
            console.error('初始化网络连接失败:', error);
        }
    }

    setupEventListeners() {
        if (!this.client) return;

        // 监听房间加入事件
        this.client.on(Event.ROOM_JOINED, () => {
            console.log('成功加入房间');
            this.isInRoom = true;
            this.syncPlayerList();
            // 切换到房间视图
            if (this.game && this.game.replaceView) {
                this.game.replaceView("TetrisRoomView");
            }
        });

        // 监听房间创建事件
        this.client.on(Event.ROOM_CREATED, () => {
            console.log('房间创建成功');
            this.isInRoom = true;
            this.syncPlayerList();
            // 切换到房间视图
            if (this.game && this.game.replaceView) {
                this.game.replaceView("TetrisRoomView");
            }
        });

        // 监听玩家加入房间事件
        this.client.on(Event.PLAYER_ROOM_JOINED, (event) => {
            console.log('玩家加入房间:', event);
            this.syncPlayerList();
        });

        // 监听玩家离开房间事件
        this.client.on(Event.PLAYER_ROOM_LEFT, (event) => {
            console.log('玩家离开房间:', event);
            this.syncPlayerList();
        });

        // 监听玩家属性变化事件
        this.client.on(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, (event) => {
            console.log('玩家属性变化:', event);
            this.syncPlayerList();
        });

        // 监听自定义事件
        this.client.on(Event.CUSTOM_EVENT, (event) => {
            this.handleCustomEvent(event);
        });

        // 监听断开连接事件
        this.client.on(Event.DISCONNECT, () => {
            console.warn('与服务器断开连接');
            this.isConnected = false;
            this.isInRoom = false;
        });

        // 监听错误事件
        this.client.on(Event.ERROR, (error) => {
            console.error('Play 客户端错误:', error);
        });
    }

    async joinRoom() {
        if (!this.client || !this.isConnected) {
            console.warn('客户端未连接，无法加入房间');
            return;
        }

        try {
            // 尝试随机匹配房间
            await this.client.joinRandomRoom();
        } catch (error) {
            // 如果没有可加入的房间（错误码 4301），创建新房间
            if (error.code === 4301) {
                console.log('没有可加入的房间，创建新房间');
                const roomOptions = {
                    maxPlayerCount: 10, // 房间最大人数（最多支持 10 人）
                    playerTtl: 120, // 玩家掉线后的保留时间（秒）
                };
                await this.client.createRoom({ roomOptions });
            } else {
                console.error('加入房间失败:', error);
            }
        }
    }

    syncPlayerList() {
        if (!this.client || !this.isInRoom) return;

        try {
            const room = this.client.room;
            if (!room) return;

            // 获取房间内的所有玩家
            const players = [];
            const playerList = room.playerList || [];
            
            playerList.forEach((player) => {
                players.push({
                    userId: player.userId,
                    actorId: player.actorId,
                    isMaster: player.isMaster,
                    customProperties: player.customProperties || {}
                });
            });

            // 更新游戏中的玩家列表
            this.game.setPlayers(players);
        } catch (error) {
            console.error('同步玩家列表失败:', error);
        }
    }

    async updatePlayerList() {
        // 当本地玩家列表变化时，同步到服务器
        // 注意：在 Play SDK 中，玩家列表由服务器管理，这里主要用于更新玩家自定义属性
        if (!this.client || !this.isInRoom) return;

        try {
            const player = this.client.player;
            if (player) {
                // 可以更新玩家的自定义属性
                // player.setCustomProperties({ ... });
            }
        } catch (error) {
            console.error('更新玩家列表失败:', error);
        }
    }

    // 发送自定义事件
    sendEvent(eventId, eventData, receiverGroup = ReceiverGroup.All) {
        if (!this.client || !this.isInRoom) {
            console.warn('未在房间中，无法发送事件');
            return;
        }

        try {
            const options = {
                receiverGroup: receiverGroup
            };
            this.client.sendEvent(eventId, eventData, options);
        } catch (error) {
            console.error('发送事件失败:', error);
        }
    }

    // 处理自定义事件
    handleCustomEvent(event) {
        const { eventId, eventData, senderId } = event;
        // 在这里处理收到的自定义事件
        // 例如：游戏状态同步、玩家操作等
        console.log('收到自定义事件:', eventId, eventData, senderId);
        
        // 处理开始游戏事件
        if (eventId === 1 && eventData && eventData.action === 'startGame') {
            // 切换到游戏视图
            if (this.game && this.game.replaceView) {
                this.game.replaceView("TetrisGameView");
            }
        }
    }

    async close() {
        // 清理资源
        try {
            if (this.client) {
                // 离开房间
                if (this.isInRoom) {
                    await this.client.leaveRoom();
                    this.isInRoom = false;
                }

                // 关闭连接
                if (this.isConnected) {
                    this.client.close();
                    this.isConnected = false;
                }
            }

            this.client = null;
            console.log('网络连接已关闭');
        } catch (error) {
            console.error('关闭网络连接失败:', error);
        }
    }
}
