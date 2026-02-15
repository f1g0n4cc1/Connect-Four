import React, { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { MainMenu } from './components/MainMenu';
import { OnlineLobby } from './components/OnlineLobby';
import { RoomWait } from './components/RoomWait';

const App: React.FC = () => {
    const { gameMode } = useGameStore();

    // Determine what to show in the overlay
    const renderOverlay = () => {
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

    const isOverlayOpen = ['menu', 'online-lobby', 'room-wait'].includes(gameMode);

    return (
        <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-[#121212]">
            {/* Game Background Scene (Phase 4) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <div className="text-zinc-800 text-9xl font-black rotate-[-10deg] select-none">
                    CONNECT FOUR
                </div>
            </div>

            {/* Main Game Interface (Placeholder for Phase 4) */}
            {!isOverlayOpen && (
                <div className="z-0 flex flex-col items-center gap-8">
                   <div className="text-white text-2xl font-bold animate-pulse">
                        Game Scene Loading... (Phase 4 Implementation)
                   </div>
                   <button 
                    onClick={() => window.location.reload()}
                    className="text-zinc-500 hover:text-white underline"
                   >
                    Quit to Menu (Reload)
                   </button>
                </div>
            )}

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
