import { Board, Player, Position, COLS, ROWS } from '@connect-four/shared';

export interface MoveResult {
    valid: boolean;
    reason?: string;
    row?: number;
    winner?: Player | null;
    isDraw?: boolean;
    nextTurn?: Player;
    winningLine?: Position[] | false;
}

export class GameState {
    board: Board;
    rows: number;
    cols: number;
    turn: Player;
    winner: Player | null;
    isDraw: boolean;
    winningLine: Position[] | null;

    constructor(rows: number = ROWS, cols: number = COLS) {
        this.board = new Board(rows, cols);
        this.rows = rows;
        this.cols = cols;
        this.turn = 1;
        this.winner = null;
        this.isDraw = false;
        this.winningLine = null;
    }

    get columns(): Player[][] {
        return this.board.columns;
    }

    playMove(col: number, player: Player): MoveResult {
        if (this.winner || this.isDraw) return { valid: false, reason: 'Game Over' };
        if (player !== this.turn) return { valid: false, reason: 'Not your turn' };
        
        const row = this.board.playMove(col, player);
        if (row === -1) return { valid: false, reason: 'Invalid move' };

        const winResult = this.board.checkWin(col, row, player);
        if (winResult) {
            this.winner = player;
            this.winningLine = winResult;
            return { valid: true, row, winner: this.winner, isDraw: false, nextTurn: this.turn, winningLine: winResult };
        } else if (this.board.checkDraw()) {
            this.isDraw = true;
            return { valid: true, row, winner: null, isDraw: true, nextTurn: this.turn, winningLine: false };
        } else {
            this.turn = this.turn === 1 ? 2 : 1;
            return { valid: true, row, winner: null, isDraw: false, nextTurn: this.turn, winningLine: false };
        }
    }
}

const COLS_DEFAULT = 7;
