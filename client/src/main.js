import './style.css'
import { Visuals } from './visuals.js'
import { Board } from './game-logic.js'
import { AI } from './ai.js'
import { NetworkManager } from './network.js'
import { AudioManager } from './audio.js'

console.log("Connect Four 2026 Initializing...")

// Constants
const ROWS = 6
const COLS = 7

const audioManager = new AudioManager()
const visuals = new Visuals(ROWS, COLS, audioManager)
const board = new Board(ROWS, COLS)
const ai = new AI(board)
const network = new NetworkManager()

// Game State
let clientState = {
  currentPlayer: 1,
  gameMode: 'menu', // 'menu', 'pve', 'pvp', 'spectator', 'pve-local'
  aiDifficulty: 'easy',
  isAiThinking: false,
  isGameOver: false,
  localPlayerIndex: 1,
  roomCode: null,
  board: [],
  winner: null,
  isDraw: false,
  winningLine: null,
  rematchStatus: 'none',
  connectionStatus: 'disconnected',
  isRequestingOnlineGame: false, // Flag to manage online game requests
}

// UI Elements
const ui = {
  overlay: document.getElementById('menu-overlay'),
  mainMenu: document.getElementById('main-menu'),
  roomWait: document.getElementById('room-wait'),
  displayCode: document.getElementById('display-code'),
  turnIndicator: document.getElementById('turn-indicator')
}

// Menu Handlers
document.getElementById('btn-local').addEventListener('click', () => { audioManager.play('click'); startGame('pve', 'easy'); })
document.getElementById('btn-local-hard').addEventListener('click', () => { audioManager.play('click'); startGame('pve', 'hard'); })
document.getElementById('btn-local-pvp').addEventListener('click', () => { audioManager.play('click'); startGame('pve-local'); })

document.getElementById('btn-online').addEventListener('click', () => {
  audioManager.play('click');
  clientState.isRequestingOnlineGame = true; // Set intent
  
  if (!network.ws || network.ws.readyState !== WebSocket.OPEN) {
    const url = location.hostname === 'localhost' ? 'ws://localhost:8080' : `wss://${location.host}/ws`;
    network.connect(url);
    // The 'onConnected' handler will now create the room
  } else {
    // If already connected, just create the room immediately
    network.createRoom();
  }
});

function render(state) {
  // Render the board
  if (state.board && state.board.length > 0) {
    visuals.renderBoard(state.board, (state.isGameOver && state.winner) ? state.winningLine : [])
  }

  // Update turn indicator
  let turnText = `Player ${state.currentPlayer}'s Turn`
  if (state.gameMode === 'pvp') {
    turnText = state.currentPlayer === state.localPlayerIndex ? "Your Turn" : "Opponent's Turn"
  }
  ui.turnIndicator.textContent = turnText;
  ui.turnIndicator.style.color = state.currentPlayer === 1 ? "var(--chip-p1)" : "var(--chip-p2)";

  // Update ghost piece color
  visuals.setPlayer(state.currentPlayer)

  // Manage menu visibility
  ui.overlay.style.display = 'none';
  ui.mainMenu.classList.add('hidden');
  ui.roomWait.classList.add('hidden');

  if (state.isGameOver) {
    // Game over logic is handled by handleGameOver()
  } else if (state.gameMode === 'menu') {
    ui.overlay.style.display = 'flex';
    ui.mainMenu.classList.remove('hidden');
  } else if (state.gameMode === 'room-wait') {
    ui.overlay.style.display = 'flex';
    ui.roomWait.classList.remove('hidden');
  }
}

function showMainMenu() {
  clientState.gameMode = 'menu'
  render(clientState)
}

function startGame(mode, difficulty = 'easy') {
  clientState.gameMode = mode
  clientState.aiDifficulty = difficulty
  if (mode === 'pve' || mode === 'pve-local') {
    board.reset()
    clientState.board = board.columns
  }
  ui.overlay.style.display = 'none'
  clientState.currentPlayer = 1
  clientState.localPlayerIndex = 1
  clientState.isGameOver = false
  clientState.rematchStatus = 'none'
  visuals.setPlayer(clientState.currentPlayer)
  render(clientState)
}

// --- Network Callbacks ---
network.on('onConnected', () => {
  clientState.connectionStatus = 'connected'
  // Only create a room if the user just clicked "Play Online"
  if (clientState.isRequestingOnlineGame) {
    clientState.isRequestingOnlineGame = false; // Reset the flag
    network.createRoom();
  }
  render(clientState)
})

network.on('onDisconnected', () => {
  clientState.connectionStatus = 'disconnected'
  showMainMenu() // Go back to main menu on disconnect
  render(clientState)
})

network.on('onConnectionError', (error) => {
  clientState.connectionStatus = 'disconnected'
  console.error("WebSocket connection error:", error)
  showMainMenu()
  render(clientState)
})

network.on('onRoomCreated', (code) => {
  clientState.roomCode = code
  clientState.gameMode = 'room-wait'
  ui.displayCode.textContent = code
  clientState.localPlayerIndex = 1
  render(clientState)
})

network.on('onGameStart', ({ playerIndex }) => {
  if (playerIndex) clientState.localPlayerIndex = playerIndex
  clientState.gameMode = 'pvp'
  clientState.isGameOver = false
  clientState.rematchStatus = 'none'
  render(clientState)
})

network.on('onGameStateUpdate', (newState) => {
  Object.assign(clientState, newState);
  render(clientState)
})

network.on('onGameOver', (payload) => {
  handleGameOver(payload);
})

network.on('onRematchPending', () => {
  clientState.rematchStatus = 'pending'
  render(clientState)
})

// --- Game Logic ---
function handleGameOver(result) {
  const banner = document.getElementById('victory-screen');
  const text = document.getElementById('winner-text');
  const playAgainBtn = document.getElementById('victory-play-again');

  clientState.isGameOver = true
  clientState.winner = result.winner
  clientState.isDraw = result.isDraw
  clientState.winningLine = result.winningLine || null
  clientState.rematchStatus = 'none'

  let message = result.reason || "";
  if (!message) {
    if (clientState.winner) {
      message = `Player ${clientState.winner} Wins!`
      audioManager.play('win')
    } else if (clientState.isDraw) {
      message = "It's a Draw!"
    }
  }
  
  text.innerText = message
  banner.classList.add('show')

  playAgainBtn.onclick = () => {
    audioManager.play('click')
    if (clientState.gameMode === 'pvp') {
      network.requestRematch()
      playAgainBtn.disabled = true
      playAgainBtn.textContent = 'Waiting...'
    } else {
      banner.classList.remove('show')
      startGame(clientState.gameMode, clientState.aiDifficulty)
    }
  };
  render(clientState)
}

let isAnimating = false;

async function handleLocalTurn(col) {
  if (isAnimating) return;
  isAnimating = true;

  const row = board.playMove(col, clientState.currentPlayer);
  clientState.board = board.columns;
  render(clientState);
  visuals.animateDrop(col, row);

  visuals.hideGhost();

  const winResult = board.checkWin(col, row, clientState.currentPlayer);
  if (winResult) {
    handleGameOver({ winner: clientState.currentPlayer, isDraw: false, winningLine: winResult });
    isAnimating = false;
    return;
  }

  if (board.columns.every(c => c.length === 6)) {
    handleGameOver({ winner: null, isDraw: true, winningLine: null });
    isAnimating = false;
    return;
  }

  clientState.currentPlayer = clientState.currentPlayer === 1 ? 2 : 1;
  render(clientState);
  
  setTimeout(() => {
    isAnimating = false;
  }, 600);
}

// Controller Logic
visuals.init(async (col) => {
  if (isAnimating || clientState.isAiThinking || clientState.isGameOver) return;
  if (clientState.gameMode === 'menu') return;

  if (clientState.gameMode === 'pvp') {
    if (clientState.currentPlayer !== clientState.localPlayerIndex) {
      console.log("Not your turn");
      return;
    }
    network.makeMove(col);
  } else if (clientState.gameMode === 'pve' || clientState.gameMode === 'pve-local') {
    if (clientState.gameMode === 'pve' && clientState.currentPlayer === 2) {
        console.log("Not your turn (AI's turn)");
        return;
    }
    
    if (!board.isValidMove(col)) {
      console.log("Column is full.");
      return;
    }
    
    await handleLocalTurn(col);

    if (clientState.gameMode === 'pve' && !clientState.isGameOver && clientState.currentPlayer === 2) {
      clientState.isAiThinking = true;
      setTimeout(async () => {
        const aiCol = ai.getBestMove(2, clientState.aiDifficulty);
        await handleLocalTurn(aiCol);
        clientState.isAiThinking = false;
        render(clientState);
      }, 600);
    }
  }
});

console.log("Main initialized")
