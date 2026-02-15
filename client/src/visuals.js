export class Visuals {
    constructor(rows, cols, audioManager) {
        this.rows = rows
        this.cols = cols
        this.boardElement = document.getElementById('board')
        this.audioManager = audioManager // Store audioManager
    }

    init(onDrop) {
        this.onDrop = onDrop // Callback when user clicks a column
        this.renderBoard([]) // Initial render
        this.setupInteractions()
    }

    // --- NEW INTERACTION AND RENDERING LOGIC ---

    renderBoard(boardState, winningLine = []) {
        this.boardElement.innerHTML = ''; // Clear existing board
        const fragment = document.createDocumentFragment();

        // 1. Generate the 42 slots (6 rows x 7 columns)
        for (let r = 0; r < this.rows; r++) { // 'r' is the visual row (0 = top, 5 = bottom)
            for (let c = 0; c < this.cols; c++) { // 'c' is the visual column
                
                const slot = document.createElement('div');
                slot.className = 'slot';
                slot.dataset.col = c;
                slot.dataset.row = r;

                // THE FIX: Map visual row (r) to logical row index.
                // Logic index 0 is the bottom, so visual row 5 (bottom) maps to index 0.
                const logicalRow = (this.rows - 1) - r;
                const piecePlayer = boardState[c]?.[logicalRow];

                if (piecePlayer) {
                    const piece = document.createElement('div');
                    
                    // Map player ID to the correct CSS class
                    let typeClass = '';
                    if (piecePlayer === 1) typeClass = 'red';
                    else if (piecePlayer === 2) typeClass = 'yellow';
                    else if (piecePlayer === 3) typeClass = 'plant'; // The succulent player

                    // Check if this piece is part of the winning line
                    const isWinningPiece = winningLine.some(p => p.col === c && p.row === logicalRow);
                    const winnerClass = isWinningPiece ? ' winner' : '';

                    piece.className = `piece ${typeClass}${winnerClass}`;
                    slot.appendChild(piece);
                }

                fragment.appendChild(slot);
            }
        }

        // 2. Generate the 7 Interaction Hitboxes
        // These must be appended last so they sit on top of the 3D grid
        for (let c = 0; c < this.cols; c++) {
            const colSelect = document.createElement('div');
            colSelect.className = 'col-select';
            colSelect.dataset.col = c;
            colSelect.style.left = `${c * (80 + 15)}px`; // 80px slot + 15px gap
            fragment.appendChild(colSelect);
        }
        
        this.boardElement.appendChild(fragment);
    }

    setupInteractions() {
        // Using event delegation on the board is better for performance
        this.boardElement.addEventListener('mouseover', e => {
            if (e.target.classList.contains('col-select')) {
                this.showGhost(e.target.dataset.col);
            }
        });

        this.boardElement.addEventListener('mouseout', e => {
            if (e.target.classList.contains('col-select')) {
                this.hideGhost();
            }
        });

        this.boardElement.addEventListener('click', e => {
            if (e.target.classList.contains('col-select')) {
                if (this.onDrop) {
                    this.onDrop(parseInt(e.target.dataset.col));
                }
            }
        });
    }

    showGhost(col) {
      this.hideGhost();
      
      // Find all slots in the vertical column, sort by row descending
      const columnSlots = Array.from(
        this.boardElement.querySelectorAll(`.slot[data-col="${col}"]`)
      ).sort((a, b) => b.dataset.row - a.dataset.row);

      // Find the first slot in that column without a piece
      const targetSlot = columnSlots.find(slot => !slot.querySelector('.piece'));
      
      if (targetSlot) {
        targetSlot.classList.add('ghost-preview');
      }
    }

    hideGhost() {
        const activeGhosts = this.boardElement.querySelectorAll('.ghost-preview');
        activeGhosts.forEach(slot => slot.classList.remove('ghost-preview'));
    }

    setPlayer(player) {
        // The ghost piece is now a CSS pseudo-element, but we can change its color
        // by setting a class on the root or board element. For now, this is a no-op
        // until we decide how to handle the ghost color.
    }

    animateDrop(col, logicalRow) {
        if (this.audioManager) {
            this.audioManager.play('chip-drop');
        }

        // Map logical row (0 = bottom) to visual row (0 = top)
        const visualRow = (this.rows - 1) - logicalRow;
        const slot = this.boardElement.querySelector(`.slot[data-col="${col}"][data-row="${visualRow}"]`);
        const piece = slot ? slot.querySelector('.piece') : null;

        if (piece) {
            // 2. Add the falling class to trigger CSS animation
            piece.classList.add('falling');

            // 3. Clean up so it doesn't re-animate on the next board refresh
            piece.addEventListener('animationend', () => {
                piece.classList.remove('falling');
            }, { once: true });
        }
    }
}
