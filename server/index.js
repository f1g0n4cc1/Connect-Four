import { WebSocketServer, WebSocket } from 'ws';
import { GameState } from './game-state.js';

const wss = new WebSocketServer({ port: 8080 });

const rooms = new Map(); // code -> { gameState, players: [ws1, ws2], spectators: [] }

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

console.log('Server started on port 8080');

wss.on('connection', (ws) => {
    ws.roomCode = null;
    ws.playerIndex = 0; // 1 or 2

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (e) {
            console.error('Invalid message', e);
        }
    });

    ws.on('close', () => {
        handleDisconnect(ws);
    });
});

function handleMessage(ws, data) {
    const { type, payload } = data;

    switch (type) {
        case 'create_room': {
            const code = generateRoomCode();
            const room = {
                gameState: new GameState(),
                players: [ws],
                spectators: [],
                rematchRequests: [] // Initialize rematch requests tracking
            };
            rooms.set(code, room);
            ws.roomCode = code;
            ws.playerIndex = 1;

            ws.send(JSON.stringify({
                type: 'room_created',
                payload: { code, playerIndex: 1 }
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

            if (room.players.length >= 2) {
                ws.send(JSON.stringify({ type: 'error', payload: 'Room full' }));
                return;
            }

            room.players.push(ws);
            ws.roomCode = code;
            ws.playerIndex = 2;

            // Notify P1 found P2
            room.players[0].send(JSON.stringify({ type: 'player_joined', payload: { playerIndex: 2 } }));

            // Notify P2 joined
            ws.send(JSON.stringify({
                type: 'game_start',
                payload: { code, playerIndex: 2 }
            }));

            // Start game
            broadcast(room, { type: 'game_start', payload: {} });
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
                // Both players requested rematch, reset game
                room.gameState = new GameState(); // Reset board, turn, winner, isDraw
                room.rematchRequests = []; // Clear rematch requests

                // Broadcast new game state
                broadcast(room, {
                    type: 'game_state_update',
                    payload: {
                        board: room.gameState.columns,
                        currentPlayer: room.gameState.turn,
                        winner: room.gameState.winner,
                        isGameOver: false, // New game is not over
                        isDraw: false,
                        winningLine: false // New game has no winning line
                    }
                });
                console.log(`Rematch started for room ${ws.roomCode}`);
            } else {
                // Notify the requesting player that they are waiting for opponent
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
            // Remove disconnected player from the room's player list
            room.players = room.players.filter(p => p !== ws);

            if (room.players.length === 0) {
                // If no players left, delete the room
                rooms.delete(ws.roomCode);
                console.log(`Room ${ws.roomCode} deleted due to all players disconnected.`);
            } else if (room.players.length === 1) {
                // If one player remains, notify them that the opponent left and end the game
                const remainingPlayer = room.players[0];
                // Ensure room.gameState is accessible and updated if needed
                // It's already the source of truth for the board state,
                // so we just need to set the winner/draw flags for the message.
                // For a disconnect, the remaining player is the de facto winner.
                remainingPlayer.send(JSON.stringify({
                    type: 'game_over',
                    payload: {
                        winner: remainingPlayer.playerIndex,
                        isDraw: false,
                        reason: 'Opponent disconnected'
                    }
                }));
                // Mark game as over on server side as well
                room.gameState.winner = remainingPlayer.playerIndex;
                room.gameState.isDraw = false;
                rooms.delete(ws.roomCode); // Delete the room after notifying the remaining player
                console.log(`Player ${ws.playerIndex} disconnected from room ${ws.roomCode}. Notified remaining player ${remainingPlayer.playerIndex}.`);
            } else {
                // This case should ideally not happen in a 2-player game (more than 2 players in room.players)
                console.warn(`Unexpected number of players remaining in room ${ws.roomCode} after disconnect.`);
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
