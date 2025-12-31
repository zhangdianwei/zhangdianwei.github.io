import { Client, Event, ReceiverGroup } from '@leancloud/play';
import TetrisPlayer from './TetrisPlayer.js';
import { NetEventId } from './TetrisEvents.js';

// LeanCloud 配置 - 请到 https://console.leancloud.cn 注册并创建应用，然后填入以下信息
const APP_ID = 'tQwiRbYg8otBOPgaCK273AnT-gzGzoHsz';
const APP_KEY = 'ByK7t7CGtjc4zRip17NiffHI';
const PLAY_SERVER = "https://tqwirbyg.lc-cn-n1-shared.com";
const GAME_VERSION = '1.0.0';

export const NetState = {
    IDLE: 'idle',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    JOINING: 'joining',
    IN_ROOM: 'in_room'
};

export default class TetrisNet {
    constructor(game) {
        this.game = game;
        this.client = null;
        this.state = NetState.IDLE;
    }

    init() {
    }

    async connect() {
        if (this.state !== NetState.IDLE) {
            return;
        }

        try {
            this.state = NetState.CONNECTING;
            
            this.client = new Client({
                appId: APP_ID,
                appKey: APP_KEY,
                playServer: PLAY_SERVER,
                userId: this.game.userId,
                gameVersion: GAME_VERSION
            });

            this.setupEventListeners();

            await this.client.connect();
            
            if (this.state === NetState.CONNECTING) {
                this.state = NetState.CONNECTED;
                await this.joinRoom();
            }
        } catch (error) {
            console.error('连接服务器失败:', error);
            this.state = NetState.IDLE;
            this.game.Toast('连接服务器失败');
        }
    }

    setupEventListeners() {
        if (!this.client) return;

        this.client.on('connected', () => {
            console.log('已连接到服务器');
        });


        this.client.on(Event.PLAYER_ROOM_JOINED, (event) => {
            console.log('玩家加入房间:', event);
            this.syncPlayerListToLocal();
        });

        this.client.on(Event.PLAYER_ROOM_LEFT, (event) => {
            console.log('玩家离开房间:', event);
            this.syncPlayerListToLocal();
        });

        // 监听玩家属性变化事件
        this.client.on(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, (event) => {
            console.log('玩家属性变化:', event);
            this.syncPlayerListToLocal();
        });

        // 监听自定义事件
        this.client.on(Event.CUSTOM_EVENT, (event) => {
            this.handleCustomEvent(event);
        });

        this.client.on(Event.DISCONNECTED, () => {
            console.warn('与服务器断开连接');
            if (this.state !== NetState.IDLE) {
                this.state = NetState.IDLE;
                this.game.Toast('连接已断开');
            }
        });

        // 监听错误事件
        this.client.on(Event.ERROR, (error) => {
            console.error('Play 客户端错误:', error);
        });
    }

    async joinRoom() {
        if (!this.client) {
            console.warn('客户端未初始化');
            return;
        }

        if (this.state !== NetState.CONNECTED) {
            console.warn('未连接或正在连接中，无法加入房间');
            return;
        }

        try {
            this.state = NetState.JOINING;
            
            const room = await this.client.joinRandomRoom();
            this.onRoomJoined(room);
        } catch (error) {
            if (this.state === NetState.JOINING) {
                if (error.code === 4301) {
                    console.log('没有可加入的房间，创建新房间');
                    const roomOptions = {
                        maxPlayerCount: 10,
                        playerTtl: 120,
                    };
                    const room = await this.client.createRoom({ roomOptions });
                    this.onRoomJoined(room);
                } else {
                    console.error('加入房间失败:', error);
                    this.state = NetState.CONNECTED;
                    this.game.Toast('加入房间失败');
                }
            }
        }
    }

    onRoomJoined(room) {
        console.log('成功加入房间');
        this.state = NetState.IN_ROOM;
        this.syncPlayerListToLocal();
        this.game.replaceView("TetrisRoomView");
    }

    syncPlayerListToLocal() {
        if (!this.client || this.state !== NetState.IN_ROOM) return;

        try {
            const room = this.client.room;
            if (!room) return;
            const playerList = room.playerList || [];
            this.game.syncFromLean(playerList);
        } catch (error) {
            console.error('同步玩家列表失败:', error);
        }
    }

    // 发送自定义事件
    sendEvent(eventId, eventData, receiverGroup = ReceiverGroup.All) {
        if (!this.client || this.state !== NetState.IN_ROOM) {
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
        console.log('收到自定义事件:', eventId, eventData, senderId);
        
        if (eventId === NetEventId.StartGame) {
            this.game.GameStartOption.initByMulti(eventData);
            this.game.replaceView("TetrisGameView");
        } else if (eventId === NetEventId.SyncRobots && eventData && eventData.robots) {
            eventData.robots.forEach(robotData => {
                if (!this.game.players.find(p => p.userId === robotData.userId)) {
                    this.game.players.push(TetrisPlayer.fromJson(robotData));
                }
            });
        }
    }

    async leaveRoom() {
        if (!this.client || this.state !== NetState.IN_ROOM) {
            return;
        }

        this.state = NetState.CONNECTED;
        this.client.leaveRoom();
    }

    async close() {
        try {
            if (this.client) {
                if (this.state === NetState.IN_ROOM) {
                    await this.client.leaveRoom();
                }
                this.client.close();
            }
            this.client = null;
            this.state = NetState.IDLE;
            console.log('网络连接已关闭');
        } catch (error) {
            console.error('关闭网络连接失败:', error);
        }
    }

}
