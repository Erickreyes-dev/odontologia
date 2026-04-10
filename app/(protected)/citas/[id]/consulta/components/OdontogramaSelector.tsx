"use client";

import { useEffect, useMemo, useState } from "react";
import { Odontogram } from "@/components/odontogram/Odontogram";
import { getToothLabel, inferDentitionById, PERMANENT_TEETH, TEMPORARY_TEETH } from "@/lib/odontogram/numbering";
import type { NumberingSystem, OdontogramChart, OdontogramStateDefinition } from "@/lib/odontogram/types";

type ToolScope = "surface" | "whole_tooth" | "gingiva" | "subcrown" | "mobility";
type SelectorFilter = "all" | "present" | "permanent" | "temporary" | "upper" | "lower";
type Preset = "none" | "upper-zircon-6" | "upper-full-zircon" | "lower-metal-6" | "lower-full-metal" | "upper-full-removable" | "lower-full-removable";

interface ClinicalState extends OdontogramStateDefinition {
  scope: ToolScope;
}

const CLINICAL_STATES: ClinicalState[] = [
  { key: "caries-mesial", label: "Caries mesial", color: "#ef4444", scope: "surface" },
  { key: "caries-distal", label: "Caries distal", color: "#ef4444", scope: "surface" },
  { key: "caries-bucal", label: "Caries bucal", color: "#ef4444", scope: "surface" },
  { key: "caries-lingual", label: "Caries lingual", color: "#ef4444", scope: "surface" },
  { key: "caries-occlusal", label: "Caries oclusal", color: "#ef4444", scope: "surface" },
  { key: "filling-composite", label: "Resina", color: "#3b82f6", scope: "surface" },
  { key: "filling-amalgam", label: "Amalgama", color: "#64748b", scope: "surface" },
  { key: "filling-gic", label: "Ionómero", color: "#14b8a6", scope: "surface" },
  { key: "filling-temporary", label: "Temporal", color: "#f59e0b", scope: "surface" },
  { key: "crown-zircon", label: "Corona zirconio", color: "#8b5cf6", scope: "whole_tooth" },
  { key: "crown-metal", label: "Corona metal", color: "#4b5563", scope: "whole_tooth" },
  { key: "bridge-pillar", label: "Pilar puente", color: "#1d4ed8", scope: "whole_tooth" },
  { key: "implant", label: "Implante", color: "#0891b2", scope: "whole_tooth" },
  { key: "tooth-missing", label: "Ausente", color: "#111827", scope: "whole_tooth" },
  { key: "gingivitis", label: "Encía inflamada", color: "#f43f5e", scope: "gingiva" },
  { key: "periodontitis", label: "Periodontal", color: "#be123c", scope: "gingiva" },
  { key: "caries-subcrown", label: "Caries subcorona", color: "#ea580c", scope: "subcrown" },
  { key: "m1", label: "Movilidad M1", color: "#eab308", scope: "mobility" },
  { key: "m2", label: "Movilidad M2", color: "#f97316", scope: "mobility" },
  { key: "m3", label: "Movilidad M3", color: "#ef4444", scope: "mobility" },
];

interface OdontogramaSelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
  chartValue?: OdontogramChart;
  onChartChange?: (chart: OdontogramChart) => void;
}

function baseTooth(id: number, selected = false) {
  const base = selected ? "caries-occlusal" : null;
  return {
    id,
    dentition: inferDentitionById(id),
    surfaces: { M: base, D: base, V: base, L: base, O: base, G: null, SC: null, __TOOTH__: null, __MOBILITY__: null },
  };
}

function buildChartFromSelection(selectedTeeth: number[]): OdontogramChart {
  const selectedSet = new Set(selectedTeeth);
  return { teeth: [...PERMANENT_TEETH, ...TEMPORARY_TEETH].map((id) => baseTooth(id, selectedSet.has(id))) };
}

function applyPresetToTeeth(teeth: OdontogramChart["teeth"], preset: Preset): OdontogramChart["teeth"] {
  const clone = teeth.map((t) => ({ ...t, surfaces: { ...t.surfaces } }));
  const setWhole = (ids: number[], state: string) => {
    clone.forEach((tooth) => {
      if (!ids.includes(tooth.id)) return;
      tooth.surfaces.__TOOTH__ = state;
      tooth.surfaces.M = state;
      tooth.surfaces.D = state;
      tooth.surfaces.V = state;
      tooth.surfaces.L = state;
      tooth.surfaces.O = state;
    });
  };

  if (preset === "none") return clone.map((t) => baseTooth(t.id, false));
  if (preset === "upper-zircon-6") setWhole([13, 12, 11, 21, 22, 23], "crown-zircon");
  if (preset === "upper-full-zircon") setWhole([18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], "crown-zircon");
  if (preset === "lower-metal-6") setWhole([43, 42, 41, 31, 32, 33], "crown-metal");
  if (preset === "lower-full-metal") setWhole([48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38], "crown-metal");
  if (preset === "upper-full-removable") setWhole([18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], "tooth-missing");
  if (preset === "lower-full-removable") setWhole([48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38], "tooth-missing");
  return clone;
}

function matchesFilter(toothId: number, filter: SelectorFilter): boolean {
  const q = Math.floor(toothId / 10);
  if (filter === "permanent") return q <= 4;
  if (filter === "temporary") return q >= 5;
  if (filter === "upper") return q <= 2 || (q >= 5 && q <= 6);
  if (filter === "lower") return (q >= 3 && q <= 4) || q >= 7;
  return true;
}

export function OdontogramaSelector({ value, onChange, chartValue, onChartChange }: OdontogramaSelectorProps) {
  const [activeState, setActiveState] = useState<ClinicalState["key"]>("caries-occlusal");
  const [numberingSystem, setNumberingSystem] = useState<NumberingSystem>("FDI");
  const [filter, setFilter] = useState<SelectorFilter>("all");
  const [preset, setPreset] = useState<Preset>("none");
  const [localChart, setLocalChart] = useState<OdontogramChart>(() => chartValue ?? buildChartFromSelection(value));

  useEffect(() => {
    setLocalChart(chartValue ?? buildChartFromSelection(value));
  }, [chartValue, value]);

  const activeStateMeta = useMemo(() => CLINICAL_STATES.find((s) => s.key === activeState) ?? CLINICAL_STATES[0], [activeState]);
  const visibleIds = useMemo(
    () =>
      localChart.teeth
        .filter((tooth) => {
          if (filter === "present") return Object.values(tooth.surfaces).some(Boolean);
          return matchesFilter(tooth.id, filter);
        })
        .map((tooth) => tooth.id),
    [filter, localChart.teeth]
  );

  const emit = (nextChart: OdontogramChart) => {
    setLocalChart(nextChart);
    onChartChange?.(nextChart);
    const selectedTeeth = Array.from(
      new Set(nextChart.teeth.filter((tooth) => Object.values(tooth.surfaces).some(Boolean)).map((tooth) => tooth.id))
    ).sort((a, b) => a - b);
    onChange(selectedTeeth);
  };

  const applyPreset = (valuePreset: Preset) => {
    setPreset(valuePreset);
    emit({ teeth: applyPresetToTeeth(localChart.teeth, valuePreset) });
  };

  const filteredChart = useMemo(
    () => ({ teeth: localChart.teeth.filter((tooth) => visibleIds.includes(tooth.id)) }),
    [localChart.teeth, visibleIds]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-md border p-3 lg:grid-cols-4">
        <label className="text-xs font-medium text-muted-foreground">
          Numeración
          <select className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={numberingSystem} onChange={(e) => setNumberingSystem(e.target.value as NumberingSystem)}>
            <option value="FDI">FDI</option>
            <option value="UNIVERSAL">Universal</option>
            <option value="PALMER">Palmer</option>
          </select>
        </label>

        <label className="text-xs font-medium text-muted-foreground">
          Filtro
          <select className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as SelectorFilter)}>
            <option value="all">Todas</option>
            <option value="present">Con estado</option>
            <option value="permanent">Permanentes</option>
            <option value="temporary">Temporales</option>
            <option value="upper">Arcada superior</option>
            <option value="lower">Arcada inferior</option>
          </select>
        </label>

        <label className="text-xs font-medium text-muted-foreground">
          Extras (como el módulo)
          <select className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={preset} onChange={(e) => applyPreset(e.target.value as Preset)}>
            <option value="none">Limpiar</option>
            <option value="upper-zircon-6">Superior 13-23 zircon</option>
            <option value="upper-full-zircon">Superior full zircon</option>
            <option value="lower-metal-6">Inferior 43-33 metal</option>
            <option value="lower-full-metal">Inferior full metal</option>
            <option value="upper-full-removable">Superior removible total</option>
            <option value="lower-full-removable">Inferior removible total</option>
          </select>
        </label>

        <div className="rounded-md border bg-muted/40 p-2 text-[11px] text-muted-foreground">
          Estado activo: <strong>{activeStateMeta.label}</strong>. Haz clic en superficies/piezas del odontograma 2D (sin 3D).
        </div>
      </div>

      <div className="grid gap-4 rounded-md border p-3 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Parámetros del odontograma</p>
          <div className="grid max-h-[440px] grid-cols-1 gap-2 overflow-auto pr-1">
            {CLINICAL_STATES.map((state) => (
              <button
                key={state.key}
                type="button"
                onClick={() => setActiveState(state.key)}
                className={`flex items-center justify-between rounded-md border px-2 py-1.5 text-xs ${
                  activeState === state.key ? "border-primary bg-primary/10" : "hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: state.color }} />
                  {state.label}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground">{state.scope.replace("_", " ")}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-card p-3">
          <Odontogram
            value={filteredChart}
            onChange={emit}
            dentition="mixed"
            numberingSystem={numberingSystem}
            secondarySystem={numberingSystem === "FDI" ? "UNIVERSAL" : "FDI"}
            optionalSystem="PALMER"
            activeState={activeState}
            states={CLINICAL_STATES}
            toothSvgBasePath="/odontogram-svg"
            toothSvgPatterns={["{id}.svg", "tooth-{id}.svg", "{dentition}-{id}.svg", "{family}.svg"]}
            className="space-y-2"
          />

          <p className="mt-2 text-xs text-muted-foreground">
            Piezas activas: {value.length ? value.sort((a, b) => a - b).map((id) => `${id} (${getToothLabel(id, numberingSystem)})`).join(", ") : "ninguna"}.
          </p>
        </div>
      </div>
    </div>
  );
}
