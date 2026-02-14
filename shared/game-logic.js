export const ROWS = 6;
export const COLS = 7;

export class Board {
    constructor(rows = ROWS, cols = COLS) {
        this.rows = rows;
        this.cols = cols;
        this.reset();
    }

    reset() {
        // Column-Major: Array of Columns. Each column is a stack of pieces.
        // Index 0 = Bottom of board.
        this.columns = Array(this.cols).fill(null).map(() => []);
    }

    isValidMove(col) {
        return col >= 0 && col < this.cols && this.columns[col].length < this.rows;
    }

    // Returns the row index where it landed, or -1 if invalid
    playMove(col, player) {
        if (!this.isValidMove(col)) return -1;
        this.columns[col].push(player);
        return this.columns[col].length - 1;
    }

    getPiece(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return 0;
        return this.columns[col][row] || 0;
    }

    checkWin(col, row, player) {
        const directions = [
            { dr: 0, dc: 1 },  // Horizontal
            { dr: 1, dc: 0 },  // Vertical
            { dr: 1, dc: 1 },  // Diag /
            { dr: 1, dc: -1 }  // Diag 
        ];

        for (const { dr, dc } of directions) {
            let line = [{ col, row }];
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

    checkDraw() {
        return this.columns.every(col => col.length >= this.rows);
    }
}
