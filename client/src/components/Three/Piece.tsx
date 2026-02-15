import React, { useRef, useState } from 'react';
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
    const [currentY, setCurrentY] = useState(targetY + 10); // Start high for drop
    const [velocity, setVelocity] = useState(0);
    const gravity = -0.05;
    const bounce = 0.4;

    useFrame(() => {
        if (!meshRef.current || currentY <= targetY && Math.abs(velocity) < 0.01) return;

        let nextV = velocity + gravity;
        let nextY = currentY + nextV;

        if (nextY <= targetY) {
            nextY = targetY;
            nextV = -nextV * bounce; // Bounce!
        }

        setVelocity(nextV);
        setCurrentY(nextY);
        meshRef.current.position.set(x, nextY, 0.2);
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
