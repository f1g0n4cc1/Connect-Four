import React, { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

export const FullscreenButton: React.FC = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handler = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    return (
        <button 
            onClick={toggleFullscreen}
            className="p-3 bg-zinc-900/50 hover:bg-zinc-800 backdrop-blur-md text-white rounded-full border border-white/10 transition-all shadow-lg active:scale-95"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
    );
};
