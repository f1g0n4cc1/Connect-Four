import { describe, it, expect, beforeEach } from 'vitest';
import { Board, ROWS, COLS, AI } from '@connect-four/shared';

describe('AI Class', () => {
    let board: Board;
    let ai: AI;

    beforeEach(() => {
        board = new Board(ROWS, COLS);
        ai = new AI(board);
    });

    it('should take an immediate winning move (horizontal)', () => {
        board.playMove(0, 1);
        board.playMove(1, 1);
        board.playMove(2, 1);
        
        const bestMove = ai.getBestMove(1, 'easy');
        expect(bestMove).toBe(3);
    });

    it('should take an immediate winning move (vertical)', () => {
        board.playMove(0, 1);
        board.playMove(0, 1);
        board.playMove(0, 1);
        
        const bestMove = ai.getBestMove(1, 'easy');
        expect(bestMove).toBe(0);
    });

    it("should block an opponent's immediate winning move", () => {
        // Opponent (Player 2) is about to win horizontally
        board.playMove(0, 2);
        board.playMove(1, 2);
        board.playMove(2, 2);
        
        // AI (Player 1) should block at column 3
        const bestMove = ai.getBestMove(1, 'easy');
        expect(bestMove).toBe(3);
    });

    it('should prioritize winning over blocking (hard mode)', () => {
        // AI (Player 1) can win at col 3
        board.playMove(0, 1);
        board.playMove(1, 1);
        board.playMove(2, 1);

        // Opponent (Player 2) can win at col 5
        board.playMove(4, 2);
        board.playMove(4, 2);
        board.playMove(4, 2);

        const bestMove = ai.getBestMove(1, 'hard');
        expect(bestMove).toBe(3);
    });

    it('should perform well at depth 6 (hard mode benchmark)', () => {
        const start = Date.now();
        const bestMove = ai.getBestMove(1, 'hard');
        const duration = Date.now() - start;
        
        console.log(`AI Hard Move Duration: ${duration}ms`);
        expect(bestMove).toBeGreaterThanOrEqual(0);
        expect(bestMove).toBeLessThan(COLS);
        // We expect depth 6 to be reasonably fast (e.g., < 1000ms on a decent machine)
        expect(duration).toBeLessThan(2000); 
    });
});
