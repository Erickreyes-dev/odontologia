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
  readOnly?: boolean;
}

const SURFACE_PATHS: Record<ToothSurfaceKey, string> = {
  M: "M16 22 L30 12 L30 30 L18 38 Z",
  V: "M30 12 L38 12 L38 30 L30 30 Z",
  D: "M38 12 L52 22 L50 38 L38 30 Z",
  L: "M18 38 L30 30 L30 46 L20 52 Z",
  O: "M30 30 L38 30 L46 38 L38 46 L30 46 L22 38 Z",
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
  readOnly,
}: ToothProps) {
  const surfaceEntries = useMemo(
    () => (Object.keys(SURFACE_PATHS) as ToothSurfaceKey[]).map((key) => ({ key, path: SURFACE_PATHS[key] })),
    []
  );

  return (
    <g transform="translate(0 0)">
      <path
        d="M14 18 C20 8 48 8 54 18 L52 44 C48 52 20 52 16 44 Z"
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth={1.3}
        className={readOnly ? "cursor-default" : "cursor-pointer"}
        onClick={() => { if (!readOnly) onToothClick(tooth.id); }}
      />

      <path
        d="M26 52 L22 74 C21 80 27 84 32 80 C37 84 43 80 42 74 L38 52"
        fill="hsl(var(--muted) / 0.45)"
        stroke="hsl(var(--border))"
        strokeWidth={1.2}
        className="pointer-events-none"
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
          readOnly={readOnly}
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

      <text x={34} y={92} textAnchor="middle" fontSize={9} fill="currentColor" className="select-none font-medium">
        {getToothLabel(tooth.id, numberingSystem)}
      </text>

      {secondarySystem ? (
        <text x={34} y={101} textAnchor="middle" fontSize={7} fill="hsl(var(--muted-foreground))" className="select-none">
          {getToothLabel(tooth.id, secondarySystem)}
        </text>
      ) : null}

      {optionalSystem ? (
        <text x={34} y={109} textAnchor="middle" fontSize={7} fill="hsl(var(--muted-foreground))" className="select-none">
          {getToothLabel(tooth.id, optionalSystem)}
        </text>
      ) : null}
    </g>
  );
}
