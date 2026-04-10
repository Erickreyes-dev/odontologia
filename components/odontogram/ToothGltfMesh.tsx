"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const ENAMEL = {
  color: "#f2f6f8",
  roughness: 0.36,
  metalness: 0.02,
  clearcoat: 0.26,
  clearcoatRoughness: 0.4,
} as const;

export interface ToothGltfMeshProps {
  url: string;
  scale: [number, number, number];
  position?: [number, number, number];
  /** Ajuste si el GLB viene orientado distinto (Blender Y-up, etc.). */
  rotation?: [number, number, number];
}

/**
 * Malla cargada desde GLB real. Sustituye materiales por un esmalte tipo clínico
 * para lectura uniforme en el odontograma.
 */
export function ToothGltfMesh({ url, scale, position = [0, 0, 0], rotation = [0, 0, 0] }: ToothGltfMeshProps) {
  const gltf = useGLTF(url);

  const scene = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material = new THREE.MeshPhysicalMaterial({
          ...ENAMEL,
        });
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return root;
  }, [gltf]);

  return <primitive object={scene} scale={scale} position={position} rotation={rotation} />;
}
