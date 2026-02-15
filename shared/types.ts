import { Player, Position } from './game-logic.js';

export type MessageType = 
    | 'create_room'
    | 'join_room'
    | 'rejoin_room'
    | 'make_move'
    | 'request_rematch'
    | 'room_created'
    | 'player_joined'
    | 'game_start'
    | 'game_state_update'
    | 'game_over'
    | 'rematch_pending'
    | 'player_disconnected'
    | 'error';

export interface NetworkMessage<T = any> {
    type: MessageType;
    payload: T;
}

export interface GameStatePayload {
    board: Player[][];
    currentPlayer: Player;
    winner: Player | null;
    isGameOver: boolean;
    isDraw: boolean;
    winningLine: Position[] | null;
}

export interface GameOverPayload {
    winner: Player | null;
    isDraw: boolean;
    winningLine: Position[] | null;
}

export interface RoomCreatedPayload {
    code: string;
    playerIndex: number;
    sessionId: string;
}

export interface PlayerJoinedPayload {
    playerIndex: number;
}

export interface JoinRoomPayload {
    code: string;
}

export interface RejoinRoomPayload {
    code: string;
    sessionId: string;
}

export interface MakeMovePayload {
    col: number;
}
