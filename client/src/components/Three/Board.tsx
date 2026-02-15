import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { COLS, ROWS } from '@connect-four/shared';

export const Board: React.FC = () => {
    const { makeMove } = useGameStore();

    return (
        <group>
            {/* The Main Wooden Board Block */}
            <mesh receiveShadow castShadow>
                <boxGeometry args={[COLS, ROWS, 0.5]} />
                <meshStandardMaterial color="#3d2b1f" roughness={0.3} metalness={0.1} />
            </mesh>

            {/* Interaction Hitboxes (Invisible) */}
            {Array.from({ length: COLS }).map((_, c) => (
                <mesh 
                    key={`hitbox-${c}`}
                    position={[c - (COLS - 1) / 2, 0, 0.3]}
                    onClick={(e) => {
                        e.stopPropagation();
                        makeMove(c);
                    }}
                >
                    <boxGeometry args={[0.9, ROWS, 0.1]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>
            ))}

            {/* Visual Holes (Simplified for now - can use CSG for real holes later) */}
            {Array.from({ length: COLS }).map((_, c) => (
                Array.from({ length: ROWS }).map((_, r) => (
                    <mesh 
                        key={`hole-${c}-${r}`}
                        position={[c - (COLS - 1) / 2, r - (ROWS - 1) / 2, 0]}
                        rotation={[Math.PI / 2, 0, 0]}
                    >
                        <cylinderGeometry args={[0.4, 0.4, 0.51, 32]} />
                        <meshStandardMaterial color="#1a1512" roughness={1} />
                    </mesh>
                ))
            ))}
        </group>
    );
};
