export const SURFACE_KEYS = ["M", "D", "V", "L", "O"] as const;

export type ToothSurfaceKey = (typeof SURFACE_KEYS)[number];

export type OdontogramStateKey = string;

export type DentitionType = "permanent" | "temporary";

export type NumberingSystem = "FDI" | "UNIVERSAL" | "PALMER";

export interface OdontogramStateDefinition {
  key: OdontogramStateKey;
  label: string;
  color: string;
  strokeColor?: string;
}

export interface ToothSurfaceRecord {
  [surface: string]: OdontogramStateKey | null | undefined;
}

export interface ToothRecord {
  id: number;
  dentition?: DentitionType;
  surfaces: ToothSurfaceRecord;
}

export interface OdontogramChart {
  teeth: ToothRecord[];
}

export interface SurfaceSelection {
  toothId: number;
  surface: ToothSurfaceKey;
}
