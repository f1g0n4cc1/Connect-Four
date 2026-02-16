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
*   **Backend:** Node.js (v20+), Fastify 5, Socket.io 4, TypeScript, Redis.
*   **Shared Logic:** Pure TypeScript library shared across all workspaces.
*   **DevOps:** Render (Blueprints), Docker, Playwright (E2E Testing), Vitest (Unit Testing).

## Compatibility
This project is **fully cross-platform** and supports:
*   **macOS** (Intel and Apple Silicon)
*   **Windows** (10/11)
*   **Linux** (Ubuntu, Fedora, etc.)

## Project Structure

The project uses a monorepo structure with npm workspaces:

```
/
├── client/                 # React Frontend (Vite + R3F)
│   ├── src/
│   │   ├── components/     # React components & 3D Scene
│   │   ├── store/          # Zustand game store
│   │   └── main.tsx        # React entry point
│   └── Dockerfile
├── server/                 # Fastify + Socket.io Backend
│   ├── index.ts            # Server entry point & Socket handlers
│   ├── game-state.ts       # Room and game-state logic
│   └── Dockerfile
├── shared/                 # Shared TypeScript logic & types
│   ├── ai.ts               # Minimax AI implementation
│   ├── game-logic.ts       # Core Board class and win detection
│   └── types.ts            # Standardized network message schemas
└── render.yaml             # Infrastructure as Code for Render.com
```

## How to Run Locally

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
npm run dev
```

*   **Client:** [http://localhost:5173](http://localhost:5173) (The React UI)
*   **Server:** [ws://localhost:8080](ws://localhost:8080) (The Backend)

## Deployment (Render.com)

This project is pre-configured for deployment on **Render** using the included `render.yaml` Blueprint.

### 1. Backend & Redis
1.  Push your code to a GitHub repository.
2.  Log in to [Render](https://render.com).
3.  Click **New +** -> **Blueprint**.
4.  Connect your repository. Render will automatically create your Fastify server and Redis instance.

### 2. Frontend
Deploy the `client/` folder as a **Static Site**.
1.  **Build Command:** `npm install && npm run build -w @connect-four/shared && npm run build -w @connect-four/client`
2.  **Publish Directory:** `client/dist`
3.  **Environment Variable:** Add `VITE_SERVER_URL` and set it to your live Backend URL (e.g., `https://connect4-backend.onrender.com`).

## Docker Deployment
Alternatively, build and run using Docker:

```bash
# Example for server
docker build -t connect4-server -f server/Dockerfile .
docker run -p 8080:8080 connect4-server
```
