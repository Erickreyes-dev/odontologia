import { useMemo } from "react";
import { ToothSurface } from "./ToothSurface";
import { getToothLabel } from "@/lib/odontogram/numbering";
import type {
  NumberingSystem,
  OdontogramStateDefinition,
  ToothRecord,
  ToothSurfaceKey,
} from "@/lib/odontogram/types";

interface ToothProps {
  tooth: ToothRecord;
  numberingSystem: NumberingSystem;
  secondarySystem?: NumberingSystem;
  optionalSystem?: NumberingSystem;
  stateMap: Record<string, OdontogramStateDefinition>;
  activeSelections: Set<string>;
  onToothClick: (toothId: number) => void;
  onSurfaceClick: (toothId: number, surface: ToothSurfaceKey) => void;
  onSurfaceHover: (payload: { toothId: number; surface: ToothSurfaceKey; surfaceLabel: string } | null) => void;
}

const SURFACE_PATHS: Record<ToothSurfaceKey, string> = {
  M: "M4 4 L22 4 L14 14 L4 14 Z",
  V: "M22 4 L40 4 L40 14 L30 14 Z",
  O: "M14 14 L30 14 L30 30 L14 30 Z",
  L: "M4 30 L14 30 L14 40 L4 40 Z",
  D: "M30 30 L40 30 L40 40 L30 40 Z",
};

const SURFACE_NAMES: Record<ToothSurfaceKey, string> = {
  M: "Mesial",
  D: "Distal",
  V: "Vestibular/Bucal",
  L: "Lingual/Palatino",
  O: "Oclusal/Incisal",
};

export function Tooth({
  tooth,
  numberingSystem,
  secondarySystem,
  optionalSystem,
  stateMap,
  activeSelections,
  onToothClick,
  onSurfaceClick,
  onSurfaceHover,
}: ToothProps) {
  const surfaceEntries = useMemo(
    () => (Object.keys(SURFACE_PATHS) as ToothSurfaceKey[]).map((key) => ({ key, path: SURFACE_PATHS[key] })),
    []
  );

  return (
    <g transform="translate(0 0)">
      <rect
        x={2}
        y={2}
        width={40}
        height={40}
        rx={5}
        className="cursor-pointer"
        fill="transparent"
        onClick={() => onToothClick(tooth.id)}
      />

      {surfaceEntries.map(({ key, path }) => (
        <ToothSurface
          key={`${tooth.id}-${key}`}
          toothId={tooth.id}
          surface={key}
          path={path}
          label={SURFACE_NAMES[key]}
          stateKey={tooth.surfaces[key] ?? null}
          stateMap={stateMap}
          active={activeSelections.has(`${tooth.id}:${key}`)}
          onSelect={(surface) => onSurfaceClick(tooth.id, surface)}
          onHover={(surface) => {
            if (!surface) {
              onSurfaceHover(null);
              return;
            }
            onSurfaceHover({
              toothId: tooth.id,
              surface,
              surfaceLabel: SURFACE_NAMES[surface],
            });
          }}
        />
      ))}

      <text x={22} y={56} textAnchor="middle" fontSize={8} fill="currentColor" className="select-none">
        {getToothLabel(tooth.id, numberingSystem)}
      </text>

      {secondarySystem ? (
        <text x={22} y={64} textAnchor="middle" fontSize={6} fill="hsl(var(--muted-foreground))" className="select-none">
          {getToothLabel(tooth.id, secondarySystem)}
        </text>
      ) : null}

      {optionalSystem ? (
        <text x={22} y={71} textAnchor="middle" fontSize={6} fill="hsl(var(--muted-foreground))" className="select-none">
          {getToothLabel(tooth.id, optionalSystem)}
        </text>
      ) : null}
    </g>
  );
}
