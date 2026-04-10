"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import type { OdontogramStateDefinition, ToothRecord, ToothSurfaceKey } from "@/lib/odontogram/types";

type SurfaceMeta = {
  key: ToothSurfaceKey;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
};

const SURFACE_META: SurfaceMeta[] = [
  { key: "M", position: [-0.48, 0.26, 0], rotation: [0, Math.PI / 2, 0], size: [0.18, 0.46, 0.7] },
  { key: "D", position: [0.48, 0.26, 0], rotation: [0, Math.PI / 2, 0], size: [0.18, 0.46, 0.7] },
  { key: "V", position: [0, 0.26, 0.48], size: [0.78, 0.46, 0.18] },
  { key: "L", position: [0, 0.26, -0.48], size: [0.78, 0.46, 0.18] },
  { key: "O", position: [0, 0.53, 0], rotation: [Math.PI / 2, 0, 0], size: [0.62, 0.62, 0.08] },
];

interface ToothModel3DProps {
  tooth: ToothRecord;
  stateMap: Record<string, OdontogramStateDefinition>;
  className?: string;
}

function SurfaceOverlay({ tooth, stateMap }: Pick<ToothModel3DProps, "tooth" | "stateMap">) {
  return (
    <>
      {SURFACE_META.map((surface) => {
        const stateKey = tooth.surfaces[surface.key];
        const state = stateKey ? stateMap[stateKey] : null;
        const color = state?.color ?? "#e2e8f0";

        return (
          <RoundedBox
            key={`${tooth.id}-${surface.key}`}
            args={surface.size}
            radius={0.02}
            smoothness={3}
            position={surface.position}
            rotation={surface.rotation}
          >
            <meshStandardMaterial color={color} metalness={0.05} roughness={0.35} transparent opacity={state ? 0.95 : 0.38} />
          </RoundedBox>
        );
      })}
    </>
  );
}

function ToothMesh({ tooth, stateMap }: Pick<ToothModel3DProps, "tooth" | "stateMap">) {
  return (
    <group>
      <RoundedBox args={[0.9, 0.9, 0.9]} radius={0.18} smoothness={5} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#f8fafc" metalness={0.05} roughness={0.28} />
      </RoundedBox>

      <mesh position={[-0.2, -0.65, 0]} rotation={[0.05, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.08, 1.15, 16]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </mesh>
      <mesh position={[0.2, -0.65, 0]} rotation={[-0.05, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.08, 1.15, 16]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </mesh>

      <SurfaceOverlay tooth={tooth} stateMap={stateMap} />
    </group>
  );
}

export function ToothModel3D({ tooth, stateMap, className }: ToothModel3DProps) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [1.6, 1.2, 2.2], fov: 42 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2.6, 3.2, 2.2]} intensity={1.1} />
        <directionalLight position={[-2.5, 1.5, -2]} intensity={0.45} />

        <ToothMesh tooth={tooth} stateMap={stateMap} />

        <OrbitControls enablePan enableZoom enableRotate minDistance={1.8} maxDistance={4.5} />
      </Canvas>
    </div>
  );
}
