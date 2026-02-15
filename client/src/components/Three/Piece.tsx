import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Player } from '@connect-four/shared';

interface PieceProps {
    player: Player;
    x: number;
    targetY: number;
}

export const Piece: React.FC<PieceProps> = ({ player, x, targetY }) => {
    const meshRef = useRef<Mesh>(null);
    const [currentY, setCurrentY] = useState(targetY + 8);
    const [velocity, setVelocity] = useState(0);
    const gravity = -0.015;
    const bounce = 0.3;

    useEffect(() => {
        // When targetY changes (e.g. board reset), reset drop
        // But for normal drops, it only sets once on mount
    }, [targetY]);

    useFrame(() => {
        if (!meshRef.current) return;

        // Simple physics step
        if (currentY > targetY || Math.abs(velocity) > 0.001) {
            let nextV = velocity + gravity;
            let nextY = currentY + nextV;

            if (nextY <= targetY) {
                nextY = targetY;
                nextV = -nextV * bounce;
            }

            setVelocity(nextV);
            setCurrentY(nextY);
            meshRef.current.position.y = nextY;
        } else {
            meshRef.current.position.y = targetY;
        }
    });

    return (
        <mesh 
            ref={meshRef} 
            castShadow 
            position={[x, currentY, 0.2]} 
            rotation={[Math.PI / 2, 0, 0]}
        >
            <cylinderGeometry args={[0.38, 0.38, 0.2, 32]} />
            <meshStandardMaterial 
                color={player === 1 ? "#e94560" : "#fcd34d"} 
                roughness={0.2}
                metalness={0.1}
            />
        </mesh>
    );
};

