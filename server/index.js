import { WebSocketServer, WebSocket } from 'ws';
import { GameState } from './game-state.js';
import crypto from 'node:crypto';

const wss = new WebSocketServer({ port: 8080 });

const rooms = new Map(); // code -> { gameState, players: Map(sessionId -> ws), playerOrder: [sessionId, sessionId], rematchRequests: [] }
const ROOM_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function generateSessionId() {
    return crypto.randomUUID();
}

console.log('Server started on port 8080');

wss.on('connection', (ws) => {
    ws.sessionId = generateSessionId();
    ws.roomCode = null;
    ws.playerIndex = 0; // 1 or 2
    ws.isAlive = true;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (e) {
            console.error('Invalid message', e);
        }
    });

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('close', () => {
        handleDisconnect(ws);
    });
});

// Heartbeat mechanism
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => {
    clearInterval(interval);
});

function handleMessage(ws, data) {
    const { type, payload } = data;

    switch (type) {
        case 'create_room': {
            const code = generateRoomCode();
            const room = {
                gameState: new GameState(),
                players: new Map(),
                playerOrder: [ws.sessionId],
                rematchRequests: [],
                timeoutId: null
            };
            room.players.set(ws.sessionId, ws);
            rooms.set(code, room);
            ws.roomCode = code;
            ws.playerIndex = 1;

            ws.send(JSON.stringify({
                type: 'room_created',
                payload: { code, playerIndex: 1, sessionId: ws.sessionId }
            }));
            break;
        }

        case 'join_room': {
            const { code } = payload;
            const room = rooms.get(code);
            if (!room) {
                ws.send(JSON.stringify({ type: 'error', payload: 'Room not found' }));
                return;
            }

            if (room.playerOrder.length >= 2) {
                ws.send(JSON.stringify({ type: 'error', payload: 'Room full' }));
                return;
            }

            if (room.timeoutId) {
                clearTimeout(room.timeoutId);
                room.timeoutId = null;
            }

            room.players.set(ws.sessionId, ws);
            room.playerOrder.push(ws.sessionId);
            ws.roomCode = code;
            ws.playerIndex = 2;

            // Notify P1 found P2
            const p1SessionId = room.playerOrder[0];
            const p1Ws = room.players.get(p1SessionId);
            if (p1Ws) p1Ws.send(JSON.stringify({ type: 'player_joined', payload: { playerIndex: 2 } }));

            // Notify P2 joined
            ws.send(JSON.stringify({
                type: 'game_start',
                payload: { code, playerIndex: 2, sessionId: ws.sessionId }
            }));

            // Start game
            broadcast(room, { type: 'game_start', payload: {} });
            break;
        }

        case 'rejoin_room': {
            const { code, sessionId } = payload;
            const room = rooms.get(code);
            if (!room) {
                ws.send(JSON.stringify({ type: 'error', payload: 'Room not found or expired' }));
                return;
            }

            const playerIndex = room.playerOrder.indexOf(sessionId) + 1;
            if (playerIndex === 0) {
                ws.send(JSON.stringify({ type: 'error', payload: 'Not a member of this room' }));
                return;
            }

            if (room.timeoutId) {
                clearTimeout(room.timeoutId);
                room.timeoutId = null;
            }

            // Replace old connection
            ws.sessionId = sessionId;
            ws.roomCode = code;
            ws.playerIndex = playerIndex;
            room.players.set(sessionId, ws);

            ws.send(JSON.stringify({
                type: 'game_start',
                payload: { code, playerIndex, sessionId }
            }));

            ws.send(JSON.stringify({
                type: 'game_state_update',
                payload: {
                    board: room.gameState.columns,
                    currentPlayer: room.gameState.turn,
                    winner: room.gameState.winner,
                    isGameOver: !!(room.gameState.winner || room.gameState.isDraw),
                    isDraw: room.gameState.isDraw,
                    winningLine: room.gameState.winningLine
                }
            }));
            
            console.log(`Player ${sessionId} rejoined room ${code}`);
            break;
        }

        case 'make_move': {
            const { col } = payload;
            const room = rooms.get(ws.roomCode);
            if (!room) return;

            const result = room.gameState.playMove(col, ws.playerIndex);

            if (result.valid) {
                broadcast(room, {
                    type: 'game_state_update',
                    payload: {
                        board: room.gameState.columns,
                        currentPlayer: room.gameState.turn,
                        winner: room.gameState.winner,
                        isGameOver: !!(room.gameState.winner || room.gameState.isDraw),
                        isDraw: room.gameState.isDraw,
                        winningLine: result.winningLine // Add winningLine to payload
                    }
                });
            } else {
                ws.send(JSON.stringify({ type: 'error', payload: result.reason }));
            }
            break;
        }

        case 'request_rematch': {
            const room = rooms.get(ws.roomCode);
            if (!room) return;

            if (!room.rematchRequests.includes(ws.playerIndex)) {
                room.rematchRequests.push(ws.playerIndex);
            }

            if (room.rematchRequests.length === 2) {
                room.gameState = new GameState();
                room.rematchRequests = [];

                broadcast(room, {
                    type: 'game_state_update',
                    payload: {
                        board: room.gameState.columns,
                        currentPlayer: room.gameState.turn,
                        winner: room.gameState.winner,
                        isGameOver: false,
                        isDraw: false,
                        winningLine: false
                    }
                });
            } else {
                ws.send(JSON.stringify({
                    type: 'rematch_pending',
                    payload: 'Waiting for opponent to accept rematch.'
                }));
            }
            break;
        }
    }
}

function handleDisconnect(ws) {
    if (ws.roomCode) {
        const room = rooms.get(ws.roomCode);
        if (room) {
            room.players.delete(ws.sessionId);

            const connectedPlayers = Array.from(room.players.values()).filter(p => p.readyState === WebSocket.OPEN);

            if (connectedPlayers.length === 0) {
                // All players gone, start cleanup timer
                if (room.timeoutId) clearTimeout(room.timeoutId);
                room.timeoutId = setTimeout(() => {
                    rooms.delete(ws.roomCode);
                    console.log(`Room ${ws.roomCode} deleted due to inactivity.`);
                }, ROOM_TIMEOUT);
            } else {
                // Notify remaining players
                broadcast(room, {
                    type: 'player_disconnected',
                    payload: { playerIndex: ws.playerIndex }
                });
            }
        }
    }
}

function broadcast(room, msg) {
    const json = JSON.stringify(msg);
    room.players.forEach(p => {
        if (p.readyState === WebSocket.OPEN) p.send(json);
    });
}
