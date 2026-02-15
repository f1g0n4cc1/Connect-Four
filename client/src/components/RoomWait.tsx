import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const RoomWait: React.FC = () => {
    const { roomCode, setGameMode } = useGameStore();

    return (
        <div className="flex flex-col gap-8 w-80 p-8 bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl text-center">
            <h2 className="text-xl font-medium text-zinc-400">Waiting for Opponent...</h2>
            
            <div className="flex flex-col gap-2">
                <span className="text-sm text-zinc-500 uppercase tracking-widest font-bold">Room Code</span>
                <div className="text-5xl font-mono font-black text-chip-p2 tracking-[0.2em] bg-white/5 py-4 rounded-xl border border-white/10">
                    {roomCode || '----'}
                </div>
            </div>

            <p className="text-zinc-400 text-sm italic">
                Share this code with a friend to start playing!
            </p>

            <button 
                onClick={() => setGameMode('menu')}
                className="text-zinc-500 hover:text-white text-sm font-semibold transition-colors mt-4"
            >
                CANCEL
            </button>
        </div>
    );
};
