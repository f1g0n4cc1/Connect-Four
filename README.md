# Connect Four 2026

A modern, web-based Connect Four game with a high-fidelity 3D aesthetic, built on a robust TypeScript monorepo. It features real-time online multiplayer, a challenging AI opponent, and local "hotseat" play.

![Game Screenshot](https://via.placeholder.com/630x540.png?text=3D+Connect+Four+Game)

## Features

*   **Multiple Game Modes:**
    *   **Single Player vs. AI:** Play against an AI with improved minimax heuristics and window-based evaluation.
    *   **Local PvP (Hotseat):** Play against a friend on the same machine.
    *   **Online Multiplayer (PvP):** Create or join private game rooms using a 4-digit code.
*   **High-Fidelity 3D Interface:**
    *   Rendered with **Three.js** and **React Three Fiber** for realistic depth, shadows, and lighting.
    *   Tactile wooden board with physics-based piece drop animations (gravity and bounce).
    *   Interactive cinematic camera with smooth controls.
*   **Modern UI/UX:**
    *   Declarative UI built with **React** and **Tailwind CSS**.
    *   Reactive state management powered by **Zustand**.
    *   Responsive design with modern glassmorphism overlays.
*   **Robust Online Play:**
    *   Real-time communication via **Socket.io** with automatic reconnection and room persistence.
    *   Scalable backend architecture powered by **Fastify 5** and **Redis**.

## Technologies Used

*   **Frontend:** React 18, Three.js, React Three Fiber (R3F), Zustand, Tailwind CSS, Vite 6.
*   **Backend:** Node.js (v24+), Fastify 5, Socket.io 4, TypeScript, Redis.
*   **Shared Logic:** Pure TypeScript library shared across all workspaces.
*   **DevOps:** Docker, Playwright (E2E Testing), Vitest (Unit Testing).

## Project Structure

The project uses a monorepo structure with npm workspaces:

```
/
├── client/                 # React Frontend (Vite + R3F)
│   ├── src/
│   │   ├── components/     # React components & 3D Scene
│   │   ├── store/          # Zustand game store
│   │   ├── App.tsx         # Main layout orchestrator
│   │   └── main.tsx        # React entry point
│   └── Dockerfile
├── server/                 # Fastify + Socket.io Backend
│   ├── index.ts            # Server entry point & Socket handlers
│   ├── game-state.ts       # Room and game-state logic
│   └── Dockerfile
└── shared/                 # Shared TypeScript logic & types
    ├── ai.ts               # Minimax AI implementation
    ├── game-logic.ts       # Core Board class and win detection
    ├── types.ts            # Standardized network message schemas
    └── index.ts            # Package entry point
```

## How to Run

### 1. Prerequisite
Ensure you have Node.js (v20+) installed. A local Redis instance is recommended for production-grade room persistence but not required for development (falls back to in-memory).

### 2. Installation
Install all dependencies for the entire monorepo from the root:

```bash
npm install
```

### 3. Development
Start the server and the client simultaneously in development mode:

```bash
# Run all workspaces in dev mode
npm run dev --workspaces
```

### 4. Testing
Run the test suite to verify shared logic and AI performance:
```bash
npm test
```

## Docker Deployment
The project is fully Dockerized for consistent deployment across environments.

```bash
# Build and run the server
docker build -t connect4-server -f server/Dockerfile .
docker run -p 8080:8080 connect4-server

# Build and run the client (Nginx)
docker build -t connect4-client -f client/Dockerfile .
docker run -p 80:80 connect4-client
```
