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

    return { permanent, temporary };
  }, [current.teeth]);

  const updateChart = (next: OdontogramChart) => {
    if (!value) setInternal(next);
    onChange?.(next);
  };

  const toggleSurface = (toothId: number, surface: ToothSurfaceKey) => {
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

  const renderRow = (items: ToothRecord[]) => (
    <svg viewBox={`0 0 ${items.length * 52} ${compact ? 78 : 88}`} className="h-auto w-full">
      {items.map((tooth, index) => (
        <g key={tooth.id} transform={`translate(${index * 52} 0)`}>
          <Tooth
            tooth={tooth}
            numberingSystem={numberingSystem}
            secondarySystem={secondarySystem}
            optionalSystem={optionalSystem}
            stateMap={stateMap}
            activeSelections={activeSelectionSet}
            onToothClick={toggleWholeTooth}
            onSurfaceClick={toggleSurface}
            onSurfaceHover={setTooltip}
          />
        </g>
      ))}
    </svg>
  );

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-2 text-xs text-muted-foreground">
        <span>Estado activo: {stateMap[activeState]?.label ?? activeState}</span>
        {tooltip ? <span>🦷 {tooltip.toothId} · {tooltip.surfaceLabel} ({tooltip.surface})</span> : <span>Hover para detalle</span>}
      </div>

      <div className="mt-3 space-y-3 rounded-md border bg-background p-3">
        {(dentition === "permanent" || dentition === "mixed") && renderRow(teethByDentition.permanent.filter((t) => t.id < 30))}
        {(dentition === "permanent" || dentition === "mixed") && renderRow(teethByDentition.permanent.filter((t) => t.id >= 30))}
        {(dentition === "temporary" || dentition === "mixed") && renderRow(teethByDentition.temporary.filter((t) => t.id < 70))}
        {(dentition === "temporary" || dentition === "mixed") && renderRow(teethByDentition.temporary.filter((t) => t.id >= 70))}
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
