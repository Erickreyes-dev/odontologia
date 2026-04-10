/**
 * Geometría procedural por tipo (sin GLB) en la app: `getToothGeometry` del paquete `react-odontogram-3d`
 * (mismas claves incisor | canine | premolar | molar).
 *
 * Referencias para modelos dentales reales en formato glTF/GLB (carga estándar en Three.js con GLTFLoader;
 * en React Three Fiber: `useGLTF` de @react-three/drei).
 *
 * Foro oficial three.js (discusiones GLTFLoader / glb):
 * https://discourse.threejs.org/search?q=gltfloader%20glb
 *
 * Modelos anatómicos públicos (descargar GLB y colocar en /public/odontogram/teeth/):
 * - NIH 3D — arcada / piezas (revisar licencia en la ficha): https://3d.nih.gov/entries/3dpx-003002
 * - Sketchfab — "Adult Tooth Morphology" (morfología adulta; exportar GLB desde Sketchfab):
 *   https://sketchfab.com/3d-models/adult-tooth-morphology-e4d36352db5e414ca1d734845375308b
 * - Sketchfab — "Free Teeth Base Mesh" (GLB incluido; CC Attribution):
 *   https://sketchfab.com/3d-models/free-teeth-base-mesh-b66fde0dc3eb44b0908096aa51b96431
 * - Catálogo GetGLB — "human tooth" (GLB): https://www.getglb.com/anatomy/human-tooth/
 *
 * Convención de archivos esperada por el visor (un GLB por tipo morfológico):
 * @see DENTAL_GLTF_BASENAMES
 */
export const DENTAL_GLTF_BASENAMES = ["incisor", "canine", "premolar", "molar"] as const;

export type DentalGltfBasename = (typeof DENTAL_GLTF_BASENAMES)[number];

/** Mapeo FDI posición 1–8 → `public/odontogram/teeth/{basename}.glb` */
export function toothIdToGltfBasename(toothId: number): DentalGltfBasename {
  const p = toothId % 10;
  if (p <= 2) return "incisor";
  if (p === 3) return "canine";
  if (p <= 5) return "premolar";
  return "molar";
}

export function gltfPublicPath(basename: DentalGltfBasename): string {
  return `/odontogram/teeth/${basename}.glb`;
}
