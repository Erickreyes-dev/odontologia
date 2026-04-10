"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OdontogramStateDefinition, ToothRecord, ToothSurfaceKey } from "@/lib/odontogram/types";

type ToothFamily = "incisor" | "canine" | "premolar" | "molar";

type SurfaceMeta = {
  key: ToothSurfaceKey;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
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

function getFamily(toothId: number): ToothFamily {
  const position = toothId % 10;
  if (position <= 2) return "incisor";
  if (position === 3) return "canine";
  if (position <= 5) return "premolar";
  return "molar";
}

function getCrownScale(family: ToothFamily): [number, number, number] {
  if (family === "incisor") return [0.62, 0.86, 0.44];
  if (family === "canine") return [0.56, 0.92, 0.56];
  if (family === "premolar") return [0.72, 0.86, 0.7];
  return [0.84, 0.8, 0.82];
}

function RootSet({ family }: { family: ToothFamily }) {
  if (family === "incisor" || family === "canine") {
    return (
      <mesh position={[0, -0.68, 0]} rotation={[0.05, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.08, 1.28, 20]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
    );
  }

  if (family === "premolar") {
    return (
      <>
        <mesh position={[-0.2, -0.7, 0]} rotation={[0.05, 0.04, 0]}>
          <cylinderGeometry args={[0.11, 0.08, 1.22, 18]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0.2, -0.7, 0]} rotation={[0.05, -0.04, 0]}>
          <cylinderGeometry args={[0.11, 0.08, 1.22, 18]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
      </>
    );
  }

  return (
    <>
      <mesh position={[-0.28, -0.7, 0.03]} rotation={[0.06, 0.08, 0]}>
        <cylinderGeometry args={[0.1, 0.07, 1.2, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.74, -0.07]} rotation={[0.02, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.08, 1.3, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh position={[0.28, -0.7, 0.03]} rotation={[0.06, -0.08, 0]}>
        <cylinderGeometry args={[0.1, 0.07, 1.2, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
    </>
  );
}

function Cusps({ family }: { family: ToothFamily }) {
  if (family === "canine") {
    return (
      <mesh position={[0, 0.92, 0]}>
        <coneGeometry args={[0.16, 0.28, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.24} />
      </mesh>
    );
  }

  if (family === "premolar") {
    return (
      <>
        <mesh position={[-0.16, 0.82, 0.02]}>
          <sphereGeometry args={[0.11, 20, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={0.24} />
        </mesh>
        <mesh position={[0.16, 0.8, -0.02]}>
          <sphereGeometry args={[0.1, 20, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={0.24} />
        </mesh>
      </>
    );
  }

  if (family === "molar") {
    return (
      <>
        <mesh position={[-0.22, 0.8, 0.18]}>
          <sphereGeometry args={[0.11, 18, 18]} />
          <meshStandardMaterial color="#ffffff" roughness={0.24} />
        </mesh>
        <mesh position={[0.22, 0.8, 0.18]}>
          <sphereGeometry args={[0.1, 18, 18]} />
          <meshStandardMaterial color="#ffffff" roughness={0.24} />
        </mesh>
        <mesh position={[-0.22, 0.8, -0.18]}>
          <sphereGeometry args={[0.1, 18, 18]} />
          <meshStandardMaterial color="#ffffff" roughness={0.24} />
        </mesh>
        <mesh position={[0.22, 0.8, -0.18]}>
          <sphereGeometry args={[0.11, 18, 18]} />
          <meshStandardMaterial color="#ffffff" roughness={0.24} />
        </mesh>
      </>
    );
  }

  return null;
}

function ToothMesh({ tooth, stateMap, onSurfaceClick, onSurfaceHover }: Omit<ToothModel3DProps, "className">) {
  const family = getFamily(tooth.id);

  return (
    <group>
      <mesh position={[0, 0.36, 0]} scale={getCrownScale(family)}>
        <sphereGeometry args={[0.72, 42, 42]} />
        <meshStandardMaterial color="#ffffff" metalness={0.06} roughness={0.23} />
      </mesh>

      <Cusps family={family} />
      <RootSet family={family} />

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
            <meshStandardMaterial color={color} transparent opacity={state ? 0.92 : 0.2} roughness={0.35} metalness={0.05} />
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
