import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const VictoryOverlay: React.FC = () => {
    const { winner, isDraw, resetLocalGame, requestRematch, gameMode, setGameMode } = useGameStore();

    const handlePlayAgain = () => {
        if (gameMode === 'pvp') {
            requestRematch();
        } else {
            resetLocalGame();
            // Store automatically restarts local games on reset if mode is pve/local
        }
    };

    let title = "";
    let color = "";

    if (isDraw) {
        title = "It's a Draw!";
        color = "text-zinc-400";
    } else {
        title = `Player ${winner} Wins!`;
        color = winner === 1 ? "text-chip-p1" : "text-chip-p2";
    }

    return (
        <div className="flex flex-col items-center gap-8 bg-zinc-900/90 backdrop-blur-xl p-8 md:p-12 w-[min(95vw,30rem)] rounded-3xl border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in duration-500">
            <h1 className={`text-4xl md:text-6xl font-black italic tracking-tighter ${color} drop-shadow-2xl text-center`}>
                {title}
            </h1>
            
            <div className="flex gap-4">
                <button 
                    onClick={handlePlayAgain}
                    className="bg-white text-zinc-950 font-black px-8 py-4 rounded-xl hover:scale-105 transition-transform"
                >
                    PLAY AGAIN
                </button>
                <button 
                    onClick={() => {
                        resetLocalGame();
                        setGameMode('menu');
                    }}
                    className="bg-zinc-800 text-white font-bold px-8 py-4 rounded-xl hover:bg-zinc-700 transition-colors"
                >
                    QUIT
                </button>
            </div>
        </div>
    );
};
