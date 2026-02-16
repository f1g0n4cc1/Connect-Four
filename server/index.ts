import Fastify from 'fastify';
import socketio from 'fastify-socket.io';
import { Server, Socket } from 'socket.io';
import { GameState } from './game-state.js';
import { logger } from './logger.js';
import { 
    NetworkMessage, 
    RoomCreatedPayload, 
    GameStatePayload, 
    GameOverPayload, 
    PlayerJoinedPayload,
    JoinRoomPayload,
    RejoinRoomPayload,
    MakeMovePayload,
    Player
} from '@connect-four/shared';
import crypto from 'node:crypto';
import Redis from 'ioredis';

const fastify = Fastify();
const ROOM_TIMEOUT = 5 * 60 * 1000;

// Redis setup (optional but recommended in plan)
// Falling back to in-memory if Redis is not available
let redis: Redis | null = null;
try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    redis.on('error', (err) => {
        logger.warn('Redis not available, falling back to in-memory storage.');
        redis = null;
    });
} catch (e) {
    logger.warn('Redis connection failed.');
}

interface Room {
    gameState: GameState;
    playerOrder: string[]; // sessionIds
    rematchRequests: number[];
    timeoutId: NodeJS.Timeout | null;
}

const rooms = new Map<string, Room>();

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

fastify.register(socketio as any, {
    cors: {
        origin: '*', // In production, restrict this
    }
});

fastify.ready(err => {
    if (err) throw err;

    const io: Server = (fastify as any).io;

    io.on('connection', (socket: Socket) => {
        let sessionId = socket.handshake.query.sessionId as string;
        if (!sessionId) {
            sessionId = crypto.randomUUID();
        }
        
        // Attach sessionId to socket
        (socket as any).sessionId = sessionId;
        
        logger.info(`New connection: ${socket.id} | Session: ${sessionId}`);

        socket.on('create_room', () => {
            const code = generateRoomCode();
            const room: Room = {
                gameState: new GameState(),
                playerOrder: [sessionId],
                rematchRequests: [],
                timeoutId: null
            };
            rooms.set(code, room);
            socket.join(code);
            (socket as any).roomCode = code;
            (socket as any).playerIndex = 1;

            logger.success(`Room Created: ${code} by P1 (${sessionId})`);

            socket.emit('room_created', { code, playerIndex: 1, sessionId } as RoomCreatedPayload);
        });

        socket.on('join_room', (payload: JoinRoomPayload) => {
            const { code } = payload;
            const room = rooms.get(code);

            if (!room) {
                socket.emit('error', 'Room not found');
                return;
            }

            if (room.playerOrder.length >= 2) {
                socket.emit('error', 'Room full');
                return;
            }

            if (room.timeoutId) {
                clearTimeout(room.timeoutId);
                room.timeoutId = null;
            }

            room.playerOrder.push(sessionId);
            socket.join(code);
            (socket as any).roomCode = code;
            (socket as any).playerIndex = 2;

            logger.success(`Player 2 (${sessionId}) joined Room: ${code}`);

            // Notify P1
            socket.to(code).emit('player_joined', { playerIndex: 2 } as PlayerJoinedPayload);
            
            // Notify P2
            socket.emit('game_start', { code, playerIndex: 2, sessionId } as RoomCreatedPayload);

            // Start game for everyone
            io.to(code).emit('game_start', {});
        });

        socket.on('rejoin_room', (payload: RejoinRoomPayload) => {
            const { code, sessionId: oldSessionId } = payload;
            const room = rooms.get(code);

            if (!room) {
                socket.emit('error', 'Room not found or expired');
                return;
            }

            const playerIndex = room.playerOrder.indexOf(oldSessionId) + 1;
            if (playerIndex === 0) {
                socket.emit('error', 'Not a member of this room');
                return;
            }

            if (room.timeoutId) {
                clearTimeout(room.timeoutId);
                room.timeoutId = null;
            }

            (socket as any).sessionId = oldSessionId;
            (socket as any).roomCode = code;
            (socket as any).playerIndex = playerIndex;
            socket.join(code);

            logger.info(`Player ${playerIndex} (${oldSessionId}) rejoined Room: ${code}`);

            socket.emit('game_start', { code, playerIndex, sessionId: oldSessionId });

            const gs = room.gameState;
            socket.emit('game_state_update', {
                board: gs.columns,
                currentPlayer: gs.turn,
                winner: gs.winner,
                isGameOver: !!(gs.winner || gs.isDraw),
                isDraw: gs.isDraw,
                winningLine: gs.winningLine
            } as GameStatePayload);
        });

        socket.on('make_move', (payload: MakeMovePayload) => {
            const { col } = payload;
            const roomCode = (socket as any).roomCode;
            const playerIndex = (socket as any).playerIndex as Player;
            const room = rooms.get(roomCode);

            if (!room) return;

            const result = room.gameState.playMove(col, playerIndex);

            if (result.valid) {
                if (result.winner) {
                    io.to(roomCode).emit('game_over', {
                        winner: result.winner,
                        isDraw: false,
                        winningLine: result.winningLine
                    } as GameOverPayload);
                } else if (result.isDraw) {
                    io.to(roomCode).emit('game_over', {
                        winner: null,
                        isDraw: true,
                        winningLine: null
                    } as GameOverPayload);
                }

                io.to(roomCode).emit('game_state_update', {
                    board: room.gameState.columns,
                    currentPlayer: room.gameState.turn,
                    winner: room.gameState.winner,
                    isGameOver: !!(room.gameState.winner || room.gameState.isDraw),
                    isDraw: room.gameState.isDraw,
                    winningLine: result.winningLine || null
                } as GameStatePayload);
            } else {
                socket.emit('error', result.reason);
            }
        });

        socket.on('request_rematch', () => {
            const roomCode = (socket as any).roomCode;
            const playerIndex = (socket as any).playerIndex;
            const room = rooms.get(roomCode);

            if (!room) return;

            if (!room.rematchRequests.includes(playerIndex)) {
                room.rematchRequests.push(playerIndex);
            }

            if (room.rematchRequests.length === 2) {
                room.gameState = new GameState();
                room.rematchRequests = [];
                io.to(roomCode).emit('game_state_update', {
                    board: room.gameState.columns,
                    currentPlayer: room.gameState.turn,
                    winner: room.gameState.winner,
                    isGameOver: false,
                    isDraw: false,
                    winningLine: null
                } as GameStatePayload);
            } else {
                socket.emit('rematch_pending');
            }
        });

        socket.on('disconnect', () => {
            const roomCode = (socket as any).roomCode;
            const playerIndex = (socket as any).playerIndex;
            const room = rooms.get(roomCode);

            if (room) {
                logger.info(`Player ${playerIndex} disconnected from ${roomCode}`);
                
                // Check if anyone else is still in the room
                const remaining = io.sockets.adapter.rooms.get(roomCode);
                if (!remaining || remaining.size === 0) {
                    if (room.timeoutId) clearTimeout(room.timeoutId);
                    room.timeoutId = setTimeout(() => {
                        rooms.delete(roomCode);
                        logger.info(`Room Deleted: ${roomCode}`);
                    }, ROOM_TIMEOUT);
                } else {
                    io.to(roomCode).emit('player_disconnected', { playerIndex });
                }
            }
        });
    });
});

fastify.listen({ port: Number(process.env.PORT) || 8080, host: '0.0.0.0' }, (err) => {
    if (err) {
        logger.error(err.message);
        process.exit(1);
    }
    logger.success(`Fastify + Socket.io Server running on port ${Number(process.env.PORT) || 8080}`);
});
