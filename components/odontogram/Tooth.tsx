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
  M: "M8 8 L26 8 L30 30 L8 30 Z",
  V: "M26 8 L52 8 L52 30 L30 30 Z",
  O: "M30 16 L44 30 L30 44 L16 30 Z",
  L: "M8 30 L30 30 L26 52 L8 52 Z",
  D: "M30 30 L52 30 L52 52 L34 52 Z",
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
      <rect
        x={6}
        y={6}
        width={48}
        height={48}
        rx={8}
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth={1.4}
        className={readOnly ? "cursor-default" : "cursor-pointer"}
        onClick={() => {
          if (!readOnly) onToothClick(tooth.id);
        }}
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

      <text x={30} y={66} textAnchor="middle" fontSize={9} fill="currentColor" className="select-none font-medium">
        {getToothLabel(tooth.id, numberingSystem)}
      </text>

      {secondarySystem ? (
        <text x={30} y={75} textAnchor="middle" fontSize={7} fill="hsl(var(--muted-foreground))" className="select-none">
          {getToothLabel(tooth.id, secondarySystem)}
        </text>
      ) : null}

      {optionalSystem ? (
        <text x={30} y={83} textAnchor="middle" fontSize={7} fill="hsl(var(--muted-foreground))" className="select-none">
          {getToothLabel(tooth.id, optionalSystem)}
        </text>
      ) : null}
    </g>
  );
}
