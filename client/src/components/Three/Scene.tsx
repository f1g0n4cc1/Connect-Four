import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { Board } from './Board';
import { Piece } from './Piece';
import { useGameStore } from '../../store/useGameStore';
import { COLS, ROWS } from '@connect-four/shared';

export const GameScene: React.FC = () => {
    const { board, winningLine } = useGameStore();

    // Flatten board to a list of pieces with their positions
    const pieces = useMemo(() => {
        const p: { player: any; x: number; y: number; id: string; isWinningPiece: boolean }[] = [];
        board.forEach((column, c) => {
            column.forEach((player, r) => {
                const isWinningPiece = !!winningLine?.some(pos => pos.col === c && pos.row === r);
                p.push({
                    player,
                    x: c - (COLS - 1) / 2,
                    y: r - (ROWS - 1) / 2,
                    id: `${c}-${r}`, // Stable ID
                    isWinningPiece
                });
            });
        });
        return p;
    }, [board, winningLine]);

    return (
        <div className="w-full h-full absolute inset-0">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={45} />
                <OrbitControls 
                    enablePan={false} 
                    minDistance={5} 
                    maxDistance={15} 
                    maxPolarAngle={Math.PI / 1.5}
                />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
                <spotLight 
                    position={[-5, 5, 10]} 
                    angle={0.15} 
                    penumbra={1} 
                    intensity={1} 
                    castShadow 
                />
                
                <Environment preset="city" />

                <group rotation={[-0.1, 0.2, 0]}>
                    <Board />
                    {pieces.map(p => (
                        <Piece 
                            key={p.id} 
                            player={p.player} 
                            x={p.x} 
                            targetY={p.y} 
                            isWinningPiece={p.isWinningPiece} 
                        />
                    ))}
                </group>

                <ContactShadows 
                    position={[0, -4, 0]} 
                    opacity={0.4} 
                    scale={20} 
                    blur={2} 
                    far={4.5} 
                />
            </Canvas>
        </div>
    );
};
