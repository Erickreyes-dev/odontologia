"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OdontogramStateDefinition, ToothRecord, ToothSurfaceKey } from "@/lib/odontogram/types";

type SurfaceMeta = {
  key: ToothSurfaceKey;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
};

type AnatomyPreset = {
  crownScale: [number, number, number];
  cuspPositions: Array<[number, number, number]>;
  rootPositions: Array<[number, number, number]>;
  rootRotations: Array<[number, number, number]>;
};

const SURFACES: SurfaceMeta[] = [
  { key: "M", position: [-0.52, 0.38, 0], rotation: [0, Math.PI / 2, 0], size: [0.14, 0.48, 0.62] },
  { key: "D", position: [0.52, 0.38, 0], rotation: [0, Math.PI / 2, 0], size: [0.14, 0.48, 0.62] },
  { key: "V", position: [0, 0.38, 0.44], size: [0.82, 0.48, 0.14] },
  { key: "L", position: [0, 0.38, -0.44], size: [0.82, 0.48, 0.14] },
  { key: "O", position: [0, 0.74, 0], rotation: [Math.PI / 2, 0, 0], size: [0.58, 0.58, 0.05] },
];

interface ToothModel3DProps {
  tooth: ToothRecord;
  stateMap: Record<string, OdontogramStateDefinition>;
  className?: string;
  onSurfaceClick?: (surface: ToothSurfaceKey) => void;
  onSurfaceHover?: (surface: ToothSurfaceKey | null) => void;
}

function getAnatomyPreset(toothId: number): AnatomyPreset {
  const quadrant = Math.floor(toothId / 10);
  const position = toothId % 10;
  const isUpper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
  const isPrimary = quadrant >= 5;

  if (position <= 2) {
    return {
      crownScale: position === 1 ? [0.58, 0.95, 0.44] : [0.52, 0.9, 0.42],
      cuspPositions: [],
      rootPositions: [[0, -0.68, 0]],
      rootRotations: [[0.05, 0, 0]],
    };
  }

  if (position === 3) {
    return {
      crownScale: [0.56, 0.98, 0.56],
      cuspPositions: [[0, 0.95, 0]],
      rootPositions: [[0, -0.7, 0]],
      rootRotations: [[0.05, 0, 0]],
    };
  }

  if (position === 4 || position === 5) {
    const twoRootsUpper = isUpper && !isPrimary && position === 4;
    return {
      crownScale: position === 4 ? [0.66, 0.88, 0.66] : [0.7, 0.84, 0.72],
      cuspPositions: [
        [-0.16, 0.82, 0.04],
        [0.16, 0.8, -0.04],
      ],
      rootPositions: twoRootsUpper ? [[-0.18, -0.7, 0], [0.18, -0.7, 0]] : [[0, -0.68, 0]],
      rootRotations: twoRootsUpper ? [[0.05, 0.04, 0], [0.05, -0.04, 0]] : [[0.05, 0, 0]],
    };
  }

  const upperMolarRoots = isUpper ? 3 : 2;
  return {
    crownScale: [0.84, 0.8, 0.82],
    cuspPositions: [
      [-0.22, 0.8, 0.18],
      [0.22, 0.8, 0.18],
      [-0.22, 0.8, -0.18],
      [0.22, 0.8, -0.18],
    ],
    rootPositions:
      upperMolarRoots === 3
        ? [
            [-0.28, -0.7, 0.03],
            [0, -0.74, -0.07],
            [0.28, -0.7, 0.03],
          ]
        : [
            [-0.18, -0.74, 0],
            [0.18, -0.74, 0],
          ],
    rootRotations:
      upperMolarRoots === 3
        ? [
            [0.06, 0.08, 0],
            [0.02, 0, 0],
            [0.06, -0.08, 0],
          ]
        : [
            [0.03, 0.04, 0],
            [0.03, -0.04, 0],
          ],
  };
}

function ToothMesh({ tooth, stateMap, onSurfaceClick, onSurfaceHover }: Omit<ToothModel3DProps, "className">) {
  const anatomy = getAnatomyPreset(tooth.id);

  return (
    <group>
      <mesh position={[0, 0.36, 0]} scale={anatomy.crownScale}>
        <sphereGeometry args={[0.72, 46, 46]} />
        <meshStandardMaterial color="#ffffff" metalness={0.06} roughness={0.23} />
      </mesh>

      {anatomy.cuspPositions.map((cusp, index) => (
        <mesh key={`cusp-${index}`} position={cusp}>
          {tooth.id % 10 === 3 ? <coneGeometry args={[0.16, 0.28, 20]} /> : <sphereGeometry args={[0.1, 20, 20]} />}
          <meshStandardMaterial color="#ffffff" roughness={0.24} />
        </mesh>
      ))}

      {anatomy.rootPositions.map((position, index) => (
        <mesh key={`root-${index}`} position={position} rotation={anatomy.rootRotations[index] ?? [0.04, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.07, 1.24, 18]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
      ))}

      {SURFACES.map((surface) => {
        const stateKey = tooth.surfaces[surface.key];
        const state = stateKey ? stateMap[stateKey] : null;
        const color = state?.color ?? "#cbd5e1";

        return (
          <mesh
            key={`${tooth.id}-${surface.key}`}
            position={surface.position}
            rotation={surface.rotation}
            onPointerEnter={() => onSurfaceHover?.(surface.key)}
            onPointerLeave={() => onSurfaceHover?.(null)}
            onClick={(event) => {
              event.stopPropagation();
              onSurfaceClick?.(surface.key);
            }}
          >
            <boxGeometry args={surface.size} />
            <meshStandardMaterial color={color} transparent opacity={state ? 0.92 : 0.18} roughness={0.35} metalness={0.05} />
          </mesh>
        );
      })}
    </group>
  );
}

export function ToothModel3D({ tooth, stateMap, className, onSurfaceClick, onSurfaceHover }: ToothModel3DProps) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [1.8, 1.35, 2.2], fov: 38 }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[2.8, 3.4, 2.2]} intensity={1.12} />
        <directionalLight position={[-2.5, 1.4, -2]} intensity={0.48} />

        <ToothMesh tooth={tooth} stateMap={stateMap} onSurfaceClick={onSurfaceClick} onSurfaceHover={onSurfaceHover} />

        <OrbitControls enablePan enableZoom enableRotate minDistance={1.7} maxDistance={4.3} />
      </Canvas>
    </div>
  );
}
