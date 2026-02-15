import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Player } from '@connect-four/shared';

interface PieceProps {
    player: Player;
    x: number;
    targetY: number;
    isWinningPiece?: boolean;
}

export const Piece: React.FC<PieceProps> = ({ player, x, targetY, isWinningPiece }) => {
    const meshRef = useRef<Mesh>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const [currentY, setCurrentY] = useState(targetY + 8);
    const [velocity, setVelocity] = useState(0);
    const gravity = -0.015;
    const bounce = 0.3;

    useEffect(() => {
        // ... (existing logic)
    }, [targetY]);

    useFrame((state) => {
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

        // Winning Glow Animation
        if (isWinningPiece && materialRef.current) {
            const glow = Math.sin(state.clock.elapsedTime * 5) * 0.5 + 0.5;
            materialRef.current.emissiveIntensity = glow * 2;
        }
    });

    return (
        <mesh 
            ref={meshRef} 
            castShadow 
            position={[x, currentY, 0]} 
            rotation={[Math.PI / 2, 0, 0]}
        >
            <cylinderGeometry args={[0.38, 0.38, 0.2, 32]} />
            <meshStandardMaterial 
                ref={materialRef}
                color={player === 1 ? "#e94560" : "#fcd34d"} 
                emissive={player === 1 ? "#ff0000" : "#ffffff"}
                emissiveIntensity={0}
                roughness={0.2}
                metalness={0.1}
            />
        </mesh>
    );
};

