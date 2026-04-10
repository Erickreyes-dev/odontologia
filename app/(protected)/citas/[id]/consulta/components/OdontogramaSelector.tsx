"use client";

import { useEffect, useMemo, useState } from "react";
import { Odontogram } from "@/components/odontogram/Odontogram";
import { Tooth } from "@/components/odontogram/Tooth";
import { getToothLabel, inferDentitionById, PERMANENT_TEETH, TEMPORARY_TEETH } from "@/lib/odontogram/numbering";
import type { OdontogramChart, OdontogramStateDefinition, ToothSurfaceKey } from "@/lib/odontogram/types";

const DEFAULT_STATES: OdontogramStateDefinition[] = [
  { key: "caries", label: "Caries", color: "#ef4444", strokeColor: "#991b1b" },
  { key: "restauracion", label: "Restauración", color: "#3b82f6", strokeColor: "#1d4ed8" },
  { key: "corona", label: "Corona", color: "#eab308", strokeColor: "#a16207" },
  { key: "extraccion", label: "Extracción", color: "#6b7280", strokeColor: "#111827" },
  { key: "sellante", label: "Sellante", color: "#14b8a6", strokeColor: "#0f766e" },
];

interface OdontogramaSelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
  chartValue?: OdontogramChart;
  onChartChange?: (chart: OdontogramChart) => void;
}

function buildChartFromSelection(selectedTeeth: number[]): OdontogramChart {
  const selectedSet = new Set(selectedTeeth);
  return {
    teeth: [...PERMANENT_TEETH, ...TEMPORARY_TEETH].map((id) => {
      const base = selectedSet.has(id) ? "caries" : null;
      return {
        id,
        dentition: inferDentitionById(id),
        surfaces: { M: base, D: base, V: base, L: base, O: base },
      };
    }),
  };
}

export function OdontogramaSelector({ value, onChange, chartValue, onChartChange }: OdontogramaSelectorProps) {
  const [activeState, setActiveState] = useState<(typeof DEFAULT_STATES)[number]["key"]>("caries");
  const [selectedToothId, setSelectedToothId] = useState<number>(16);
  const [localChart, setLocalChart] = useState<OdontogramChart>(() => chartValue ?? buildChartFromSelection(value));
  const [hoverSurfaceLabel, setHoverSurfaceLabel] = useState<string | null>(null);

  useEffect(() => {
    if (chartValue) {
      setLocalChart(chartValue);
      if (!chartValue.teeth.some((tooth) => tooth.id === selectedToothId)) {
        setSelectedToothId(chartValue.teeth[0]?.id ?? 16);
      }
      return;
    }
    setLocalChart(buildChartFromSelection(value));
  }, [chartValue, selectedToothId, value]);

  const stateMap = useMemo(
    () => Object.fromEntries(DEFAULT_STATES.map((state) => [state.key, state])) as Record<string, OdontogramStateDefinition>,
    []
  );

  const selectedTooth = useMemo(
    () => localChart.teeth.find((tooth) => tooth.id === selectedToothId) ?? localChart.teeth[0],
    [localChart.teeth, selectedToothId]
  );

  const emit = (nextChart: OdontogramChart) => {
    setLocalChart(nextChart);
    onChartChange?.(nextChart);

    const selectedTeeth = Array.from(
      new Set(
        nextChart.teeth
          .filter((tooth) => Object.values(tooth.surfaces).some((surface) => Boolean(surface)))
          .map((tooth) => tooth.id)
      )
    ).sort((a, b) => a - b);

    onChange(selectedTeeth);
  };

  const toggleSurface = (surface: ToothSurfaceKey) => {
    if (!selectedTooth) return;
    const nextChart: OdontogramChart = {
      ...localChart,
      teeth: localChart.teeth.map((tooth) => {
        if (tooth.id !== selectedTooth.id) return tooth;
        const current = tooth.surfaces[surface] ?? null;
        return {
          ...tooth,
          surfaces: {
            ...tooth.surfaces,
            [surface]: current === activeState ? null : activeState,
          },
        };
      }),
    };

    emit(nextChart);
  };

  const toggleWholeTooth = () => {
    if (!selectedTooth) return;
    const hasState = Object.values(selectedTooth.surfaces).some(Boolean);
    const targetState = hasState ? null : activeState;

    const nextChart: OdontogramChart = {
      ...localChart,
      teeth: localChart.teeth.map((tooth) =>
        tooth.id === selectedTooth.id
          ? {
              ...tooth,
              surfaces: {
                M: targetState,
                D: targetState,
                V: targetState,
                L: targetState,
                O: targetState,
              },
            }
          : tooth
      ),
    };

    emit(nextChart);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Vista de arcada (solo visual)</p>
        <Odontogram
          value={localChart}
          dentition="mixed"
          numberingSystem="FDI"
          secondarySystem="UNIVERSAL"
          optionalSystem="PALMER"
          className="space-y-2"
          readOnly
        />
      </div>

      <div className="grid gap-4 rounded-md border p-3 lg:grid-cols-[260px_1fr]">
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">Seleccionar pieza a editar</label>
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={selectedToothId}
            onChange={(event) => setSelectedToothId(Number(event.target.value))}
          >
            {localChart.teeth.map((tooth) => (
              <option key={tooth.id} value={tooth.id}>
                {tooth.id} · FDI {getToothLabel(tooth.id, "FDI")} · UNI {getToothLabel(tooth.id, "UNIVERSAL")}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2">
            {DEFAULT_STATES.map((state) => (
              <button
                key={state.key}
                type="button"
                onClick={() => setActiveState(state.key)}
                className={`rounded-md border px-2 py-1 text-xs transition ${
                  activeState === state.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {state.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="w-full rounded-md border px-2 py-1 text-xs hover:bg-muted"
            onClick={toggleWholeTooth}
          >
            Aplicar/quitar estado en todo el diente
          </button>
        </div>

        <div className="rounded-md border bg-card p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Edición precisa de pieza {selectedTooth?.id ?? "-"}: clic en cada superficie para alternar estado.
          </p>
          <div className="mb-3 grid grid-cols-5 gap-1 text-center text-[11px] text-muted-foreground">
            <span className="rounded border px-1 py-0.5">M</span>
            <span className="rounded border px-1 py-0.5">V/B</span>
            <span className="rounded border px-1 py-0.5">O/I</span>
            <span className="rounded border px-1 py-0.5">L/P</span>
            <span className="rounded border px-1 py-0.5">D</span>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">
            {hoverSurfaceLabel ? `Superficie activa: ${hoverSurfaceLabel}` : "Pase el mouse por una superficie para ver su nombre."}
          </p>
          {selectedTooth ? (
            <svg viewBox="0 0 140 190" className="mx-auto h-[280px] w-full max-w-[260px]">
              <g transform="translate(18 8) scale(1.5)">
                <Tooth
                  tooth={selectedTooth}
                  numberingSystem="FDI"
                  secondarySystem="UNIVERSAL"
                  optionalSystem="PALMER"
                  stateMap={stateMap}
                  activeSelections={new Set<string>()}
                  onToothClick={toggleWholeTooth}
                  onSurfaceClick={(_, surface) => toggleSurface(surface)}
                  onSurfaceHover={(payload) => setHoverSurfaceLabel(payload?.surfaceLabel ?? null)}
                />
              </g>
            </svg>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Piezas seleccionadas: {value.length > 0 ? [...value].sort((a, b) => a - b).join(", ") : "ninguna"}.
      </p>
    </div>
  );
}
