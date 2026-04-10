"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getToothGeometry } from "react-odontogram-3d";
import type { OdontogramStateDefinition, ToothRecord, ToothSurfaceKey } from "@/lib/odontogram/types";
import { ToothGltfMesh } from "./ToothGltfMesh";
import { gltfPublicPath, toothIdToGltfBasename, type DentalGltfBasename } from "@/lib/odontogram/dentalModelSources";

type SurfaceMeta = {
  key: ToothSurfaceKey;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
};

type CrownKind = "incisor" | "canine" | "premolar" | "molar";

type AnatomyPreset = {
  crownKind: CrownKind;
  crownScale: [number, number, number];
  crownPosition: [number, number, number];
  crownRotation?: [number, number, number];
  cuspRadius: number;
  cuspPositions: Array<[number, number, number]>;
  rootPositions: Array<[number, number, number]>;
  rootRotations: Array<[number, number, number]>;
  rootScale: [number, number, number];
  surfaceScale: [number, number, number];
};

const SURFACES: SurfaceMeta[] = [
  { key: "M", position: [-0.5, 0.35, 0.02], rotation: [0, Math.PI / 2, 0], scale: [0.18, 0.44, 0.42] },
  { key: "D", position: [0.5, 0.35, 0.02], rotation: [0, Math.PI / 2, 0], scale: [0.18, 0.44, 0.42] },
  { key: "V", position: [0, 0.34, 0.45], scale: [0.66, 0.42, 0.16] },
  { key: "L", position: [0, 0.34, -0.43], scale: [0.66, 0.42, 0.16] },
  { key: "O", position: [0, 0.78, 0], rotation: [Math.PI / 2, 0, 0], scale: [0.45, 0.45, 0.08] },
];

/** Raíces como geometría aparte: molares, molares primarios, 1er premolar superior permanente. */
function shouldUseSeparateRoots(toothId: number): boolean {
  const q = Math.floor(toothId / 10);
  const p = toothId % 10;
  const upper = q === 1 || q === 2 || q === 5 || q === 6;
  const primary = q >= 5;

  if (p >= 6) return true;
  if (primary && (p === 4 || p === 5)) return true;
  if (!primary && p === 4 && upper) return true;
  return false;
}

/**
 * Tamaño base para `getToothGeometry` de react-odontogram-3d (el paquete usa primitivas Three.js
 * por tipo: caja, cono, cilindro). El escalado fino sigue viniendo de `anatomy.crownScale`.
 */
const LIBRARY_TOOTH_GEOMETRY_SIZE = 1;

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

  if (isPrimary) {
    if (position === 1) {
      return {
        crownKind: "incisor",
        crownScale: [0.48, 0.84, 0.4],
        crownPosition: [0, 0.32, 0],
        cuspRadius: 0,
        cuspPositions: [],
        rootPositions: [[0, -0.62, 0]],
        rootRotations: [[0.04, 0, 0]],
        rootScale: [0.92, 0.92, 0.88],
        surfaceScale: [0.72, 0.95, 0.74],
      };
    }
    if (position === 2) {
      return {
        crownKind: "incisor",
        crownScale: [0.46, 0.8, 0.38],
        crownPosition: [0, 0.32, 0],
        cuspRadius: 0,
        cuspPositions: [],
        rootPositions: [[0, -0.6, 0]],
        rootRotations: [[0.04, 0, 0]],
        rootScale: [0.9, 0.9, 0.86],
        surfaceScale: [0.7, 0.92, 0.72],
      };
    }
    if (position === 3) {
      return {
        crownKind: "canine",
        crownScale: [0.5, 0.88, 0.46],
        crownPosition: [0, 0.33, 0],
        cuspRadius: 0.14,
        cuspPositions: [],
        rootPositions: [[0, -0.64, 0]],
        rootRotations: [[0.05, 0, 0]],
        rootScale: [0.94, 1, 0.88],
        surfaceScale: [0.76, 0.96, 0.74],
      };
    }
    if (position === 4) {
      return {
        crownKind: "molar",
        crownScale: [0.66, 0.74, 0.64],
        crownPosition: [0, 0.32, 0],
        cuspRadius: 0.09,
        cuspPositions: [
          [-0.18, 0.76, 0.15],
          [0.18, 0.76, 0.12],
          [-0.16, 0.75, -0.15],
          [0.16, 0.74, -0.16],
        ],
        rootPositions: isUpper ? [[-0.16, -0.66, 0.02], [0.16, -0.66, 0.02], [0, -0.68, -0.05]] : [[-0.14, -0.68, 0], [0.14, -0.68, 0]],
        rootRotations: isUpper ? [[0.05, 0.08, 0], [0.05, -0.08, 0], [0.02, 0, 0]] : [[0.03, 0.04, 0], [0.03, -0.04, 0]],
        rootScale: [0.88, 0.88, 0.88],
        surfaceScale: [0.9, 0.92, 0.9],
      };
    }
    return {
      crownKind: "molar",
      crownScale: [0.72, 0.76, 0.7],
      crownPosition: [0, 0.32, 0],
      cuspRadius: 0.09,
      cuspPositions: [
        [-0.2, 0.77, 0.16],
        [0.2, 0.76, 0.14],
        [-0.18, 0.75, -0.17],
        [0.18, 0.74, -0.18],
      ],
      rootPositions: isUpper ? [[-0.18, -0.68, 0.03], [0.18, -0.68, 0.03], [0, -0.7, -0.06]] : [[-0.16, -0.7, 0], [0.16, -0.7, 0]],
      rootRotations: isUpper ? [[0.05, 0.08, 0], [0.05, -0.08, 0], [0.02, 0, 0]] : [[0.03, 0.04, 0], [0.03, -0.04, 0]],
      rootScale: [0.9, 0.9, 0.9],
      surfaceScale: [0.94, 0.94, 0.94],
    };
  }

  if (position === 1) {
    return {
      crownKind: "incisor",
      crownScale: isUpper ? [0.62, 0.98, 0.48] : [0.52, 0.9, 0.42],
      crownPosition: [0, 0.34, 0],
      cuspRadius: 0,
      cuspPositions: [],
      rootPositions: [[0, -0.72, 0]],
      rootRotations: [[0.04, 0, 0]],
      rootScale: [1, 1.02, 0.9],
      surfaceScale: [0.8, 1, 0.78],
    };
  }
  if (position === 2) {
    return {
      crownKind: "incisor",
      crownScale: isUpper ? [0.56, 0.92, 0.44] : [0.5, 0.88, 0.4],
      crownPosition: [0, 0.34, 0],
      cuspRadius: 0,
      cuspPositions: [],
      rootPositions: [[0, -0.7, 0]],
      rootRotations: [[0.04, 0, 0]],
      rootScale: [0.98, 1, 0.9],
      surfaceScale: [0.78, 0.98, 0.76],
    };
  }
  if (position === 3) {
    return {
      crownKind: "canine",
      crownScale: isUpper ? [0.6, 1.02, 0.58] : [0.54, 0.96, 0.52],
      crownPosition: [0, 0.34, 0],
      cuspRadius: 0.16,
      cuspPositions: [],
      rootPositions: [[0, -0.76, 0]],
      rootRotations: [[0.05, 0, 0]],
      rootScale: [1, 1.14, 0.9],
      surfaceScale: [0.86, 1, 0.82],
    };
  }
  if (position === 4) {
    const upperTwoRoots = isUpper;
    return {
      crownKind: "premolar",
      crownScale: isUpper ? [0.68, 0.9, 0.68] : [0.62, 0.86, 0.62],
      crownPosition: [0, 0.34, 0],
      cuspRadius: 0.1,
      cuspPositions: [
        [-0.16, 0.84, 0.08],
        [0.15, 0.82, -0.06],
      ],
      rootPositions: upperTwoRoots ? [[-0.16, -0.72, 0], [0.16, -0.72, 0]] : [[0, -0.7, 0]],
      rootRotations: upperTwoRoots ? [[0.05, 0.04, 0], [0.05, -0.04, 0]] : [[0.05, 0, 0]],
      rootScale: [0.95, 0.98, 0.94],
      surfaceScale: [0.9, 1, 0.9],
    };
  }
  if (position === 5) {
    return {
      crownKind: "premolar",
      crownScale: isUpper ? [0.7, 0.86, 0.74] : [0.68, 0.86, 0.7],
      crownPosition: [0, 0.34, 0],
      cuspRadius: 0.1,
      cuspPositions: [
        [-0.15, 0.82, 0.1],
        [0.15, 0.8, -0.08],
      ],
      rootPositions: [[0, -0.7, 0]],
      rootRotations: [[0.05, 0, 0]],
      rootScale: [0.95, 0.98, 0.94],
      surfaceScale: [0.94, 1, 0.94],
    };
  }
  if (position === 6) {
    return {
      crownKind: "molar",
      crownScale: isUpper ? [0.86, 0.82, 0.84] : [0.84, 0.8, 0.82],
      crownPosition: [0, 0.33, 0],
      cuspRadius: 0.1,
      cuspPositions: isUpper
        ? [
            [-0.24, 0.84, 0.18],
            [0.22, 0.83, 0.2],
            [-0.2, 0.81, -0.2],
            [0.18, 0.8, -0.2],
          ]
        : [
            [-0.24, 0.84, 0.2],
            [0.02, 0.84, 0.24],
            [0.26, 0.82, 0.03],
            [-0.2, 0.82, -0.16],
            [0.18, 0.8, -0.2],
          ],
      rootPositions: isUpper
        ? [
            [-0.28, -0.72, 0.04],
            [0.28, -0.72, 0.04],
            [0, -0.76, -0.08],
          ]
        : [
            [-0.18, -0.76, 0],
            [0.18, -0.76, 0],
          ],
      rootRotations: isUpper
        ? [
            [0.06, 0.08, 0],
            [0.06, -0.08, 0],
            [0.02, 0, 0],
          ]
        : [
            [0.03, 0.04, 0],
            [0.03, -0.04, 0],
          ],
      rootScale: [0.94, 0.96, 0.94],
      surfaceScale: [1, 1, 1],
    };
  }
  if (position === 7) {
    return {
      crownKind: "molar",
      crownScale: isUpper ? [0.8, 0.78, 0.8] : [0.78, 0.78, 0.78],
      crownPosition: [0, 0.33, 0],
      cuspRadius: 0.1,
      cuspPositions: [
        [-0.22, 0.82, 0.16],
        [0.22, 0.82, 0.16],
        [-0.2, 0.8, -0.18],
        [0.2, 0.8, -0.18],
      ],
      rootPositions: isUpper
        ? [
            [-0.24, -0.72, 0.04],
            [0.24, -0.72, 0.04],
            [0, -0.75, -0.08],
          ]
        : [
            [-0.16, -0.75, 0],
            [0.16, -0.75, 0],
          ],
      rootRotations: isUpper
        ? [
            [0.05, 0.06, 0],
            [0.05, -0.06, 0],
            [0.02, 0, 0],
          ]
        : [
            [0.03, 0.04, 0],
            [0.03, -0.04, 0],
          ],
      rootScale: [0.92, 0.94, 0.92],
      surfaceScale: [0.96, 0.98, 0.96],
    };
  }

  return {
    crownKind: "molar",
    crownScale: [0.72, 0.74, 0.72],
    crownPosition: [0, 0.32, 0],
    cuspRadius: 0.09,
    cuspPositions: [
      [-0.18, 0.78, 0.14],
      [0.18, 0.78, 0.14],
      [-0.16, 0.76, -0.16],
      [0.16, 0.76, -0.16],
    ],
    rootPositions: [[-0.08, -0.7, 0], [0.08, -0.7, 0]],
    rootRotations: [[0.03, 0.02, 0], [0.03, -0.02, 0]],
    rootScale: [0.86, 0.88, 0.86],
    surfaceScale: [0.9, 0.94, 0.9],
  };
}

const ENAMEL = {
  color: "#f2f6f8",
  roughness: 0.38,
  metalness: 0.02,
  clearcoat: 0.28,
  clearcoatRoughness: 0.42,
} as const;

const ROOT_COLOR = "#e8e4df";

function RootCone({
  position,
  rotation,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <coneGeometry args={[0.11, 0.72, 18]} />
      <meshPhysicalMaterial
        color={ROOT_COLOR}
        roughness={0.55}
        metalness={0}
        clearcoat={0.08}
        clearcoatRoughness={0.5}
      />
    </mesh>
  );
}

function ProceduralToothBody({ toothId }: { toothId: number }) {
  const anatomy = getAnatomyPreset(toothId);
  const libraryKind: DentalGltfBasename = toothIdToGltfBasename(toothId);

  const crownGeometry = useMemo(
    () => getToothGeometry(libraryKind, LIBRARY_TOOTH_GEOMETRY_SIZE),
    [libraryKind]
  );

  useEffect(() => {
    return () => {
      crownGeometry.dispose();
    };
  }, [crownGeometry]);

  const rootMeshes = useMemo(() => {
    if (!shouldUseSeparateRoots(toothId)) return null;
    const preset = getAnatomyPreset(toothId);
    return preset.rootPositions.map((pos, index) => (
      <RootCone
        key={`root-${index}`}
        position={pos}
        rotation={[
          Math.PI + (preset.rootRotations[index]?.[0] ?? 0.08),
          preset.rootRotations[index]?.[1] ?? 0,
          preset.rootRotations[index]?.[2] ?? 0,
        ]}
        scale={preset.rootScale}
      />
    ));
  }, [toothId]);

  const showMolarCusps = anatomy.crownKind === "molar" && anatomy.cuspPositions.length > 0;

  return (
    <>
      <mesh
        geometry={crownGeometry}
        position={anatomy.crownPosition}
        rotation={anatomy.crownRotation}
        scale={anatomy.crownScale}
      >
        <meshPhysicalMaterial {...ENAMEL} />
      </mesh>

      {rootMeshes}

      {showMolarCusps
        ? anatomy.cuspPositions.map((cusp, index) => (
            <mesh key={`cusp-${index}`} position={cusp}>
              <sphereGeometry args={[anatomy.cuspRadius, 16, 16]} />
              <meshPhysicalMaterial {...ENAMEL} roughness={0.34} clearcoat={0.22} />
            </mesh>
          ))
        : null}

      {anatomy.crownKind === "premolar" && anatomy.cuspPositions.length > 0
        ? anatomy.cuspPositions.map((cusp, index) => (
            <mesh key={`prem-cusp-${index}`} position={cusp}>
              <sphereGeometry args={[anatomy.cuspRadius * 0.95, 14, 14]} />
              <meshPhysicalMaterial {...ENAMEL} roughness={0.36} />
            </mesh>
          ))
        : null}
    </>
  );
}

function ToothMesh({ tooth, stateMap, onSurfaceClick, onSurfaceHover }: Omit<ToothModel3DProps, "className">) {
  const anatomy = getAnatomyPreset(tooth.id);
  const basename = toothIdToGltfBasename(tooth.id);
  const gltfUrl = gltfPublicPath(basename);
  const [gltfExists, setGltfExists] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(gltfUrl, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setGltfExists(res.ok);
      })
      .catch(() => {
        if (!cancelled) setGltfExists(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gltfUrl]);

  const showGltf = gltfExists === true;

  return (
    <group>
      {showGltf ? (
        <Suspense fallback={<ProceduralToothBody toothId={tooth.id} />}>
          <ToothGltfMesh
            url={gltfUrl}
            scale={anatomy.crownScale}
            position={anatomy.crownPosition}
            rotation={anatomy.crownRotation ?? [0, 0, 0]}
          />
        </Suspense>
      ) : (
        <ProceduralToothBody toothId={tooth.id} />
      )}

      {SURFACES.map((surface) => {
        const stateKey = tooth.surfaces[surface.key];
        const state = stateKey ? stateMap[stateKey] : null;
        const color = state?.color ?? "#cbd5e1";

        return (
          <mesh
            key={`${tooth.id}-${surface.key}`}
            position={surface.position}
            rotation={surface.rotation}
            scale={[
              surface.scale[0] * anatomy.surfaceScale[0],
              surface.scale[1] * anatomy.surfaceScale[1],
              surface.scale[2] * anatomy.surfaceScale[2],
            ]}
            onPointerEnter={() => onSurfaceHover?.(surface.key)}
            onPointerLeave={() => onSurfaceHover?.(null)}
            onClick={(event) => {
              event.stopPropagation();
              onSurfaceClick?.(surface.key);
            }}
          >
            <sphereGeometry args={[0.5, 20, 20]} />
            <meshPhysicalMaterial
              color={color}
              transparent
              opacity={state ? 0.88 : 0.16}
              roughness={0.4}
              metalness={0.04}
              depthWrite={Boolean(state)}
            />
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
        <ambientLight intensity={0.72} />
        <directionalLight position={[2.8, 3.4, 2.2]} intensity={1.15} />
        <directionalLight position={[-2.5, 1.4, -2]} intensity={0.42} />

        <ToothMesh tooth={tooth} stateMap={stateMap} onSurfaceClick={onSurfaceClick} onSurfaceHover={onSurfaceHover} />

        <OrbitControls enablePan enableZoom enableRotate minDistance={1.7} maxDistance={4.3} />
      </Canvas>
    </div>
  );
}
