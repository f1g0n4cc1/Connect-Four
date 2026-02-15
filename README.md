# Connect Four 2026

A modern, web-based Connect Four game with a tactile 3D aesthetic, built on a client-server architecture. It features real-time online multiplayer, a challenging AI opponent, and local "hotseat" play.

![Game Screenshot](https://via.placeholder.com/630x540.png?text=3D+Connect+Four+Game)

## Features

*   **Multiple Game Modes:**
    *   **Single Player vs. AI:** Play against an AI with "Easy" and "Hard" (Minimax) difficulty settings.
    *   **Local PvP (Hotseat):** Play against a friend on the same machine.
    *   **Online Multiplayer (PvP):** Create or join a private game room using a 4-digit code.
*   **Modern 3D Interface:**
    *   A game board rendered with CSS 3D transforms to create a sense of depth and perspective.
    *   A tactile "wooden board" aesthetic with recessed, neumorphic holes.
    *   Smooth, physics-based drop animations for the game pieces.
*   **Rich User Feedback:**
    *   **Sound Effects:** Audio feedback for piece drops, button clicks, and game wins.
    *   **Visual Highlights:** The winning four pieces are highlighted with a glowing animation.
    *   **3D Victory Banner:** A "Glassmorphism" banner flies into the scene to announce the winner.
*   **Robust Online Play:**
    *   Real-time, turn-based gameplay powered by WebSockets.
    *   Clear connection status feedback in the online lobby.
    *   **Rematch System:** After an online game, players can request a rematch to play again instantly.

## Technologies Used

*   **Frontend:**
    *   HTML5
    *   CSS3 (with CSS Grid, 3D Transforms, and Keyframe Animations)
    *   Vanilla JavaScript (ESM)
    *   **Vite:** For a fast and lean frontend development experience.
*   **Backend:**
    *   **Node.js:** For the server environment.
    *   **`ws`:** A popular, high-performance WebSocket library for Node.js.
*   **Architecture:**
    *   **Client-Server Model:** The server is the single source of truth for all game logic and state, ensuring a secure and consistent experience.

## Project Structure

The project is organized into two main directories:

```
/
├── client/         # Contains all the frontend code
│   ├── src/
│   │   ├── main.js         # Main entry point, state management, UI logic
│   │   ├── visuals.js      # Handles DOM rendering and animations
│   │   ├── network.js      # Manages WebSocket communication
│   │   ├── ai.js           # AI logic (minimax algorithm)
│   │   └── audio.js        # Sound effect manager
│   ├── index.html
│   └── package.json
├── server/         # Contains all the backend code
│   ├── index.js          # WebSocket server setup and message handling
│   ├── game-state.js     # Server-side game logic and state management
│   └── package.json
└── shared/         # Shared code between client and server
    ├── game-logic.js     # Core Board class and win detection
    └── game-logic.test.js
```

## How to Run

To run this project, you need to start both the server and the client in separate terminal windows.

### 1. Start the Server

Navigate to the `server` directory, install dependencies, and start the Node.js server:

```bash
cd server
npm install
node index.js
```
The server will start on `ws://localhost:8080`.

### 2. Start the Client

In a new terminal, navigate to the `client` directory, install dependencies, and then start the development server:

```bash
cd client
npm install
npm run dev
```

Once the client development server is running, it will typically provide a local URL (e.g., `http://localhost:5173`) where you can open the game in your web browser.
