import { describe, it, expect, beforeEach } from 'vitest';
import { Board, ROWS, COLS } from './game-logic.js';

describe('Board Class', () => {
    let board;

    beforeEach(() => {
        board = new Board(ROWS, COLS);
    });

    it('should initialize with an empty board', () => {
        expect(board.rows).toBe(6);
        expect(board.cols).toBe(7);
        board.columns.forEach(col => {
            expect(col).toEqual([]);
        });
    });

    it('should identify valid moves', () => {
        expect(board.isValidMove(0)).toBe(true);
        expect(board.isValidMove(-1)).toBe(false);
        expect(board.isValidMove(COLS)).toBe(false);

        // Fill a column
        for (let i = 0; i < ROWS; i++) {
            board.playMove(0, 1);
        }
        expect(board.isValidMove(0)).toBe(false);
    });

    it('should correctly drop pieces', () => {
        const row = board.playMove(3, 1);
        expect(row).toBe(0);
        expect(board.getPiece(3, 0)).toBe(1);

        const row2 = board.playMove(3, 2);
        expect(row2).toBe(1);
        expect(board.getPiece(3, 1)).toBe(2);
    });

    describe('Win Conditions', () => {
        it('should detect horizontal wins', () => {
            board.playMove(0, 1);
            board.playMove(1, 1);
            board.playMove(2, 1);
            const row = board.playMove(3, 1);
            const win = board.checkWin(3, row, 1);
            expect(win).toBeTruthy();
            expect(win.length).toBe(4);
        });

        it('should detect vertical wins', () => {
            board.playMove(0, 1);
            board.playMove(0, 1);
            board.playMove(0, 1);
            const row = board.playMove(0, 1);
            const win = board.checkWin(0, row, 1);
            expect(win).toBeTruthy();
            expect(win.length).toBe(4);
        });

        it('should detect diagonal wins (/)', () => {
            // Setup:
            // Col 0: P1
            // Col 1: P2, P1
            // Col 2: P2, P2, P1
            // Col 3: P2, P2, P2, P1
            board.playMove(0, 1);

            board.playMove(1, 2);
            board.playMove(1, 1);

            board.playMove(2, 2);
            board.playMove(2, 2);
            board.playMove(2, 1);

            board.playMove(3, 2);
            board.playMove(3, 2);
            board.playMove(3, 2);
            const row = board.playMove(3, 1);

            const win = board.checkWin(3, row, 1);
            expect(win).toBeTruthy();
            expect(win.length).toBe(4);
        });

        it('should detect diagonal wins (\)', () => {
            // Setup:
            // Col 3: P1
            // Col 2: P2, P1
            // Col 1: P2, P2, P1
            // Col 0: P2, P2, P2, P1
            board.playMove(3, 1);

            board.playMove(2, 2);
            board.playMove(2, 1);

            board.playMove(1, 2);
            board.playMove(1, 2);
            board.playMove(1, 1);

            board.playMove(0, 2);
            board.playMove(0, 2);
            board.playMove(0, 2);
            const row = board.playMove(0, 1);

            const win = board.checkWin(0, row, 1);
            expect(win).toBeTruthy();
            expect(win.length).toBe(4);
        });
    });

    it('should detect a draw', () => {
        // Fill the board without a win
        // Pattern: 1 1 2 2 1 1 2 (Row 0)
        //          2 2 1 1 2 2 1 (Row 1)
        // Repeat...
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                const player = (Math.floor(c/2) + r) % 2 === 0 ? 1 : 2;
                board.playMove(c, player);
            }
        }
        expect(board.checkDraw()).toBe(true);
    });
});
