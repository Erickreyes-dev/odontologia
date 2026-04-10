"use client";

import { useEffect, useMemo, useState } from "react";
import { Odontogram } from "@/components/odontogram/Odontogram";
import { ToothModel3D } from "@/components/odontogram/ToothModel3D";
import { getToothLabel, inferDentitionById, PERMANENT_TEETH, TEMPORARY_TEETH } from "@/lib/odontogram/numbering";
import type { NumberingSystem, OdontogramChart, OdontogramStateDefinition, ToothSurfaceKey } from "@/lib/odontogram/types";

type ToolScope = "surface" | "whole_tooth" | "gingiva" | "subcrown" | "mobility";
type SelectorFilter = "all" | "present" | "permanent" | "temporary" | "upper" | "lower" | "front" | "molars";

interface ClinicalState extends OdontogramStateDefinition {
  scope: ToolScope;
}

const CLINICAL_STATES: ClinicalState[] = [
  { key: "caries", label: "Caries", color: "#ef4444", strokeColor: "#991b1b", scope: "surface" },
  { key: "restauracion_compuesta", label: "Resina compuesta", color: "#3b82f6", strokeColor: "#1e40af", scope: "surface" },
  { key: "restauracion_amalgama", label: "Amalgama", color: "#64748b", strokeColor: "#334155", scope: "surface" },
  { key: "ionomero", label: "Ionómero", color: "#14b8a6", strokeColor: "#0f766e", scope: "surface" },
  { key: "sellante", label: "Sellante", color: "#22c55e", strokeColor: "#166534", scope: "surface" },
  { key: "endodoncia", label: "Endodoncia", color: "#8b5cf6", strokeColor: "#6d28d9", scope: "whole_tooth" },
  { key: "corona", label: "Corona", color: "#f59e0b", strokeColor: "#b45309", scope: "whole_tooth" },
  { key: "extraccion_plan", label: "Plan extracción", color: "#111827", strokeColor: "#000000", scope: "whole_tooth" },
  { key: "ausente", label: "Ausente", color: "#6b7280", strokeColor: "#1f2937", scope: "whole_tooth" },
  { key: "gingivitis", label: "Gingivitis", color: "#f43f5e", strokeColor: "#9f1239", scope: "gingiva" },
  { key: "periodontitis", label: "Periodontitis", color: "#be123c", strokeColor: "#881337", scope: "gingiva" },
  { key: "subcorona_caries", label: "Subcorona caries", color: "#f97316", strokeColor: "#9a3412", scope: "subcrown" },
  { key: "m1", label: "Movilidad M1", color: "#eab308", strokeColor: "#a16207", scope: "mobility" },
  { key: "m2", label: "Movilidad M2", color: "#f97316", strokeColor: "#c2410c", scope: "mobility" },
  { key: "m3", label: "Movilidad M3", color: "#ef4444", strokeColor: "#991b1b", scope: "mobility" },
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
        surfaces: { M: base, D: base, V: base, L: base, O: base, G: null, SC: null, __TOOTH__: null, __MOBILITY__: null },
      };
    }),
  };
}

function matchesFilter(toothId: number, filter: SelectorFilter): boolean {
  const q = Math.floor(toothId / 10);
  const p = toothId % 10;
  switch (filter) {
    case "permanent":
      return q <= 4;
    case "temporary":
      return q >= 5;
    case "upper":
      return q <= 2 || (q >= 5 && q <= 6);
    case "lower":
      return (q >= 3 && q <= 4) || q >= 7;
    case "front":
      return p <= 3;
    case "molars":
      return p >= 6;
    default:
      return true;
  }
}

export function OdontogramaSelector({ value, onChange, chartValue, onChartChange }: OdontogramaSelectorProps) {
  const [activeState, setActiveState] = useState<ClinicalState["key"]>("caries");
  const [selectedToothId, setSelectedToothId] = useState<number>(16);
  const [localChart, setLocalChart] = useState<OdontogramChart>(() => chartValue ?? buildChartFromSelection(value));
  const [hoverSurface, setHoverSurface] = useState<ToothSurfaceKey | null>(null);
  const [numberingSystem, setNumberingSystem] = useState<NumberingSystem>("FDI");
  const [filter, setFilter] = useState<SelectorFilter>("all");

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
    () => Object.fromEntries(CLINICAL_STATES.map((state) => [state.key, state])) as Record<string, OdontogramStateDefinition>,
    []
  );

  const activeStateMeta = useMemo(() => CLINICAL_STATES.find((state) => state.key === activeState) ?? CLINICAL_STATES[0], [activeState]);

  const selectedTooth = useMemo(
    () => localChart.teeth.find((tooth) => tooth.id === selectedToothId) ?? localChart.teeth[0],
    [localChart.teeth, selectedToothId]
  );

  const visibleToothIds = useMemo(() => {
    const hasState = (tooth: OdontogramChart["teeth"][number]) => Object.values(tooth.surfaces).some((surface) => Boolean(surface));
    return localChart.teeth
      .filter((tooth) => {
        if (filter === "present") return hasState(tooth);
        return matchesFilter(tooth.id, filter);
      })
      .map((tooth) => tooth.id);
  }, [filter, localChart.teeth]);

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

  const toggleByScope = (toothId: number, surface: ToothSurfaceKey | null = null) => {
    const state = activeStateMeta;
    const nextChart: OdontogramChart = {
      ...localChart,
      teeth: localChart.teeth.map((tooth) => {
        if (tooth.id !== toothId) return tooth;
        if (state.scope === "surface" && surface) {
          const current = tooth.surfaces[surface] ?? null;
          return { ...tooth, surfaces: { ...tooth.surfaces, [surface]: current === state.key ? null : state.key } };
        }
        if (state.scope === "whole_tooth") {
          const current = tooth.surfaces.__TOOTH__ ?? null;
          const nextState = current === state.key ? null : state.key;
          return {
            ...tooth,
            surfaces: {
              ...tooth.surfaces,
              __TOOTH__: nextState,
              M: nextState ? state.key : tooth.surfaces.M ?? null,
              D: nextState ? state.key : tooth.surfaces.D ?? null,
              V: nextState ? state.key : tooth.surfaces.V ?? null,
              L: nextState ? state.key : tooth.surfaces.L ?? null,
              O: nextState ? state.key : tooth.surfaces.O ?? null,
            },
          };
        }
        if (state.scope === "gingiva") {
          const current = tooth.surfaces.G ?? null;
          return { ...tooth, surfaces: { ...tooth.surfaces, G: current === state.key ? null : state.key } };
        }
        if (state.scope === "subcrown") {
          const current = tooth.surfaces.SC ?? null;
          return { ...tooth, surfaces: { ...tooth.surfaces, SC: current === state.key ? null : state.key } };
        }
        const current = tooth.surfaces.__MOBILITY__ ?? null;
        return { ...tooth, surfaces: { ...tooth.surfaces, __MOBILITY__: current === state.key ? null : state.key } };
      }),
    };
    emit(nextChart);
  };

  const applyPreset = (preset: "reset" | "mixed" | "edentulous") => {
    const nextChart: OdontogramChart =
      preset === "reset"
        ? buildChartFromSelection([])
        : preset === "mixed"
          ? buildChartFromSelection([11, 12, 16, 21, 26, 31, 36, 41, 46, 55, 65, 75, 85])
          : {
              teeth: localChart.teeth.map((tooth) => ({
                ...tooth,
                surfaces: { ...tooth.surfaces, __TOOTH__: "ausente", M: "ausente", D: "ausente", V: "ausente", L: "ausente", O: "ausente" },
              })),
            };
    emit(nextChart);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-md border p-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-muted-foreground">
          Sistema de numeración
          <select className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={numberingSystem} onChange={(e) => setNumberingSystem(e.target.value as NumberingSystem)}>
            <option value="FDI">FDI</option>
            <option value="UNIVERSAL">Universal</option>
            <option value="PALMER">Palmer</option>
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Filtro de selección
          <select className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as SelectorFilter)}>
            <option value="all">Todas</option>
            <option value="present">Con estado</option>
            <option value="permanent">Permanentes</option>
            <option value="temporary">Temporales</option>
            <option value="upper">Arcada superior</option>
            <option value="lower">Arcada inferior</option>
            <option value="front">Anteriores</option>
            <option value="molars">Molares</option>
          </select>
        </label>
        <div className="text-xs font-medium text-muted-foreground">
          Presets
          <div className="mt-1 flex gap-2">
            <button type="button" className="rounded-md border px-2 py-1 text-xs hover:bg-muted" onClick={() => applyPreset("reset")}>Reset</button>
            <button type="button" className="rounded-md border px-2 py-1 text-xs hover:bg-muted" onClick={() => applyPreset("mixed")}>Dentición mixta</button>
            <button type="button" className="rounded-md border px-2 py-1 text-xs hover:bg-muted" onClick={() => applyPreset("edentulous")}>Edéntulo</button>
          </div>
        </div>
        <div className="rounded-md border bg-muted/30 p-2 text-[11px] text-muted-foreground">
          Estado activo: <strong>{activeStateMeta.label}</strong>. Cambia entre superficies, encía, subcorona, movilidad o estado total por pieza.
        </div>
      </div>

      <div className="rounded-md border p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Vista general (estilo odontograma modular)</p>
        <Odontogram
          value={localChart}
          dentition="mixed"
          numberingSystem={numberingSystem}
          secondarySystem={numberingSystem === "FDI" ? "UNIVERSAL" : "FDI"}
          optionalSystem="PALMER"
          activeState={activeState}
          states={CLINICAL_STATES}
          className="space-y-2"
          toothSvgBasePath="/odontogram-svg"
          toothSvgPatterns={["{id}.svg", "tooth-{id}.svg", "{dentition}-{id}.svg", "{family}.svg"]}
          onChange={emit}
          readOnly={false}
        />
      </div>

      <div className="grid gap-4 rounded-md border p-3 lg:grid-cols-[310px_1fr]">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Pieza dental</label>
            <select className="w-full rounded-md border bg-background p-2 text-sm" value={selectedToothId} onChange={(event) => setSelectedToothId(Number(event.target.value))}>
              {localChart.teeth
                .filter((tooth) => visibleToothIds.includes(tooth.id))
                .map((tooth) => (
                  <option key={tooth.id} value={tooth.id}>
                    {tooth.id} · {getToothLabel(tooth.id, numberingSystem)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Estados clínicos (tipo módulo)</p>
            <div className="grid max-h-[320px] grid-cols-1 gap-2 overflow-auto pr-1">
              {CLINICAL_STATES.map((state) => (
                <button
                  key={state.key}
                  type="button"
                  onClick={() => setActiveState(state.key)}
                  className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs transition ${
                    activeState === state.key ? "border-primary bg-primary/10" : "hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: state.color }} />
                    <span>{state.label}</span>
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground">{state.scope.replace("_", " ")}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="rounded-md border px-2 py-1 text-xs hover:bg-muted" onClick={() => selectedTooth && toggleByScope(selectedTooth.id, "O")}>
              Aplicar en O
            </button>
            <button type="button" className="rounded-md border px-2 py-1 text-xs hover:bg-muted" onClick={() => selectedTooth && toggleByScope(selectedTooth.id, null)}>
              Aplicar por tipo
            </button>
          </div>
        </div>

        <div className="rounded-md border bg-card p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Pieza {selectedTooth?.id ?? "-"}. {hoverSurface ? `Superficie apuntada: ${hoverSurface}.` : "Selecciona una superficie en el modelo 3D."}
          </p>

          {selectedTooth ? (
            <ToothModel3D
              tooth={selectedTooth}
              stateMap={stateMap}
              className="mx-auto h-[360px] w-full max-w-[620px]"
              onSurfaceClick={(surface) => toggleByScope(selectedTooth.id, surface)}
              onSurfaceHover={setHoverSurface}
            />
          ) : null}

          <div className="mt-3 rounded-md border p-2 text-xs">
            <p className="mb-2 font-medium text-muted-foreground">Resumen de la pieza</p>
            {activeSurfaces.length ? (
              <div className="flex flex-wrap gap-2">
                {activeSurfaces.map((entry) => (
                  <span key={entry.surface} className="rounded-full border px-2 py-0.5" style={{ borderColor: stateMap[entry.state ?? ""]?.color }}>
                    {entry.surface} · {stateMap[entry.state ?? ""]?.label ?? entry.state}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Sin superficies marcadas.</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {selectedTooth?.surfaces.G ? <span className="rounded border px-1.5 py-0.5">Encía: {stateMap[selectedTooth.surfaces.G]?.label ?? selectedTooth.surfaces.G}</span> : null}
              {selectedTooth?.surfaces.SC ? <span className="rounded border px-1.5 py-0.5">Subcorona: {stateMap[selectedTooth.surfaces.SC]?.label ?? selectedTooth.surfaces.SC}</span> : null}
              {selectedTooth?.surfaces.__TOOTH__ ? <span className="rounded border px-1.5 py-0.5">Pieza: {stateMap[selectedTooth.surfaces.__TOOTH__]?.label ?? selectedTooth.surfaces.__TOOTH__}</span> : null}
              {selectedTooth?.surfaces.__MOBILITY__ ? <span className="rounded border px-1.5 py-0.5">Movilidad: {stateMap[selectedTooth.surfaces.__MOBILITY__]?.label ?? selectedTooth.surfaces.__MOBILITY__}</span> : null}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Piezas con algún estado: {value.length > 0 ? [...value].sort((a, b) => a - b).join(", ") : "ninguna"}.</p>
    </div>
  );
}
