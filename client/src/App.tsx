import React from 'react';
import { useGameStore } from './store/useGameStore';
import { MainMenu } from './components/MainMenu';
import { OnlineLobby } from './components/OnlineLobby';
import { RoomWait } from './components/RoomWait';
import { GameScene } from './components/Three/Scene';
import { VictoryOverlay } from './components/VictoryOverlay';
import { FullscreenButton } from './components/FullscreenButton';

const App: React.FC = () => {
    const { gameMode, setGameMode, resetLocalGame, isGameOver } = useGameStore();

    // Determine what to show in the overlay
    const renderOverlay = () => {
        if (isGameOver) return <VictoryOverlay />;

        switch (gameMode) {
            case 'menu':
                return <MainMenu />;
            case 'online-lobby':
                return <OnlineLobby />;
            case 'room-wait':
                return <RoomWait />;
            default:
                return null;
        }
    };

    const isOverlayOpen = isGameOver || ['menu', 'online-lobby', 'room-wait'].includes(gameMode);

    return (
        <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-[#121212]">
            {/* 3D Game Scene */}
            <GameScene />

            {/* In-Game UI Controls */}
            {!isOverlayOpen && (
                <div className="absolute top-8 left-8 z-10 flex gap-4">
                    <button 
                        onClick={() => {
                            resetLocalGame();
                            setGameMode('menu');
                        }}
                        className="bg-zinc-900/50 hover:bg-zinc-800 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/10 transition-all"
                    >
                        ← BACK TO MENU
                    </button>
                </div>
            )}

            {/* Top Right Controls (Always visible) */}
            <div className="absolute top-8 right-8 z-10 flex gap-4">
                <FullscreenButton />
            </div>

            {/* UI Overlays */}
            {isOverlayOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    {renderOverlay()}
                </div>
            )}
        </div>
    );
};

export default App;
