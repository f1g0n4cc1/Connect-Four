import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const MainMenu: React.FC = () => {
    const { setGameMode, setAiDifficulty, connect } = useGameStore();

    const handlePvE = (diff: 'easy' | 'hard') => {
        setAiDifficulty(diff);
        setGameMode('pve');
    };

    const handleOnlineClick = () => {
        setGameMode('online-lobby');
        const url = window.location.hostname === 'localhost' ? 'http://localhost:8080' : '/';
        connect(url);
    };

    return (
        <div className="flex flex-col gap-4 w-64">
            <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-chip-p1 to-chip-p2 bg-clip-text text-transparent">
                Connect Four
            </h1>
            <button 
                className="bg-wood-grain text-white py-3 px-6 rounded-lg shadow-lg hover:scale-105 transition-transform"
                onClick={() => handlePvE('easy')}
            >
                vs AI (Easy)
            </button>
            <button 
                className="bg-wood-grain text-white py-3 px-6 rounded-lg shadow-lg hover:scale-105 transition-transform"
                onClick={() => handlePvE('hard')}
            >
                vs AI (Hard)
            </button>
            <button 
                className="bg-wood-grain text-white py-3 px-6 rounded-lg shadow-lg hover:scale-105 transition-transform"
                onClick={() => setGameMode('pve-local')}
            >
                Local PvP
            </button>
            <button 
                className="bg-blue-900 text-white py-3 px-6 rounded-lg shadow-lg hover:scale-105 transition-transform"
                onClick={handleOnlineClick}
            >
                Play Online (Coming soon!)
            </button>
        </div>
    );
};

