import { useEffect, useMemo, useState } from "react";
import { ToothSurface } from "./ToothSurface";
import { getToothLabel, inferDentitionById } from "@/lib/odontogram/numbering";
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
  toothSvgBasePath?: string;
  toothSvgPatterns?: string[];
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
    outer: "M15 10 C20 6 26 4 30 4 C34 4 40 6 45 10 C45 20 44 34 42 47 C38 53 34 56 30 56 C26 56 22 53 18 47 C16 34 15 20 15 10 Z",
    root: "M26 56 C24 66 22 75 22 83 C22 88 26 92 30 92 C34 92 38 88 38 83 C38 75 36 66 34 56",
    surfaces: {
      M: "M16 12 C21 8 25 7 29 8 L29 31 L18 37 C17 29 16 21 16 12 Z",
      V: "M29 8 C35 8 40 10 44 12 C44 21 43 29 42 37 L29 31 Z",
      O: "M23 24 C25 21 27 19 30 19 C33 19 35 21 37 24 C35 28 33 30 30 30 C27 30 25 28 23 24 Z",
      L: "M18 37 L29 31 L28 53 C25 52 22 50 19 46 C18 43 18 40 18 37 Z",
      D: "M29 31 L42 37 C42 40 42 43 41 46 C38 50 35 52 32 53 L29 53 Z",
    },
  },
  canine: {
    outer: "M14 14 C19 9 24 6 30 4 C36 6 41 9 46 14 C45 24 44 36 42 49 C38 55 34 58 30 58 C26 58 22 55 18 49 C16 36 15 24 14 14 Z",
    root: "M28 58 C26 69 24 79 24 88 C24 94 30 97 35 92 C38 88 39 80 38 73 C37 67 35 62 33 58",
    surfaces: {
      M: "M16 15 C20 11 24 9 29 8 L29 31 L18 37 C17 30 16 23 16 15 Z",
      V: "M29 8 C35 9 39 11 44 15 C44 23 43 30 42 37 L29 31 Z",
      O: "M24 29 C26 23 28 19 30 16 C32 19 34 23 36 29 C34 32 32 34 30 34 C28 34 26 32 24 29 Z",
      L: "M18 37 L29 31 L28 55 C24 54 21 51 19 47 C18 43 18 40 18 37 Z",
      D: "M29 31 L42 37 C42 40 42 44 41 47 C39 51 36 54 32 55 L29 55 Z",
    },
  },
  premolar: {
    outer: "M10 14 C14 8 22 5 30 5 C38 5 46 8 50 14 C50 23 50 35 48 47 C43 54 37 58 30 58 C23 58 17 54 12 47 C10 35 10 23 10 14 Z",
    root: "M24 58 C22 68 20 76 20 84 C20 90 25 93 29 89 C31 86 32 80 32 74 C32 68 31 62 30 58 M36 58 C34 67 33 75 33 83 C33 89 38 93 42 89 C45 85 46 79 46 72 C45 66 43 61 42 58",
    surfaces: {
      M: "M12 15 C17 10 23 8 29 8 L30 33 L15 38 C13 31 12 24 12 15 Z",
      V: "M29 8 C36 8 42 10 48 15 C48 24 47 31 45 38 L30 33 Z",
      O: "M21 23 C24 19 27 16 30 16 C33 16 36 19 39 23 L38 34 C35 38 33 40 30 40 C27 40 25 38 22 34 Z",
      L: "M15 38 L30 33 L29 55 C24 54 20 52 16 48 C15 44 15 41 15 38 Z",
      D: "M30 33 L45 38 C45 41 45 44 44 48 C40 52 36 54 31 55 L30 55 Z",
    },
  },
  molar: {
    outer: "M7 16 C11 9 20 5 30 5 C40 5 49 9 53 16 C53 24 53 36 51 48 C46 56 38 60 30 60 C22 60 14 56 9 48 C7 36 7 24 7 16 Z",
    root: "M15 60 C13 70 12 78 12 86 C12 92 17 96 22 92 C25 88 26 82 26 75 C26 69 25 63 24 60 M30 60 C29 69 29 77 29 85 C29 91 34 95 38 91 C41 87 42 80 42 73 C41 67 40 62 39 60 M45 60 C46 68 48 76 49 84 C50 90 55 94 59 90 C61 86 60 80 58 73 C56 67 54 62 52 60",
    surfaces: {
      M: "M9 18 C14 11 21 8 29 8 L30 35 L13 40 C11 33 9 26 9 18 Z",
      V: "M29 8 C38 8 45 11 51 18 C51 26 50 33 48 40 L30 35 Z",
      O: "M18 24 C21 18 25 14 30 14 C35 14 39 18 42 24 L42 36 C38 42 35 45 30 45 C25 45 22 42 18 36 Z",
      L: "M13 40 L30 35 L29 57 C24 57 19 54 15 50 C14 46 13 43 13 40 Z",
      D: "M30 35 L48 40 C47 43 46 46 45 50 C41 54 36 57 31 57 L30 57 Z",
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
  toothSvgBasePath,
  toothSvgPatterns,
}: ToothProps) {
  const shape = TOOTH_SHAPES[getToothFamily(tooth.id)];
  const [svgIndex, setSvgIndex] = useState(0);
  const [allSvgFailed, setAllSvgFailed] = useState(false);
  const family = getToothFamily(tooth.id);
  const dentition = tooth.dentition ?? inferDentitionById(tooth.id);

  const svgCandidates = useMemo(() => {
    if (!toothSvgBasePath) return [];
    const basePath = toothSvgBasePath.replace(/\/$/, "");
    const patterns =
      toothSvgPatterns && toothSvgPatterns.length > 0
        ? toothSvgPatterns
        : ["{id}.svg", "tooth-{id}.svg", "{dentition}-{id}.svg", "{family}.svg", "{dentition}-{family}.svg"];
    return patterns.map((pattern) =>
      `${basePath}/${pattern
        .replaceAll("{id}", String(tooth.id))
        .replaceAll("{family}", family)
        .replaceAll("{dentition}", dentition)}`
    );
  }, [dentition, family, tooth.id, toothSvgBasePath, toothSvgPatterns]);

  useEffect(() => {
    setSvgIndex(0);
    setAllSvgFailed(false);
  }, [tooth.id, toothSvgBasePath, toothSvgPatterns]);

  const surfaceEntries = useMemo(
    () => (Object.keys(shape.surfaces) as ToothSurfaceKey[]).map((key) => ({ key, path: shape.surfaces[key] })),
    [shape]
  );

  return (
    <g transform="translate(0 0)">
      {svgCandidates.length > 0 && !allSvgFailed ? (
        <image
          href={svgCandidates[svgIndex]}
          x={6}
          y={3}
          width={48}
          height={58}
          preserveAspectRatio="xMidYMid meet"
          onError={() => {
            if (svgIndex >= svgCandidates.length - 1) {
              setAllSvgFailed(true);
              return;
            }
            setSvgIndex((prev) => prev + 1);
          }}
          onClick={() => {
            if (!readOnly) onToothClick(tooth.id);
          }}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
        />
      ) : (
        <>
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
        </>
      )}

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
