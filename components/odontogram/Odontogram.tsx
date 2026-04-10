"use client";

import { useMemo, useState } from "react";
import { Tooth } from "./Tooth";
import { inferDentitionById, PERMANENT_TEETH, TEMPORARY_TEETH } from "@/lib/odontogram/numbering";
import type {
  DentitionType,
  NumberingSystem,
  OdontogramChart,
  OdontogramStateDefinition,
  SurfaceSelection,
  ToothRecord,
  ToothSurfaceKey,
} from "@/lib/odontogram/types";

const DEFAULT_STATES: OdontogramStateDefinition[] = [
  { key: "caries", label: "Caries", color: "#ef4444", strokeColor: "#991b1b" },
  { key: "restauracion", label: "Restauración", color: "#3b82f6", strokeColor: "#1d4ed8" },
  { key: "corona", label: "Corona", color: "#eab308", strokeColor: "#a16207" },
  { key: "extraccion", label: "Extracción", color: "#6b7280", strokeColor: "#111827" },
  { key: "sellante", label: "Sellante", color: "#14b8a6", strokeColor: "#0f766e" },
];

interface OdontogramProps {
  value?: OdontogramChart;
  onChange?: (nextValue: OdontogramChart) => void;
  initialData?: OdontogramChart;
  dentition?: DentitionType | "mixed";
  numberingSystem?: NumberingSystem;
  secondarySystem?: NumberingSystem;
  optionalSystem?: NumberingSystem;
  activeState?: string;
  states?: OdontogramStateDefinition[];
  className?: string;
  enableSurfaceMultiSelect?: boolean;
  onSelectionChange?: (selection: SurfaceSelection[]) => void;
  compact?: boolean;
  readOnly?: boolean;
  toothSvgBasePath?: string;
  toothSvgPatterns?: string[];
}

function buildEmptyChart(dentition: DentitionType | "mixed"): OdontogramChart {
  const ids =
    dentition === "permanent"
      ? PERMANENT_TEETH
      : dentition === "temporary"
        ? TEMPORARY_TEETH
        : [...PERMANENT_TEETH, ...TEMPORARY_TEETH];

  return {
    teeth: ids.map((id) => ({
      id,
      dentition: inferDentitionById(id),
      surfaces: { M: null, D: null, V: null, L: null, O: null },
    })),
  };
}

interface ArcProps {
  teeth: ToothRecord[];
  upper: boolean;
  stateMap: Record<string, OdontogramStateDefinition>;
  numberingSystem: NumberingSystem;
  secondarySystem?: NumberingSystem;
  optionalSystem?: NumberingSystem;
  activeSelectionSet: Set<string>;
  onToothClick: (toothId: number) => void;
  onSurfaceClick: (toothId: number, surface: ToothSurfaceKey) => void;
  onSurfaceHover: (payload: { toothId: number; surface: ToothSurfaceKey; surfaceLabel: string } | null) => void;
  compact?: boolean;
  readOnly?: boolean;
  toothSvgBasePath?: string;
  toothSvgPatterns?: string[];
}

function ToothArc({
  teeth,
  upper,
  stateMap,
  numberingSystem,
  secondarySystem,
  optionalSystem,
  activeSelectionSet,
  onToothClick,
  onSurfaceClick,
  onSurfaceHover,
  compact,
  readOnly,
  toothSvgBasePath,
  toothSvgPatterns,
}: ArcProps) {
  const width = compact ? 1000 : 1120;
  const height = compact ? 320 : 360;
  const centerX = width / 2;
  const centerY = upper ? height * 0.78 : height * 0.22;
  const radiusX = width * 0.42;
  const radiusY = height * 0.5;
  const start = upper ? Math.PI * 0.95 : Math.PI * 1.05;
  const end = upper ? Math.PI * 0.05 : Math.PI * 1.95;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
      <path
        d={`M ${centerX - radiusX} ${centerY} Q ${centerX} ${upper ? centerY - radiusY : centerY + radiusY} ${centerX + radiusX} ${centerY}`}
        fill="none"
        stroke="hsl(var(--border))"
        strokeDasharray="6 6"
        opacity={0.35}
      />

      {teeth.map((tooth, index) => {
        const ratio = teeth.length === 1 ? 0.5 : index / (teeth.length - 1);
        const theta = start + (end - start) * ratio;
        const x = centerX + radiusX * Math.cos(theta) - 30;
        const y = centerY - radiusY * Math.sin(theta) - 42;
        const rotation = upper ? (theta * 180) / Math.PI - 90 : (theta * 180) / Math.PI - 270;

        return (
          <g key={tooth.id} transform={`translate(${x} ${y}) rotate(${rotation * 0.35} 30 42)`}>
            <Tooth
              tooth={tooth}
              numberingSystem={numberingSystem}
              secondarySystem={secondarySystem}
              optionalSystem={optionalSystem}
              stateMap={stateMap}
              activeSelections={activeSelectionSet}
              onToothClick={onToothClick}
              onSurfaceClick={onSurfaceClick}
              onSurfaceHover={onSurfaceHover}
              readOnly={readOnly}
              toothSvgBasePath={toothSvgBasePath}
              toothSvgPatterns={toothSvgPatterns}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function Odontogram({
  value,
  onChange,
  initialData,
  dentition = "permanent",
  numberingSystem = "FDI",
  secondarySystem = "UNIVERSAL",
  optionalSystem,
  activeState = "caries",
  states = DEFAULT_STATES,
  className,
  enableSurfaceMultiSelect = true,
  onSelectionChange,
  compact,
  readOnly,
  toothSvgBasePath,
  toothSvgPatterns,
}: OdontogramProps) {
  const [internal, setInternal] = useState<OdontogramChart>(() => initialData ?? buildEmptyChart(dentition));
  const [surfaceSelection, setSurfaceSelection] = useState<SurfaceSelection[]>([]);
  const [tooltip, setTooltip] = useState<{ toothId: number; surface: ToothSurfaceKey; surfaceLabel: string } | null>(null);

  const current = value ?? internal;
  const stateMap = useMemo(
    () => Object.fromEntries(states.map((state) => [state.key, state])) as Record<string, OdontogramStateDefinition>,
    [states]
  );

  const activeSelectionSet = useMemo(
    () => new Set(surfaceSelection.map((item) => `${item.toothId}:${item.surface}`)),
    [surfaceSelection]
  );

  const teethByDentition = useMemo(() => {
    const permanent: ToothRecord[] = [];
    const temporary: ToothRecord[] = [];

    current.teeth.forEach((tooth) => {
      const toothDentition = tooth.dentition ?? inferDentitionById(tooth.id);
      if (toothDentition === "temporary") {
        temporary.push(tooth);
        return;
      }
      permanent.push(tooth);
    });

    return {
      permanentUpper: permanent.filter((tooth) => Math.floor(tooth.id / 10) <= 2),
      permanentLower: permanent.filter((tooth) => Math.floor(tooth.id / 10) >= 3),
      temporaryUpper: temporary.filter((tooth) => Math.floor(tooth.id / 10) <= 6),
      temporaryLower: temporary.filter((tooth) => Math.floor(tooth.id / 10) >= 7),
    };
  }, [current.teeth]);

  const updateChart = (next: OdontogramChart) => {
    if (!value) setInternal(next);
    onChange?.(next);
  };

  const toggleSurface = (toothId: number, surface: ToothSurfaceKey) => {
    if (readOnly) return;
    const next = {
      ...current,
      teeth: current.teeth.map((tooth) => {
        if (tooth.id !== toothId) return tooth;
        const prev = tooth.surfaces[surface] ?? null;
        const nextState = prev === activeState ? null : activeState;
        return {
          ...tooth,
          surfaces: { ...tooth.surfaces, [surface]: nextState },
        };
      }),
    };

    updateChart(next);

    if (enableSurfaceMultiSelect) {
      const updatedSelection = activeSelectionSet.has(`${toothId}:${surface}`)
        ? surfaceSelection.filter((item) => !(item.toothId === toothId && item.surface === surface))
        : [...surfaceSelection, { toothId, surface }];
      setSurfaceSelection(updatedSelection);
      onSelectionChange?.(updatedSelection);
    }
  };

  const toggleWholeTooth = (toothId: number) => {
    if (readOnly) return;
    const next = {
      ...current,
      teeth: current.teeth.map((tooth) => {
        if (tooth.id !== toothId) return tooth;
        const hasAnyState = Object.values(tooth.surfaces).some(Boolean);
        const targetState = hasAnyState ? null : activeState;
        return {
          ...tooth,
          surfaces: {
            M: targetState,
            D: targetState,
            V: targetState,
            L: targetState,
            O: targetState,
          },
        };
      }),
    };
    updateChart(next);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-2 text-xs text-muted-foreground">
        <span>Estado activo: {stateMap[activeState]?.label ?? activeState}</span>
        {tooltip ? <span>🦷 {tooltip.toothId} · {tooltip.surfaceLabel} ({tooltip.surface})</span> : <span>Hover para detalle</span>}
      </div>

      <div className="mt-3 space-y-4 rounded-md border bg-background p-3">
        {(dentition === "permanent" || dentition === "mixed") && (
          <>
            <ToothArc
              teeth={teethByDentition.permanentUpper}
              upper
              stateMap={stateMap}
              numberingSystem={numberingSystem}
              secondarySystem={secondarySystem}
              optionalSystem={optionalSystem}
              activeSelectionSet={activeSelectionSet}
              onToothClick={toggleWholeTooth}
              onSurfaceClick={toggleSurface}
              onSurfaceHover={setTooltip}
              compact={compact}
              readOnly={readOnly}
              toothSvgBasePath={toothSvgBasePath}
              toothSvgPatterns={toothSvgPatterns}
            />
            <ToothArc
              teeth={teethByDentition.permanentLower}
              upper={false}
              stateMap={stateMap}
              numberingSystem={numberingSystem}
              secondarySystem={secondarySystem}
              optionalSystem={optionalSystem}
              activeSelectionSet={activeSelectionSet}
              onToothClick={toggleWholeTooth}
              onSurfaceClick={toggleSurface}
              onSurfaceHover={setTooltip}
              compact={compact}
              readOnly={readOnly}
              toothSvgBasePath={toothSvgBasePath}
              toothSvgPatterns={toothSvgPatterns}
            />
          </>
        )}

        {(dentition === "temporary" || dentition === "mixed") && (
          <div className="rounded-md border border-dashed p-2">
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">Dentición temporal</p>
            <ToothArc
              teeth={teethByDentition.temporaryUpper}
              upper
              stateMap={stateMap}
              numberingSystem={numberingSystem}
              secondarySystem={secondarySystem}
              optionalSystem={optionalSystem}
              activeSelectionSet={activeSelectionSet}
              onToothClick={toggleWholeTooth}
              onSurfaceClick={toggleSurface}
              onSurfaceHover={setTooltip}
              compact
              readOnly={readOnly}
              toothSvgBasePath={toothSvgBasePath}
              toothSvgPatterns={toothSvgPatterns}
            />
            <ToothArc
              teeth={teethByDentition.temporaryLower}
              upper={false}
              stateMap={stateMap}
              numberingSystem={numberingSystem}
              secondarySystem={secondarySystem}
              optionalSystem={optionalSystem}
              activeSelectionSet={activeSelectionSet}
              onToothClick={toggleWholeTooth}
              onSurfaceClick={toggleSurface}
              onSurfaceHover={setTooltip}
              compact
              readOnly={readOnly}
              toothSvgBasePath={toothSvgBasePath}
              toothSvgPatterns={toothSvgPatterns}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const MOCK_ODONTOGRAM_DATA: OdontogramChart = {
  teeth: [
    { id: 16, surfaces: { M: "caries", D: null, V: null, L: null, O: "restauracion" } },
    { id: 11, surfaces: { M: null, D: null, V: "sellante", L: null, O: null } },
    { id: 26, surfaces: { M: null, D: null, V: null, L: null, O: "corona" } },
    { id: 36, surfaces: { M: null, D: "caries", V: null, L: null, O: null } },
  ],
};
