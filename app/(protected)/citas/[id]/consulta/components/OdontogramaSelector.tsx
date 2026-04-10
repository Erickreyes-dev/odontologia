"use client";

import { useEffect, useMemo, useState } from "react";
import { Odontogram } from "@/components/odontogram/Odontogram";
import { ToothModel3D } from "@/components/odontogram/ToothModel3D";
import { getToothLabel, inferDentitionById, PERMANENT_TEETH, TEMPORARY_TEETH } from "@/lib/odontogram/numbering";
import type { OdontogramChart, OdontogramStateDefinition, ToothSurfaceKey } from "@/lib/odontogram/types";

const DEFAULT_STATES: OdontogramStateDefinition[] = [
  { key: "caries", label: "Caries", color: "#ef4444", strokeColor: "#991b1b" },
  { key: "restauracion", label: "Restauración", color: "#3b82f6", strokeColor: "#1d4ed8" },
  { key: "corona", label: "Corona", color: "#eab308", strokeColor: "#a16207" },
  { key: "extraccion", label: "Extracción", color: "#6b7280", strokeColor: "#111827" },
  { key: "sellante", label: "Sellante", color: "#14b8a6", strokeColor: "#0f766e" },
];

const SURFACE_ORDER: ToothSurfaceKey[] = ["M", "V", "O", "L", "D"];

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
  const [hoverSurface, setHoverSurface] = useState<ToothSurfaceKey | null>(null);

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

  const activeSurfaces = useMemo(
    () =>
      SURFACE_ORDER.filter((surface) => Boolean(selectedTooth?.surfaces[surface])).map((surface) => ({
        surface,
        state: selectedTooth?.surfaces[surface] ?? null,
      })),
    [selectedTooth]
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

  const setWholeTooth = (state: string | null) => {
    if (!selectedTooth) return;

    const nextChart: OdontogramChart = {
      ...localChart,
      teeth: localChart.teeth.map((tooth) =>
        tooth.id === selectedTooth.id
          ? {
              ...tooth,
              surfaces: { M: state, D: state, V: state, L: state, O: state },
            }
          : tooth
      ),
    };

    emit(nextChart);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Vista general del odontograma</p>
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

      <div className="grid gap-4 rounded-md border p-3 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">1) Pieza a tratar</label>
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
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">2) Estado clínico</p>
            <div className="grid grid-cols-1 gap-2">
              {DEFAULT_STATES.map((state) => (
                <button
                  key={state.key}
                  type="button"
                  onClick={() => setActiveState(state.key)}
                  className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition ${
                    activeState === state.key ? "border-primary bg-primary/10" : "hover:bg-muted"
                  }`}
                >
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: state.color }} />
                  <span>{state.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-2 text-[11px] text-muted-foreground">
            <p>3) Modelo 3D: haz clic sobre una cara para aplicar o quitar el estado activo.</p>
            <p>Arrastra para rotar, rueda para zoom y Shift + arrastre para mover.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="rounded-md border px-2 py-1 text-xs hover:bg-muted" onClick={() => setWholeTooth(activeState)}>
              Marcar toda pieza
            </button>
            <button type="button" className="rounded-md border px-2 py-1 text-xs hover:bg-muted" onClick={() => setWholeTooth(null)}>
              Limpiar pieza
            </button>
          </div>
        </div>

        <div className="rounded-md border bg-card p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Pieza {selectedTooth?.id ?? "-"}. {hoverSurface ? `Superficie apuntada: ${hoverSurface}.` : "Selecciona una superficie en el modelo."}
          </p>

          {selectedTooth ? (
            <ToothModel3D
              tooth={selectedTooth}
              stateMap={stateMap}
              className="mx-auto h-[360px] w-full max-w-[620px]"
              onSurfaceClick={toggleSurface}
              onSurfaceHover={setHoverSurface}
            />
          ) : null}

          <div className="mt-3 rounded-md border p-2 text-xs">
            <p className="mb-2 font-medium text-muted-foreground">Superficies marcadas</p>
            {activeSurfaces.length ? (
              <div className="flex flex-wrap gap-2">
                {activeSurfaces.map((entry) => (
                  <span key={entry.surface} className="rounded-full border px-2 py-0.5" style={{ borderColor: stateMap[entry.state ?? ""]?.color }}>
                    {entry.surface} · {stateMap[entry.state ?? ""]?.label ?? entry.state}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Sin superficies marcadas en esta pieza.</p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Piezas seleccionadas: {value.length > 0 ? [...value].sort((a, b) => a - b).join(", ") : "ninguna"}.
      </p>
    </div>
  );
}
