export class NetworkManager {
    constructor() {
        this.ws = null
        this.callbacks = {}
        this.sessionId = localStorage.getItem('connect4_sessionId')
        this.roomCode = localStorage.getItem('connect4_roomCode')
    }

    connect(url) {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
            console.log("Connected to server")
            if (this.roomCode && this.sessionId) {
                console.log("Attempting to rejoin room:", this.roomCode)
                this.rejoinRoom(this.roomCode, this.sessionId)
            }
            if (this.callbacks.onConnected) this.callbacks.onConnected()
        }

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
        }

        this.ws.onclose = () => {
            console.log("Disconnected from server")
            if (this.callbacks.onDisconnected) this.callbacks.onDisconnected()
        }

        this.ws.onerror = (e) => {
            console.error("WS Error", e)
            if (this.callbacks.onConnectionError) this.callbacks.onConnectionError(e)
        }
    }

    on(event, callback) {
        this.callbacks[event] = callback
    }

    send(type, payload = {}) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, payload }))
        } else {
            console.warn("WS not connected")
        }
    }

    createRoom() {
        this.send('create_room')
    }

    joinRoom(code) {
        this.send('join_room', { code })
    }

    rejoinRoom(code, sessionId) {
        this.send('rejoin_room', { code, sessionId })
    }

    makeMove(col) {
        this.send('make_move', { col })
    }

    requestRematch() {
        this.send('request_rematch')
    }

    clearSession() {
        localStorage.removeItem('connect4_sessionId')
        localStorage.removeItem('connect4_roomCode')
        this.sessionId = null
        this.roomCode = null
    }

    handleMessage(data) {
        const { type, payload } = data
        console.log("RX:", type, payload)

        switch (type) {
            case 'room_created':
                this.sessionId = payload.sessionId
                this.roomCode = payload.code
                localStorage.setItem('connect4_sessionId', this.sessionId)
                localStorage.setItem('connect4_roomCode', this.roomCode)
                if (this.callbacks.onRoomCreated) this.callbacks.onRoomCreated(payload.code)
                break
            case 'game_start':
                if (payload.sessionId) {
                    this.sessionId = payload.sessionId
                    this.roomCode = payload.code
                    localStorage.setItem('connect4_sessionId', this.sessionId)
                    localStorage.setItem('connect4_roomCode', this.roomCode)
                }
                if (this.callbacks.onGameStart) this.callbacks.onGameStart(payload)
                break
            case 'game_state_update':
                if (this.callbacks.onGameStateUpdate) this.callbacks.onGameStateUpdate(payload)
                break
            case 'error':
                if (payload.includes('Room not found')) {
                    this.clearSession()
                }
                if (this.callbacks.onError) this.callbacks.onError(payload)
                break
            case 'game_over':
                if (this.callbacks.onGameOver) this.callbacks.onGameOver(payload)
                break
            case 'rematch_pending':
                if (this.callbacks.onRematchPending) this.callbacks.onRematchPending(payload)
                break
            case 'player_disconnected':
                if (this.callbacks.onPlayerDisconnected) this.callbacks.onPlayerDisconnected(payload)
                break
        }
    }
}
