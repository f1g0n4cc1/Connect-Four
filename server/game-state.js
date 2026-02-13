// Simplified Board Logic for Server
// Using CommonJS for Node.js (unless we set type: module in package.json, checking...)
// I see I set type: commonjs or default. I'll use CommonJS.

class GameState {
    constructor(rows = 6, cols = 7) {
        this.rows = rows
        this.cols = cols
        this.columns = Array(cols).fill(null).map(() => [])
        this.turn = 1 // 1 or 2
        this.winner = null
        this.isDraw = false
    }

    playMove(col, player) {
        if (this.winner || this.isDraw) return { valid: false, reason: 'Game Over' }
        if (player !== this.turn) return { valid: false, reason: 'Not your turn' }
        if (col < 0 || col >= this.cols) return { valid: false, reason: 'Invalid column' }
        if (this.columns[col].length >= this.rows) return { valid: false, reason: 'Column full' }

        this.columns[col].push(player)
        const row = this.columns[col].length - 1

        let winningLine = false; // Initialize to false

        // Check Win
        const winResult = this.checkWin(col, row, player);
        if (winResult) {
            this.winner = player;
            winningLine = winResult; // Store the winning line
        } else if (this.checkDraw()) {
            this.isDraw = true;
        } else {
            this.turn = this.turn === 1 ? 2 : 1;
        }

        return { valid: true, row, winner: this.winner, isDraw: this.isDraw, nextTurn: this.turn, winningLine: winningLine }
    }

    checkDraw() {
        return this.columns.every(col => col.length >= this.rows)
    }

    checkWin(col, row, player) {
        const directions = [
            { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 }
        ]
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
            if (count >= 4) return line; // Return the winning line
        }
        return false; // No win
    }

    getPiece(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return 0
        return this.columns[col][row] || 0
    }
}

module.exports = { GameState }
