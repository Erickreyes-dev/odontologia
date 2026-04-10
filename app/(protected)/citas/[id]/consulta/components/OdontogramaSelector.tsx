"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Odontogram } from "@/components/odontogram/Odontogram";
import { getToothGeometry } from "react-odontogram-3d";
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

const SURFACE_LABELS: Record<ToothSurfaceKey, string> = {
  M: "Mesial",
  D: "Distal",
  V: "Vestibular/Bucal",
  L: "Lingual/Palatino",
  O: "Oclusal/Incisal",
};

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

function resolveToothTypeById(id: number): "incisor" | "canine" | "premolar" | "molar" {
  const position = id % 10;
  if (position <= 2) return "incisor";
  if (position === 3) return "canine";
  if (position <= 5) return "premolar";
  return "molar";
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

  const toothGeometry = useMemo(() => getToothGeometry(resolveToothTypeById(selectedTooth?.id ?? 16), 2.5), [selectedTooth?.id]);

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
            <p>3) Modelo 3D oficial de react-odontogram-3d para la pieza seleccionada.</p>
            <p>4) Aplica estados por superficie con los botones inferiores.</p>
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
            Pieza {selectedTooth?.id ?? "-"}.{" "}
            {hoverSurface ? `Superficie seleccionada: ${SURFACE_LABELS[hoverSurface]} (${hoverSurface}).` : "Selecciona una superficie para aplicar estado."}
          </p>

          <div className="mx-auto h-[360px] w-full max-w-[620px] overflow-hidden rounded-md border bg-gradient-to-b from-slate-50 to-slate-100">
            <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[4, 5, 4]} intensity={0.9} />
              <mesh geometry={toothGeometry}>
                <meshStandardMaterial color="#f4f4f5" roughness={0.35} metalness={0.05} />
              </mesh>
              <OrbitControls enablePan={false} />
            </Canvas>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {SURFACE_ORDER.map((surface) => {
              const active = selectedTooth?.surfaces[surface] ?? null;
              const activeColor = active ? stateMap[active]?.color : undefined;
              return (
                <button
                  key={surface}
                  type="button"
                  className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                  style={activeColor ? { borderColor: activeColor, backgroundColor: `${activeColor}22` } : undefined}
                  onMouseEnter={() => setHoverSurface(surface)}
                  onMouseLeave={() => setHoverSurface(null)}
                  onClick={() => toggleSurface(surface)}
                >
                  {surface} · {SURFACE_LABELS[surface]}
                </button>
              );
            })}
          </div>

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
