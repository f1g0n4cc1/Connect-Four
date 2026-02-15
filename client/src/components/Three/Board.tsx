import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { COLS, ROWS } from '@connect-four/shared';

export const Board: React.FC = () => {
    const { makeMove } = useGameStore();
    const [hoveredCol, setHoveredCol] = useState<number | null>(null);

    const boardGeometry = useMemo(() => {
        const width = COLS;
        const height = ROWS;
        const radius = 0.4;

        // 1. Create the outer rectangle shape
        const shape = new THREE.Shape();
        shape.moveTo(-width / 2, -height / 2);
        shape.lineTo(width / 2, -height / 2);
        shape.lineTo(width / 2, height / 2);
        shape.lineTo(-width / 2, height / 2);
        shape.lineTo(-width / 2, -height / 2);

        // 2. Punch 42 holes into the shape
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                const x = c - (COLS - 1) / 2;
                const y = r - (ROWS - 1) / 2;
                
                const holePath = new THREE.Path();
                holePath.absarc(x, y, radius, 0, Math.PI * 2, true);
                shape.holes.push(holePath);
            }
        }

        // 3. Extrude the shape to give it 3D thickness
        const extrudeSettings = {
            steps: 1,
            depth: 0.4,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 3
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, []);

    return (
        <group>
            {/* The Extruded Board with Actual Holes */}
            <mesh 
                geometry={boardGeometry} 
                receiveShadow 
                castShadow 
                position={[0, 0, -0.2]} // Center the 0.4 depth at Z=0
            >
                <meshStandardMaterial color="#3d2b1f" roughness={0.4} metalness={0.2} />
            </mesh>

            {/* Interaction Hitboxes (with Hover feedback) */}
            {Array.from({ length: COLS }).map((_, c) => (
                <mesh 
                    key={`hitbox-${c}`}
                    position={[c - (COLS - 1) / 2, 0, 0.25]}
                    onClick={(e) => {
                        e.stopPropagation();
                        makeMove(c);
                    }}
                    onPointerOver={() => setHoveredCol(c)}
                    onPointerOut={() => setHoveredCol(null)}
                >
                    <boxGeometry args={[0.9, ROWS, 0.1]} />
                    <meshBasicMaterial 
                        transparent 
                        opacity={hoveredCol === c ? 0.1 : 0} 
                        color="white" 
                    />
                </mesh>
            ))}
        </group>
    );
};
