export class AI {
    constructor(board) {
        this.board = board
    }

    // Returns column index to play
    getBestMove(player, difficulty = 'easy') {
        if (difficulty === 'hard') {
            return this.minimaxRoot(player, 6) // Depth 6
        } else {
            return this.easyMove(player)
        }
    }

    easyMove(player) {
        const opponent = player === 1 ? 2 : 1
        const validMoves = this.getValidMoves()

        // 1. Check for immediate win
        for (let col of validMoves) {
            if (this.simMove(col, player)) return col
        }

        // 2. Block immediate opponent win
        for (let col of validMoves) {
            if (this.simMove(col, opponent)) return col
        }

        // 3. Random valid
        return validMoves[Math.floor(Math.random() * validMoves.length)]
    }

    simMove(col, player) {
        // Simulate drop
        const row = this.board.playMove(col, player)
        const win = this.board.checkWin(col, row, player)

        // Undo
        this.board.columns[col].pop()

        return win
    }

    getValidMoves() {
        const moves = []
        for (let c = 0; c < this.board.cols; c++) {
            if (this.board.isValidMove(c)) moves.push(c)
        }
        return moves
    }

    // Minimax with Alpha-Beta Pruning
    minimaxRoot(player, depth) {
        const validMoves = this.getValidMoves()
        const opponent = player === 1 ? 2 : 1

        // 1. Check for an immediate winning move for the AI.
        for (const col of validMoves) {
            if (this.simMove(col, player)) {
                return col
            }
        }

        // 2. Check for an immediate winning move for the opponent and block it.
        for (const col of validMoves) {
            if (this.simMove(col, opponent)) {
                return col
            }
        }
        
        // 3. If no immediate win/loss, run minimax for the best strategic move.
        let bestScore = -Infinity
        let bestMove = validMoves[Math.floor(Math.random() * validMoves.length)] // Default to a random move

        for (const col of validMoves) {
            const row = this.board.playMove(col, player)
            const score = this.minimax(depth - 1, -Infinity, Infinity, false, player)
            this.board.columns[col].pop() // Undo the move

            if (score > bestScore) {
                bestScore = score
                bestMove = col
            }
        }
        return bestMove
    }

    minimax(depth, alpha, beta, isMaximizing, rootPlayer) {
        // Base cases
        if (depth === 0) return this.evaluateBoard(rootPlayer)

        const opponent = rootPlayer === 1 ? 2 : 1
        const currentPlayer = isMaximizing ? rootPlayer : opponent

        const validMoves = this.getValidMoves()
        if (validMoves.length === 0) return 0 // Draw

        if (isMaximizing) {
            let maxEval = -Infinity
            for (const col of validMoves) {
                const row = this.board.playMove(col, currentPlayer)

                if (this.board.checkWin(col, row, currentPlayer)) {
                    this.board.columns[col].pop()
                    return 100000 + depth // higher score for faster win
                }

                const evalScore = this.minimax(depth - 1, alpha, beta, false, rootPlayer)
                this.board.columns[col].pop()

                maxEval = Math.max(maxEval, evalScore)
                alpha = Math.max(alpha, evalScore)
                if (beta <= alpha) break
            }
            return maxEval
        } else {
            let minEval = Infinity
            for (const col of validMoves) {
                const row = this.board.playMove(col, currentPlayer)

                if (this.board.checkWin(col, row, currentPlayer)) {
                    this.board.columns[col].pop()
                    return -100000 - depth // lower score for faster loss
                }

                const evalScore = this.minimax(depth - 1, alpha, beta, true, rootPlayer)
                this.board.columns[col].pop()

                minEval = Math.min(minEval, evalScore)
                beta = Math.min(beta, evalScore)
                if (beta <= alpha) break
            }
            return minEval
        }
    }

    evaluateBoard(player) {
        let score = 0
        // TODO: Detailed Heuristic (Center column preference, checking connected 3s, 2s)
        // For now, simple Center Preference
        const centerCol = Math.floor(this.board.cols / 2)
        for (let r = 0; r < this.board.rows; r++) {
            if (this.board.getPiece(centerCol, r) === player) score += 3
        }
        return score
    }
}
