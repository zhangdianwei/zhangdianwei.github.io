export default class TetrisNet {
    constructor(game) {
        this.game = game;
        this.pc = null;
        this.dataChannel = null;
        this.isHost = false;
        this.cachedSDP = null;
        this.isFetchingSDP = false;
        this.answerSDP = null;
    }

    emitSDPChanged() {
        this.game.emit('netSDPChanged', {
            sdp: this.cachedSDP,
            isFetching: this.isFetchingSDP
        });
    }

    onSDPGenerated(sdp) {
        console.log('SDP generated:', sdp);
        this.emitSDPChanged();
    }

    onSDPError(err) {
        console.error('SDP error:', err);
        this.emitSDPChanged();
    }

    onAnswerSDPGenerated(sdp) {
        console.log('Answer SDP generated:', sdp);
    }

    onAnswerSDPError(err) {
        console.error('Answer SDP error:', err);
    }

    onConnectionSuccess() {
        console.log('Connection success');
    }

    onConnectionFailed(reason) {
        console.error('Connection failed:', reason);
        this.emitSDPChanged();
    }

    onDataChannelOpen() {
        console.log('Data channel opened');
    }

    onDataChannelClose() {
        console.log('Data channel closed');
    }

    onDataChannelError(err) {
        console.error('Data channel error:', err);
    }

    onDataChannelMessage(data) {
        console.log('Data channel message:', data);
    }

    init() {
        this.fetchSDP();
    }

    getSDP() {
        if (!this.isConnectionValid()) {
            this.cachedSDP = null;
        }
        return this.cachedSDP;
    }

    isConnectionValid() {
        if (!this.pc) return false;

        const iceState = this.pc.iceConnectionState;
        if (['failed', 'disconnected', 'closed'].includes(iceState)) {
            return false;
        }

        if (this.pc.connectionState && ['failed', 'disconnected', 'closed'].includes(this.pc.connectionState)) {
            return false;
        }

        if (!this.dataChannel) return true;
        return this.dataChannel.readyState !== 'closed' && this.dataChannel.readyState !== 'closing';
    }

    getConnectionState() {
        return {
            connectionState: this.pc ? this.pc.connectionState : 'none',
            iceConnectionState: this.pc ? this.pc.iceConnectionState : 'none',
            dataChannelState: this.dataChannel ? this.dataChannel.readyState : 'none',
            isConnected: this.isConnectionValid()
        };
    }

    fetchSDP() {
        const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        if (!RTCPeerConnection) {
            console.error('WebRTC is not supported');
            return;
        }

        if (this.isFetchingSDP) {
            console.log('SDP is already being generated');
            return;
        }

        this.isFetchingSDP = true;

        if (this.pc) this.pc.close();

        this.isHost = true;
        this.pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        this.setupConnectionStateHandlers();
        this.dataChannel = this.pc.createDataChannel('game', { ordered: true });
        this.setupDataChannelHandlers();

        let finished = false;
        const finish = (sdp, error) => {
            if (finished) return;
            finished = true;
            this.isFetchingSDP = false;
            clearTimeout(timeout);
            if (error) {
                this.onSDPError(error);
            } else if (sdp) {
                this.cachedSDP = sdp;
                this.onSDPGenerated(sdp);
            }
        };

        const timeout = setTimeout(() => {
            const sdp = this.pc.localDescription ? this.pc.localDescription.sdp : null;
            finish(sdp, sdp ? null : new Error('Failed to create SDP'));
        }, 10000);

        this.pc.onicegatheringstatechange = () => {
            if (this.pc.iceGatheringState === 'complete' && this.pc.localDescription) {
                finish(this.pc.localDescription.sdp, null);
            }
        };

        this.pc.createOffer()
            .then(offer => this.pc.setLocalDescription(offer))
            .then(() => {
                if (this.pc.iceGatheringState === 'complete' && this.pc.localDescription) {
                    finish(this.pc.localDescription.sdp, null);
                }
            })
            .catch(err => {
                finish(null, err);
            });
    }

    connectSDP(hostSDP) {
        const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        if (!RTCPeerConnection) {
            console.error('WebRTC is not supported');
            return;
        }

        if (this.pc) this.pc.close();

        this.isHost = false;
        this.pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        this.setupConnectionStateHandlers();
        this.pc.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupDataChannelHandlers();
        };

        let finished = false;
        const finish = (sdp, error) => {
            if (finished) return;
            finished = true;
            clearTimeout(timeout);
            if (error) {
                console.error(error.message || error);
                this.onAnswerSDPError(error);
            } else if (sdp) {
                this.answerSDP = sdp;
                this.onAnswerSDPGenerated(sdp);
            }
        };

        const timeout = setTimeout(() => {
            const sdp = this.pc.localDescription ? this.pc.localDescription.sdp : null;
            finish(sdp, sdp ? null : new Error('Failed to create SDP answer'));
        }, 10000);

        this.pc.onicegatheringstatechange = () => {
            if (this.pc.iceGatheringState === 'complete' && this.pc.localDescription) {
                finish(this.pc.localDescription.sdp, null);
            }
        };

        this.pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: hostSDP }))
            .then(() => this.pc.createAnswer())
            .then(answer => this.pc.setLocalDescription(answer))
            .then(() => {
                if (this.pc.iceGatheringState === 'complete' && this.pc.localDescription) {
                    finish(this.pc.localDescription.sdp, null);
                }
            })
            .catch(err => {
                finish(null, err);
            });
    }

    setupConnectionStateHandlers() {
        if (!this.pc) return;

        this.pc.oniceconnectionstatechange = () => {
            const state = this.pc.iceConnectionState;
            if (['failed', 'disconnected'].includes(state)) {
                this.cachedSDP = null;
                this.onConnectionFailed('ICE connection failed');
                this.emitSDPChanged();
            } else if (['connected', 'completed'].includes(state)) {
                this.onConnectionSuccess();
            }
        };

        if (this.pc.onconnectionstatechange !== undefined) {
            this.pc.onconnectionstatechange = () => {
                const state = this.pc.connectionState;
                if (['failed', 'disconnected'].includes(state)) {
                    this.cachedSDP = null;
                    this.onConnectionFailed('Connection failed');
                    this.emitSDPChanged();
                } else if (state === 'connected') {
                    this.onConnectionSuccess();
                }
            };
        }
    }

    setupDataChannelHandlers() {
        if (!this.dataChannel) return;

        this.dataChannel.onopen = () => {
            this.onDataChannelOpen();
        };
        this.dataChannel.onclose = () => {
            if (this.pc && ['failed', 'disconnected'].includes(this.pc.iceConnectionState)) {
                this.cachedSDP = null;
                this.emitSDPChanged();
            }
            this.onDataChannelClose();
        };
        this.dataChannel.onerror = (err) => {
            this.onDataChannelError(err);
        };
        this.dataChannel.onmessage = (event) => {
            this.onDataChannelMessage(event.data);
        };
    }

    send(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(typeof data === 'string' ? data : JSON.stringify(data));
        }
    }

    close() {
        if (this.dataChannel) this.dataChannel.close();
        if (this.pc) this.pc.close();
        this.dataChannel = null;
        this.pc = null;
        this.isHost = false;
        this.cachedSDP = null;
        this.answerSDP = null;
    }
}
