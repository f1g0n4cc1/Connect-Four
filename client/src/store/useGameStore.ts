import { create } from 'zustand';
import { Player, Position, GameStatePayload } from '@connect-four/shared';
import { io, Socket } from 'socket.io-client';

interface GameStore {
    // State
    socket: Socket | null;
    sessionId: string | null;
    roomCode: string | null;
    playerIndex: number | null; // 1 or 2
    gameMode: 'menu' | 'online-lobby' | 'room-wait' | 'pvp' | 'pve' | 'pve-local';
    board: Player[][];
    currentPlayer: Player;
    winner: Player | null;
    isDraw: boolean;
    isGameOver: boolean;
    winningLine: Position[] | null;
    connectionStatus: 'disconnected' | 'connecting' | 'connected';
    
    // Actions
    connect: (url: string) => void;
    createRoom: () => void;
    joinRoom: (code: string) => void;
    rejoinRoom: (code: string, sessionId: string) => void;
    makeMove: (col: number) => void;
    requestRematch: () => void;
    setGameMode: (mode: GameStore['gameMode']) => void;
    resetLocalGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    socket: null,
    sessionId: localStorage.getItem('connect4_sessionId'),
    roomCode: localStorage.getItem('connect4_roomCode'),
    playerIndex: null,
    gameMode: 'menu',
    board: [],
    currentPlayer: 1,
    winner: null,
    isDraw: false,
    isGameOver: false,
    winningLine: null,
    connectionStatus: 'disconnected',

    connect: (url) => {
        if (get().socket?.connected) return;

        const sessionId = get().sessionId;
        const socket = io(url, {
            query: sessionId ? { sessionId } : {}
        });

        set({ socket, connectionStatus: 'connecting' });

        socket.on('connect', () => {
            set({ connectionStatus: 'connected' });
            const { roomCode, sessionId } = get();
            if (roomCode && sessionId) {
                get().rejoinRoom(roomCode, sessionId);
            }
        });

        socket.on('disconnect', () => {
            set({ connectionStatus: 'disconnected' });
        });

        socket.on('room_created', (payload) => {
            localStorage.setItem('connect4_sessionId', payload.sessionId);
            localStorage.setItem('connect4_roomCode', payload.code);
            set({ 
                roomCode: payload.code, 
                sessionId: payload.sessionId, 
                playerIndex: payload.playerIndex,
                gameMode: 'room-wait'
            });
        });

        socket.on('game_start', (payload) => {
            if (payload.playerIndex) set({ playerIndex: payload.playerIndex });
            set({ gameMode: 'pvp', isGameOver: false });
        });

        socket.on('game_state_update', (state: GameStatePayload) => {
            set({
                board: state.board,
                currentPlayer: state.currentPlayer,
                winner: state.winner,
                isGameOver: state.isGameOver,
                isDraw: state.isDraw,
                winningLine: state.winningLine
            });
        });

        socket.on('error', (msg) => {
            alert(msg);
            if (msg.includes('not found')) {
                localStorage.removeItem('connect4_roomCode');
                localStorage.removeItem('connect4_sessionId');
                set({ roomCode: null, sessionId: null, gameMode: 'menu' });
            }
        });
    },

    createRoom: () => {
        get().socket?.emit('create_room');
    },

    joinRoom: (code) => {
        get().socket?.emit('join_room', { code });
    },

    rejoinRoom: (code, sessionId) => {
        get().socket?.emit('rejoin_room', { code, sessionId });
    },

    makeMove: (col) => {
        const { gameMode, socket } = get();
        if (gameMode === 'pvp') {
            socket?.emit('make_move', { col });
        }
        // Local logic will be handled by the game component or a separate hook
    },

    requestRematch: () => {
        get().socket?.emit('request_rematch');
    },

    setGameMode: (mode) => set({ gameMode: mode }),

    resetLocalGame: () => set({
        board: [],
        currentPlayer: 1,
        winner: null,
        isDraw: false,
        isGameOver: false,
        winningLine: null
    })
}));
