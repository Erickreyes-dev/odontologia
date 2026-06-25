"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Surface = "M" | "D" | "V" | "L" | "O";

type OdontogramaEntry = {
  toothId: number;
  surface: Surface;
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

const getToothSvg = (toothId: number) => {
  const lastDigit = toothId % 10;
  if (lastDigit === 3) return "/images/svg/odontograma/piezas/canino.svg";
  if ([4, 5].includes(lastDigit) && toothId < 50) return "/images/svg/odontograma/piezas/premolar.svg";
  if (lastDigit >= 4) return "/images/svg/odontograma/piezas/molar.svg";
  return "/images/svg/odontograma/piezas/incisivo.svg";
};

const surfaceCenters: Record<Surface, { x: number; y: number }> = {
  V: { x: 50, y: 30 },
  L: { x: 50, y: 77 },
  M: { x: 27, y: 54 },
  D: { x: 73, y: 54 },
  O: { x: 50, y: 54 },
};

function ToothSummary({ toothId, entries, selected, onClick }: { toothId: number; entries: OdontogramaEntry[]; selected: boolean; onClick: () => void }) {
  const bySurface = (surface: Surface) => entries.find((entry) => entry.surface === surface);
  const fill = (surface: Surface) => bySurface(surface)?.color ?? "transparent";
  return (
    <button type="button" onClick={onClick} className={`rounded-xl border bg-white p-2 text-left shadow-sm transition ${selected ? "ring-2 ring-primary" : "hover:border-primary/50"}`}>
      <svg viewBox="0 0 100 120" className="h-24 w-20">
        <image href={getToothSvg(toothId)} x="0" y="0" width="100" height="120" preserveAspectRatio="xMidYMid meet" />
        <path d="M24 22h52L61 42H39z" fill={fill("V")} fillOpacity="0.72" />
        <path d="M24 88h52L61 66H39z" fill={fill("L")} fillOpacity="0.72" />
        <path d="M24 22v66l16-22V42z" fill={fill("M")} fillOpacity="0.72" />
        <path d="M76 22v66L60 66V42z" fill={fill("D")} fillOpacity="0.72" />
        <rect x="39" y="42" width="22" height="24" rx="5" fill={fill("O")} fillOpacity="0.72" />
        {entries.map((entry) => {
          const center = surfaceCenters[entry.surface];
          return <image key={`${entry.toothId}-${entry.surface}-${entry.treatmentId}`} href={entry.icon} x={center.x - 7} y={center.y - 7} width="14" height="14" />;
        })}
        <text x="50" y="116" textAnchor="middle" className="fill-slate-800 text-[13px] font-bold">{toothId}</text>
      </svg>
    </button>
  );
}

export function PacienteOdontogramaResumen({ treatedTeeth, odontogramaDetalle = [], totalConsultasConOdontograma }: PacienteOdontogramaResumenProps) {
  const [showTemporary, setShowTemporary] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(treatedTeeth[0] ?? odontogramaDetalle[0]?.toothId ?? null);
  const quadrants = showTemporary ? temporaryQuadrants : permanentQuadrants;
  const selectedEntries = useMemo(() => odontogramaDetalle.filter((entry) => entry.toothId === selectedTooth), [odontogramaDetalle, selectedTooth]);

  return (
    <div className="space-y-4 rounded-xl border bg-slate-50/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant={!showTemporary ? "default" : "outline"} onClick={() => setShowTemporary(false)}>Permanente</Button>
        <Button type="button" size="sm" variant={showTemporary ? "default" : "outline"} onClick={() => setShowTemporary(true)}>Temporal</Button>
        <Badge variant="secondary">{odontogramaDetalle.length} capas clínicas</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="grid gap-4 xl:grid-cols-2">
          {quadrants.map((quadrant) => (
            <section key={quadrant.title} className="rounded-lg border bg-white p-3">
              <h4 className="mb-2 text-sm font-semibold">{quadrant.title}</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quadrant.teeth.map((toothId) => (
                  <ToothSummary key={toothId} toothId={toothId} selected={selectedTooth === toothId} entries={odontogramaDetalle.filter((entry) => entry.toothId === toothId)} onClick={() => setSelectedTooth(toothId)} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-3 rounded-lg border bg-white p-3">
          <p className="text-sm font-semibold">Tratamientos en pieza {selectedTooth ?? "—"}</p>
          {selectedEntries.length ? selectedEntries.map((entry) => (
            <div key={`${entry.toothId}-${entry.surface}-${entry.treatmentId}`} className="flex items-center gap-2 rounded-md border p-2 text-xs">
              <Image src={entry.icon} alt="" width={24} height={24} />
              <div>
                <p className="font-medium">{entry.surface} · {entry.treatmentName}</p>
                <p className="text-muted-foreground">{entry.category}</p>
              </div>
            </div>
          )) : <p className="text-xs text-muted-foreground">Seleccione una pieza con color para ver sus capas.</p>}
        </aside>
      </div>

      <p className="text-sm text-muted-foreground">
        {totalConsultasConOdontograma > 0
          ? `Piezas tratadas en ${totalConsultasConOdontograma} consulta(s): ${treatedTeeth.join(", ") || "ninguna"}.`
          : "Este paciente todavía no tiene consultas con odontograma registrado."}
      </p>
    </div>
  );
}
