import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

export const OnlineLobby: React.FC = () => {
    const { connectionStatus, createRoom, joinRoom, setGameMode } = useGameStore();
    const [code, setCode] = useState('');

    const isConnected = connectionStatus === 'connected';

    return (
        <div className="flex flex-col gap-6 w-[min(90vw,22rem)] p-8 bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-bold text-center text-white">Online Lobby</h2>
            
            <div className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-zinc-400 text-sm uppercase tracking-widest font-semibold">
                    {connectionStatus}
                </span>
            </div>

            <button 
                disabled={!isConnected}
                onClick={createRoom}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
            >
                CREATE ROOM
            </button>

            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-zinc-700"></div>
                <span className="flex-shrink mx-4 text-zinc-500 text-sm font-bold">OR</span>
                <div className="flex-grow border-t border-zinc-700"></div>
            </div>

            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="CODE"
                    maxLength={4}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-1/2 bg-zinc-800 border-2 border-zinc-700 focus:border-indigo-500 outline-none text-white text-center text-xl font-mono rounded-xl p-3 transition-colors"
                />
                <button 
                    disabled={!isConnected || code.length !== 4}
                    onClick={() => joinRoom(code)}
                    className="w-1/2 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-900 font-bold rounded-xl transition-all"
                >
                    JOIN
                </button>
            </div>

            <button 
                onClick={() => setGameMode('menu')}
                className="text-zinc-400 hover:text-white text-sm font-semibold transition-colors"
            >
                ← BACK TO MENU
            </button>
        </div>
    );
};
