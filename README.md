# Connect Four 2026

A modern, web-based Connect Four game with a high-fidelity 3D aesthetic, built on a robust TypeScript monorepo. It features real-time online multiplayer, a challenging AI opponent, and local "hotseat" play.

![Game Screenshot](https://via.placeholder.com/630x540.png?text=3D+Connect+Four+Game)

## Features

*   **Multiple Game Modes:**
    *   **Single Player vs. AI:** Play against an AI with improved minimax heuristics.
    *   **Local PvP (Hotseat):** Play against a friend on the same machine.
    *   **Online Multiplayer (PvP):** Create or join private game rooms using a 4-digit code.
*   **High-Fidelity 3D Interface:**
    *   Rendered with **Three.js** and **React Three Fiber** for realistic depth and lighting.
    *   Tactile wooden board with physics-based piece drop animations (gravity and bounce).
    *   Interactive camera with smooth controls.
*   **Modern UI/UX:**
    *   Declarative UI built with **React** and **Tailwind CSS**.
    *   Reactive state management powered by **Zustand**.
    *   Glowing highlights for winning pieces and cinematic victory banners.
*   **Robust Online Play:**
    *   Real-time communication via **Socket.io** with automatic reconnection.
    *   Scalable backend architecture ready for horizontal scaling with **Redis**.

## Technologies Used

*   **Frontend:** React 18, Three.js, React Three Fiber, Zustand, Tailwind CSS, Vite.
*   **Backend:** Node.js, Fastify, Socket.io, TypeScript, Redis.
*   **Shared Logic:** Pure TypeScript library shared across the monorepo.
*   **DevOps:** Docker, Playwright (E2E Testing), Vitest (Unit Testing).

## Project Structure

The project uses a monorepo structure with npm workspaces:

```
/
├── client/         # React Frontend (Vite + R3F)
│   ├── src/
│   │   ├── components/     # React & Three.js components
│   │   ├── store/          # Zustand game store
│   │   └── main.tsx        # Entry point
│   └── Dockerfile
├── server/         # Fastify + Socket.io Backend
│   ├── index.ts            # Server entry point
│   ├── game-state.ts       # Server-side room logic
│   └── Dockerfile
└── shared/         # Shared TypeScript library
    ├── game-logic.ts       # Core Board class and win detection
    └── types.ts            # Standardized network schemas
```

## How to Run

### 1. Prerequisite
Ensure you have Node.js (v20+) installed. For online play persistence, a local Redis instance is recommended but not required (falls back to in-memory).

### 2. Installation
Install all dependencies for the entire monorepo from the root:

```bash
npm install
```

### 3. Development
Start both the server and the client simultaneously:

```bash
# Run both workspaces in dev mode
npm run dev --workspaces
```

Alternatively, run them individually:
```bash
npm run dev -w @connect-four/server
npm run dev -w @connect-four/client
```

### 4. Testing
Run unit tests for shared logic and AI:
```bash
npm test
```

## Docker Deployment
Build and run the entire stack using Docker:
```bash
# Example for server
docker build -t connect4-server -f server/Dockerfile .
docker run -p 8080:8080 connect4-server
```
