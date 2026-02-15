import { create } from 'zustand';
import { Player, Position, GameStatePayload, Board, AI, ROWS, COLS } from '@connect-four/shared';
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
    localBoard: Board | null;
    aiDifficulty: 'easy' | 'hard';
    
    // Actions
    connect: (url: string) => void;
    createRoom: () => void;
    joinRoom: (code: string) => void;
    rejoinRoom: (code: string, sessionId: string) => void;
    makeMove: (col: number) => void;
    requestRematch: () => void;
    setGameMode: (mode: GameStore['gameMode']) => void;
    setAiDifficulty: (diff: 'easy' | 'hard') => void;
    resetLocalGame: () => void;
    initLocalGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    socket: null,
    sessionId: localStorage.getItem('connect4_sessionId'),
    roomCode: localStorage.getItem('connect4_roomCode'),
    playerIndex: null,
    gameMode: 'menu',
    board: Array(COLS).fill(null).map(() => []),
    currentPlayer: 1,
    winner: null,
    isDraw: false,
    isGameOver: false,
    winningLine: null,
    connectionStatus: 'disconnected',
    localBoard: null,
    aiDifficulty: 'easy',

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
        const { gameMode, socket, localBoard, currentPlayer, isGameOver } = get();
        
        if (isGameOver) return;

        if (gameMode === 'pvp') {
            socket?.emit('make_move', { col });
            return;
        }

        if (localBoard) {
            if (!localBoard.isValidMove(col)) return;

            const row = localBoard.playMove(col, currentPlayer);
            const winResult = localBoard.checkWin(col, row, currentPlayer);
            const isDraw = localBoard.checkDraw();

            set({
                board: [...localBoard.columns],
                winner: winResult ? currentPlayer : null,
                winningLine: winResult || null,
                isDraw: !!isDraw && !winResult,
                isGameOver: !!winResult || !!isDraw,
                currentPlayer: currentPlayer === 1 ? 2 : 1
            });

            // AI Turn
            const updatedState = get();
            if (gameMode === 'pve' && !updatedState.isGameOver && updatedState.currentPlayer === 2) {
                setTimeout(() => {
                    const ai = new AI(localBoard);
                    const aiCol = ai.getBestMove(2, updatedState.aiDifficulty);
                    get().makeMove(aiCol);
                }, 600);
            }
        }
    },

    requestRematch: () => {
        get().socket?.emit('request_rematch');
    },

    setGameMode: (mode) => {
        set({ gameMode: mode });
        if (['pve', 'pve-local'].includes(mode)) {
            get().initLocalGame();
        }
    },

    setAiDifficulty: (diff) => set({ aiDifficulty: diff }),

    initLocalGame: () => {
        const newBoard = new Board(ROWS, COLS);
        set({
            localBoard: newBoard,
            board: Array(COLS).fill(null).map(() => []),
            currentPlayer: 1,
            winner: null,
            isDraw: false,
            isGameOver: false,
            winningLine: null
        });
    },

    resetLocalGame: () => {
        const { gameMode } = get();
        if (['pve', 'pve-local'].includes(gameMode)) {
            get().initLocalGame();
        } else {
            set({
                board: Array(COLS).fill(null).map(() => []),
                currentPlayer: 1,
                winner: null,
                isDraw: false,
                isGameOver: false,
                winningLine: null,
                localBoard: null
            });
        }
    }
}));

