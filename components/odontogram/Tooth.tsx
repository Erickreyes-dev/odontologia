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

type ToothFamily = "incisor" | "canine" | "premolar" | "molar";

const SURFACE_NAMES: Record<ToothSurfaceKey, string> = {
  M: "Mesial",
  D: "Distal",
  V: "Vestibular/Bucal",
  L: "Lingual/Palatino",
  O: "Oclusal/Incisal",
};

const TOOTH_SHAPES: Record<
  ToothFamily,
  {
    outer: string;
    root: string;
    surfaces: Record<ToothSurfaceKey, string>;
  }
> = {
  incisor: {
    outer: "M14 8 C22 4 38 4 46 8 L44 48 C38 54 22 54 16 48 Z",
    root: "M26 54 L22 78 C21 84 27 88 30 86 C33 88 39 84 38 78 L34 54",
    surfaces: {
      M: "M16 10 L28 8 L28 30 L17 34 Z",
      V: "M28 8 L44 10 L43 30 L28 30 Z",
      O: "M24 24 L30 18 L36 24 L30 30 Z",
      L: "M17 34 L28 30 L27 48 L18 46 Z",
      D: "M28 30 L43 30 L42 46 L33 48 Z",
    },
  },
  canine: {
    outer: "M12 12 L30 6 L48 12 L46 48 C40 56 20 56 14 48 Z",
    root: "M28 54 L24 80 C23 88 31 92 36 84 L38 56",
    surfaces: {
      M: "M14 14 L30 8 L30 30 L16 34 Z",
      V: "M30 8 L46 14 L44 34 L30 30 Z",
      O: "M24 26 L30 18 L36 26 L30 34 Z",
      L: "M16 34 L30 30 L28 48 L16 46 Z",
      D: "M30 30 L44 34 L42 46 L30 48 Z",
    },
  },
  premolar: {
    outer: "M10 10 C16 5 44 5 50 10 L48 48 C44 56 16 56 12 48 Z",
    root: "M24 54 L20 76 C19 84 26 88 30 82 L30 54 M36 54 L32 76 C31 84 38 88 42 82 L42 54",
    surfaces: {
      M: "M12 12 L28 10 L30 30 L14 34 Z",
      V: "M28 10 L48 12 L46 34 L30 30 Z",
      O: "M22 22 L30 16 L38 22 L38 34 L30 40 L22 34 Z",
      L: "M14 34 L30 30 L28 50 L12 48 Z",
      D: "M30 30 L46 34 L48 48 L32 50 Z",
    },
  },
  molar: {
    outer: "M8 12 C14 6 46 6 52 12 L52 48 C46 56 14 56 8 48 Z",
    root: "M16 54 L14 76 C13 84 20 88 24 82 L26 54 M30 54 L30 80 C30 86 36 88 38 82 L40 54 M44 54 L46 76 C47 84 54 88 56 82 L52 54",
    surfaces: {
      M: "M10 14 L26 12 L28 32 L10 34 Z",
      V: "M26 12 L50 14 L50 34 L28 32 Z",
      O: "M20 22 L30 16 L40 22 L40 34 L30 40 L20 34 Z",
      L: "M10 34 L28 32 L26 50 L10 48 Z",
      D: "M28 32 L50 34 L50 48 L30 50 Z",
    },
  },
};

function getToothFamily(toothId: number): ToothFamily {
  const position = toothId % 10;
  if (position <= 2) return "incisor";
  if (position === 3) return "canine";
  if (position <= 5) return "premolar";
  return "molar";
}

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
  const shape = TOOTH_SHAPES[getToothFamily(tooth.id)];

  const surfaceEntries = useMemo(
    () => (Object.keys(shape.surfaces) as ToothSurfaceKey[]).map((key) => ({ key, path: shape.surfaces[key] })),
    [shape]
  );

  return (
    <g transform="translate(0 0)">
      <path
        d={shape.outer}
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth={1.4}
        className={readOnly ? "cursor-default" : "cursor-pointer"}
        onClick={() => {
          if (!readOnly) onToothClick(tooth.id);
        }}
      />

      <path d={shape.root} fill="none" stroke="hsl(var(--border))" strokeWidth={1.2} className="pointer-events-none" />

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
