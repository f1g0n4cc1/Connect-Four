export const ROWS = 6;
export const COLS = 7;

export type Player = 1 | 2 | 0;

export interface Position {
    col: number;
    row: number;
}

export class Board {
    rows: number;
    cols: number;
    columns: Player[][];

    constructor(rows: number = ROWS, cols: number = COLS) {
        this.rows = rows;
        this.cols = cols;
        this.columns = [];
        this.reset();
    }

    reset(): void {
        // Column-Major: Array of Columns. Each column is a stack of pieces.
        // Index 0 = Bottom of board.
        this.columns = Array(this.cols).fill(null).map(() => []);
    }

    isValidMove(col: number): boolean {
        return col >= 0 && col < this.cols && this.columns[col].length < this.rows;
    }

    // Returns the row index where it landed, or -1 if invalid
    playMove(col: number, player: Player): number {
        if (!this.isValidMove(col)) return -1;
        this.columns[col].push(player);
        return this.columns[col].length - 1;
    }

    getPiece(col: number, row: number): Player {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return 0;
        return this.columns[col][row] || 0;
    }

    checkWin(col: number, row: number, player: Player): Position[] | false {
        const directions = [
            { dr: 0, dc: 1 },  // Horizontal
            { dr: 1, dc: 0 },  // Vertical
            { dr: 1, dc: 1 },  // Diag /
            { dr: 1, dc: -1 }  // Diag 
        ];

        for (const { dr, dc } of directions) {
            let line: Position[] = [{ col, row }];
            let count = 1;

            // Check positive direction
            for (let i = 1; i < 4; i++) {
                const rCheck = row + dr * i;
                const cCheck = col + dc * i;
                if (this.getPiece(cCheck, rCheck) === player) {
                    count++;
                    line.push({ col: cCheck, row: rCheck });
                } else {
                    break;
                }
            }

            // Check negative direction
            for (let i = 1; i < 4; i++) {
                const rCheck = row - dr * i;
                const cCheck = col - dc * i;
                if (this.getPiece(cCheck, rCheck) === player) {
                    count++;
                    line.push({ col: cCheck, row: rCheck });
                } else {
                    break;
                }
            }

            if (count >= 4) {
                return line; // Return the winning line
            }
        }
        return false; // No win
    }

    checkDraw(): boolean {
        return this.columns.every(col => col.length >= this.rows);
    }
}
