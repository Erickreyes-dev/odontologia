"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Surface = "M" | "D" | "V" | "L" | "O" | "FULL";
type EstadoTratamiento = "bueno" | "malo";

type OdontogramaEntry = {
  toothId: number;
  surface: Surface;
  state?: EstadoTratamiento;
  treatmentId: string;
  treatmentName: string;
  category: string;
  color: string;
  icon: string;
};

interface PacienteOdontogramaResumenProps {
  treatedTeeth: number[];
  odontogramaDetalle?: OdontogramaEntry[];
  totalConsultasConOdontograma: number;
}

/* =========================
   SUPERFICIES CENTRO
========================= */
const surfaceCenters: Record<Exclude<Surface, "FULL">, { x: number; y: number }> = {
  V: { x: 50, y: 28 },
  L: { x: 50, y: 78 },
  M: { x: 28, y: 54 },
  D: { x: 72, y: 54 },
  O: { x: 50, y: 54 },
};

/* =========================
   FORMA DEL DIENTE (MEJORADA)
========================= */
function getToothShape(toothId: number) {
  const lastDigit = toothId % 10;

  if (lastDigit === 3) {
    return {
      crown: "M35 18 Q50 4 65 18 L62 82 Q50 108 38 82 Z",
      root: "M42 78 Q50 112 58 78",
    };
  }

  if ([4, 5].includes(lastDigit) && toothId < 50) {
    return {
      crown: "M28 20 H72 L66 86 H34 Z",
      root: "M40 82 Q50 108 60 82",
    };
  }

  return {
    crown: "M30 16 H70 L62 86 H38 Z",
    root: "M40 82 Q46 108 50 100 Q54 108 60 82",
  };
}

/* =========================
   TOOTH SVG
========================= */
function ToothSummary({
  toothId,
  entries,
  selected,
  onClick,
}: {
  toothId: number;
  entries: OdontogramaEntry[];
  selected: boolean;
  onClick: () => void;
}) {
  const surfaceEntries = entries.filter((e): e is OdontogramaEntry & { surface: Exclude<Surface, "FULL"> } => e.surface !== "FULL");
  const fullEntry = entries.find((e) => e.surface === "FULL");
  const bySurface = (s: Exclude<Surface, "FULL">) =>
    surfaceEntries.find((e) => e.surface === s);

  const fill = (s: Exclude<Surface, "FULL">) =>
    bySurface(s)?.color ?? "transparent";

  const shape = getToothShape(toothId);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border bg-white p-2 shadow-sm transition hover:shadow-md ${
        selected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <svg viewBox="0 0 100 120" className="h-24 w-20">

        {/* sombra base */}
        <ellipse cx="50" cy="112" rx="20" ry="6" fill="#000" opacity="0.10" />

        {/* corona */}
        <path
          d={shape.crown}
          fill="#ffffff"
          stroke="#475569"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* brillo interno */}
        <path
          d={shape.crown}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="0.8"
          opacity="0.6"
        />

        {/* raíz */}
        <path
          d={shape.root}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* vestibular */}
        <path d="M24 22h52L61 42H39z" fill={fill("V")} opacity="0.78" />

        {/* lingual */}
        <path d="M24 88h52L61 66H39z" fill={fill("L")} opacity="0.78" />

        {/* mesial */}
        <path d="M24 22v66l16-22V42z" fill={fill("M")} opacity="0.78" />

        {/* distal */}
        <path d="M76 22v66L60 66V42z" fill={fill("D")} opacity="0.78" />

        {/* oclusal */}
        <rect
          x="39"
          y="42"
          width="22"
          height="24"
          rx="6"
          fill={fill("O")}
          opacity="0.82"
        />

        {/* borde oclusal interno */}
        <rect
          x="41"
          y="44"
          width="18"
          height="20"
          rx="5"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="0.8"
          opacity="0.4"
        />

        {/* indicadores clínicos */}
        {surfaceEntries.map((entry) => {
          const c = surfaceCenters[entry.surface];
          return (
            <g key={`${entry.toothId}-${entry.surface}-${entry.treatmentId}`}>
              <circle
                cx={c.x}
                cy={c.y}
                r="6"
                fill={entry.color}
                stroke="white"
                strokeWidth="2"
              />
              <circle
                cx={c.x - 1}
                cy={c.y - 1}
                r="2"
                fill="white"
                opacity="0.5"
              />
            </g>
          );
        })}

        {fullEntry && (
          <g>
            <rect x="18" y="16" width="64" height="76" rx="12" fill="none" stroke={fullEntry.color} strokeWidth="3" strokeDasharray="6 4" opacity="0.7" />
            <circle cx="78" cy="18" r="7" fill={fullEntry.color} stroke="white" strokeWidth="2" />
          </g>
        )}

        {/* número */}
        <text
          x="50"
          y="116"
          textAnchor="middle"
          fontSize="12"
          fontWeight="800"
          fill="#0f172a"
        >
          {toothId}
        </text>
      </svg>
    </button>
  );
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */
export function PacienteOdontogramaResumen({
  treatedTeeth,
  odontogramaDetalle = [],
  totalConsultasConOdontograma,
}: PacienteOdontogramaResumenProps) {
  const [showTemporary, setShowTemporary] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(
    treatedTeeth[0] ?? odontogramaDetalle[0]?.toothId ?? null
  );

  const permanentQuadrants = [
    { title: "Superior derecho", teeth: [18, 17, 16, 15, 14, 13, 12, 11] },
    { title: "Superior izquierdo", teeth: [21, 22, 23, 24, 25, 26, 27, 28] },
    { title: "Inferior izquierdo", teeth: [38, 37, 36, 35, 34, 33, 32, 31] },
    { title: "Inferior derecho", teeth: [41, 42, 43, 44, 45, 46, 47, 48] },
  ];

  const temporaryQuadrants = [
    { title: "Temporal sup. derecho", teeth: [55, 54, 53, 52, 51] },
    { title: "Temporal sup. izquierdo", teeth: [61, 62, 63, 64, 65] },
    { title: "Temporal inf. izquierdo", teeth: [75, 74, 73, 72, 71] },
    { title: "Temporal inf. derecho", teeth: [81, 82, 83, 84, 85] },
  ];

  const quadrants = showTemporary
    ? temporaryQuadrants
    : permanentQuadrants;

  const selectedEntries = useMemo(
    () =>
      odontogramaDetalle.filter(
        (e) => e.toothId === selectedTooth
      ),
    [odontogramaDetalle, selectedTooth]
  );

  return (
    <div className="space-y-4 rounded-xl border bg-slate-50/70 p-4">

      {/* header */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={!showTemporary ? "default" : "outline"}
          onClick={() => setShowTemporary(false)}
        >
          Permanente
        </Button>

        <Button
          size="sm"
          variant={showTemporary ? "default" : "outline"}
          onClick={() => setShowTemporary(true)}
        >
          Temporal
        </Button>

        <Badge variant="secondary">
          {odontogramaDetalle.length} registros
        </Badge>
      </div>

      {/* grid */}
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">

        <div className="grid gap-4 xl:grid-cols-2">
          {quadrants.map((q) => (
            <section
              key={q.title}
              className="rounded-lg border bg-white p-3"
            >
              <h4 className="mb-2 text-sm font-semibold">
                {q.title}
              </h4>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {q.teeth.map((id) => (
                  <ToothSummary
                    key={id}
                    toothId={id}
                    selected={selectedTooth === id}
                    entries={odontogramaDetalle.filter(
                      (e) => e.toothId === id
                    )}
                    onClick={() => setSelectedTooth(id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* panel */}
        <aside className="space-y-3 rounded-lg border bg-white p-3">
          <p className="text-sm font-semibold">
            Detalle pieza {selectedTooth ?? "—"}
          </p>

          {selectedEntries.length ? (
            selectedEntries.map((e) => (
              <div
                key={`${e.toothId}-${e.surface}-${e.treatmentId}`}
                className="rounded-md border p-2 text-xs"
              >
                <p className="font-medium">
                  {e.surface === "FULL" ? "Toda la pieza" : e.surface} · {e.treatmentName}
                </p>
                <p className="text-muted-foreground">
                  {e.category}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              Selecciona una pieza.
            </p>
          )}
        </aside>
      </div>

      {/* footer */}
      <p className="text-sm text-muted-foreground">
        {totalConsultasConOdontograma > 0
          ? `Piezas tratadas: ${treatedTeeth.join(", ")}`
          : "Sin registros odontológicos"}
      </p>
    </div>
  );
}