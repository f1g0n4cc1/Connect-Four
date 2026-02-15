import { WebSocketServer, WebSocket } from 'ws';
import { GameState } from './game-state.js';
import crypto from 'node:crypto';
import { logger } from './logger.js';

const wss = new WebSocketServer({ port: 8080 });

const rooms = new Map(); // code -> { gameState, players: Map(sessionId -> ws), playerOrder: [sessionId, sessionId], rematchRequests: [] }
const ROOM_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function generateSessionId() {
    return crypto.randomUUID();
}

// Process-level error handlers
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    logger.error(err.stack);
    // In a real production app, you might want to restart the process here
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});

logger.success('Connect Four Server started on port 8080');

wss.on('connection', (ws) => {
    ws.sessionId = generateSessionId();
    ws.roomCode = null;
    ws.playerIndex = 0; // 1 or 2
    ws.isAlive = true;

    logger.info(`New connection established. Assigned SessionID: ${ws.sessionId}`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (e) {
            logger.error(`Malformed message from ${ws.sessionId}: ${e.message}`);
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
        if (ws.isAlive === false) {
            logger.warn(`Terminating stale connection: ${ws.sessionId}`);
            return ws.terminate();
        }
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

            logger.success(`Room Created: ${code} by Player 1 (${ws.sessionId})`);

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
                logger.warn(`Join Attempt Failed: Room ${code} not found. Session: ${ws.sessionId}`);
                ws.send(JSON.stringify({ type: 'error', payload: 'Room not found' }));
                return;
            }

            if (room.playerOrder.length >= 2) {
                logger.warn(`Join Attempt Failed: Room ${code} is full. Session: ${ws.sessionId}`);
                ws.send(JSON.stringify({ type: 'error', payload: 'Room full' }));
                return;
            }

            if (room.timeoutId) {
                clearTimeout(room.timeoutId);
                room.timeoutId = null;
                logger.info(`Room ${code} cleanup cancelled due to player join.`);
            }

            room.players.set(ws.sessionId, ws);
            room.playerOrder.push(ws.sessionId);
            ws.roomCode = code;
            ws.playerIndex = 2;

            logger.success(`Player 2 (${ws.sessionId}) joined Room: ${code}`);

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
                logger.warn(`Rejoin Failed: Room ${code} not found/expired. Session: ${sessionId}`);
                ws.send(JSON.stringify({ type: 'error', payload: 'Room not found or expired' }));
                return;
            }

            const playerIndex = room.playerOrder.indexOf(sessionId) + 1;
            if (playerIndex === 0) {
                logger.warn(`Rejoin Failed: Session ${sessionId} not in Room ${code}`);
                ws.send(JSON.stringify({ type: 'error', payload: 'Not a member of this room' }));
                return;
            }

            if (room.timeoutId) {
                clearTimeout(room.timeoutId);
                room.timeoutId = null;
                logger.info(`Room ${code} cleanup cancelled due to player rejoin.`);
            }

            // Replace old connection
            ws.sessionId = sessionId;
            ws.roomCode = code;
            ws.playerIndex = playerIndex;
            room.players.set(sessionId, ws);

            logger.info(`Player ${playerIndex} (${sessionId}) rejoined Room: ${code}`);

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
            break;
        }

        case 'make_move': {
            const { col } = payload;
            const room = rooms.get(ws.roomCode);
            if (!room) return;

            const result = room.gameState.playMove(col, ws.playerIndex);

            if (result.valid) {
                logger.info(`Move: Room ${ws.roomCode} | P${ws.playerIndex} dropped in col ${col}`);
                
                if (result.winner) {
                    logger.success(`Game Over: Room ${ws.roomCode} | Player ${result.winner} won!`);
                } else if (result.isDraw) {
                    logger.info(`Game Over: Room ${ws.roomCode} | Draw`);
                }

                broadcast(room, {
                    type: 'game_state_update',
                    payload: {
                        board: room.gameState.columns,
                        currentPlayer: room.gameState.turn,
                        winner: room.gameState.winner,
                        isGameOver: !!(room.gameState.winner || room.gameState.isDraw),
                        isDraw: room.gameState.isDraw,
                        winningLine: result.winningLine
                    }
                });
            } else {
                logger.warn(`Invalid Move Attempt: Room ${ws.roomCode} | P${ws.playerIndex} col ${col} | Reason: ${result.reason}`);
                ws.send(JSON.stringify({ type: 'error', payload: result.reason }));
            }
            break;
        }

        case 'request_rematch': {
            const room = rooms.get(ws.roomCode);
            if (!room) return;

            if (!room.rematchRequests.includes(ws.playerIndex)) {
                room.rematchRequests.push(ws.playerIndex);
                logger.info(`Rematch Requested: Room ${ws.roomCode} | P${ws.playerIndex}`);
            }

            if (room.rematchRequests.length === 2) {
                logger.success(`Rematch Started: Room ${ws.roomCode}`);
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
            logger.info(`Player Disconnected: Room ${ws.roomCode} | P${ws.playerIndex} (${ws.sessionId})`);

            const connectedPlayers = Array.from(room.players.values()).filter(p => p.readyState === WebSocket.OPEN);

            if (connectedPlayers.length === 0) {
                // All players gone, start cleanup timer
                if (room.timeoutId) clearTimeout(room.timeoutId);
                room.timeoutId = setTimeout(() => {
                    rooms.delete(ws.roomCode);
                    logger.info(`Room Deleted (Timeout): ${ws.roomCode}`);
                }, ROOM_TIMEOUT);
                logger.info(`Room Cleanup Scheduled: ${ws.roomCode} in 5 minutes.`);
            } else {
                // Notify remaining players
                broadcast(room, {
                    type: 'player_disconnected',
                    payload: { playerIndex: ws.playerIndex }
                });
            }
        }
    } else {
        logger.info(`Connection Closed: ${ws.sessionId} (No room active)`);
    }
}

function broadcast(room, msg) {
    const json = JSON.stringify(msg);
    room.players.forEach(p => {
        if (p.readyState === WebSocket.OPEN) p.send(json);
    });
}
