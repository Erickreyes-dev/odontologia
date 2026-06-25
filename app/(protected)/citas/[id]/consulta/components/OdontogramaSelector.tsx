"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Surface = "M" | "D" | "V" | "L" | "O";
type Dentition = "permanente" | "temporal";

export type OdontogramaEntry = {
  toothId: number;
  surface: Surface;
  treatmentId: string;
  treatmentName: string;
  category: string;
  color: string;
  icon: string;
};

interface OdontogramaSelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
  detailValue?: OdontogramaEntry[];
  onDetailChange?: (value: OdontogramaEntry[]) => void;
}

const surfaces: { id: Surface; label: string }[] = [
  { id: "M", label: "Mesial" },
  { id: "D", label: "Distal" },
  { id: "V", label: "Vestibular" },
  { id: "L", label: "Lingual/Palatino" },
  { id: "O", label: "Oclusal/Incisal" },
];

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

const toothNames: Record<number, string> = Object.fromEntries([
  ...[11,21,31,41,51,61,71,81].map((id) => [id, "Incisivo central"]),
  ...[12,22,32,42,52,62,72,82].map((id) => [id, "Incisivo lateral"]),
  ...[13,23,33,43,53,63,73,83].map((id) => [id, "Canino"]),
  ...[14,24,34,44].map((id) => [id, "Primer premolar"]),
  ...[15,25,35,45].map((id) => [id, "Segundo premolar"]),
  ...[16,26,36,46,54,64,74,84].map((id) => [id, "Primer molar"]),
  ...[17,27,37,47,55,65,75,85].map((id) => [id, "Segundo molar"]),
  ...[18,28,38,48].map((id) => [id, "Tercer molar"]),
]);

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

const treatments = [
  ["caries", "Caries dental", "Diagnóstico", "#dc2626", "/images/svg/odontograma/caries.svg"],
  ["caries-profunda", "Caries profunda", "Diagnóstico", "#b91c1c", "/images/svg/odontograma/caries.svg"],
  ["fractura-coronaria", "Fractura coronaria", "Diagnóstico", "#ef4444", "/images/svg/odontograma/caries.svg"],
  ["fractura-radicular", "Fractura radicular", "Diagnóstico", "#991b1b", "/images/svg/odontograma/caries.svg"],
  ["ausencia", "Ausencia dentaria", "Diagnóstico", "#6b7280", "/images/svg/odontograma/ausencia.svg"],
  ["impactacion", "Impactación", "Diagnóstico", "#7f1d1d", "/images/svg/odontograma/cirugia.svg"],
  ["movilidad", "Movilidad dental", "Diagnóstico", "#f43f5e", "/images/svg/odontograma/periodoncia.svg"],
  ["gingivitis", "Gingivitis", "Diagnóstico", "#22c55e", "/images/svg/odontograma/periodoncia.svg"],
  ["periodontitis", "Periodontitis", "Diagnóstico", "#15803d", "/images/svg/odontograma/periodoncia.svg"],
  ["absceso", "Absceso dental", "Diagnóstico", "#be123c", "/images/svg/odontograma/cirugia.svg"],
  ["necrosis", "Necrosis pulpar", "Diagnóstico", "#0f172a", "/images/svg/odontograma/endodoncia.svg"],
  ["maloclusion", "Maloclusión", "Diagnóstico", "#7c3aed", "/images/svg/odontograma/ortodoncia.svg"],
  ["desgaste", "Desgaste dental (bruxismo)", "Diagnóstico", "#f97316", "/images/svg/odontograma/preventivo.svg"],
  ["obturacion", "Obturación (resina / composite)", "Restaurador", "#2563eb", "/images/svg/odontograma/restauracion.svg"],
  ["amalgama", "Amalgama", "Restaurador", "#64748b", "/images/svg/odontograma/restauracion.svg"],
  ["incrustacion", "Incrustación (inlay / onlay)", "Restaurador", "#1d4ed8", "/images/svg/odontograma/restauracion.svg"],
  ["corona", "Corona dental", "Restaurador", "#0ea5e9", "/images/svg/odontograma/restauracion.svg"],
  ["carilla", "Carilla (veneer)", "Restaurador", "#38bdf8", "/images/svg/odontograma/restauracion.svg"],
  ["reconstruccion", "Reconstrucción dental", "Restaurador", "#0284c7", "/images/svg/odontograma/restauracion.svg"],
  ["rct", "Tratamiento de conducto (RCT)", "Endodoncia", "#0284c7", "/images/svg/odontograma/endodoncia.svg"],
  ["retratamiento", "Retratamiento endodóntico", "Endodoncia", "#0369a1", "/images/svg/odontograma/endodoncia.svg"],
  ["pulpotomia", "Pulpotomía", "Endodoncia", "#0e7490", "/images/svg/odontograma/endodoncia.svg"],
  ["pulpectomia", "Pulpectomía", "Endodoncia", "#0891b2", "/images/svg/odontograma/endodoncia.svg"],
  ["apicectomia", "Apicectomía", "Endodoncia", "#155e75", "/images/svg/odontograma/endodoncia.svg"],
  ["profilaxis", "Limpieza dental (profilaxis)", "Periodoncia", "#16a34a", "/images/svg/odontograma/periodoncia.svg"],
  ["raspado", "Raspado y alisado radicular", "Periodoncia", "#15803d", "/images/svg/odontograma/periodoncia.svg"],
  ["curetaje", "Curetaje subgingival", "Periodoncia", "#166534", "/images/svg/odontograma/periodoncia.svg"],
  ["cirugia-periodontal", "Cirugía periodontal", "Periodoncia", "#14532d", "/images/svg/odontograma/periodoncia.svg"],
  ["injerto-gingival", "Injerto gingival", "Periodoncia", "#22c55e", "/images/svg/odontograma/periodoncia.svg"],
  ["mantenimiento-periodontal", "Mantenimiento periodontal", "Periodoncia", "#4ade80", "/images/svg/odontograma/periodoncia.svg"],
  ["extraccion-simple", "Extracción simple", "Cirugía oral", "#111827", "/images/svg/odontograma/cirugia.svg"],
  ["extraccion-quirurgica", "Extracción quirúrgica", "Cirugía oral", "#374151", "/images/svg/odontograma/cirugia.svg"],
  ["terceros-molares", "Extracción de terceros molares", "Cirugía oral", "#4b5563", "/images/svg/odontograma/cirugia.svg"],
  ["drenaje", "Drenaje de absceso", "Cirugía oral", "#6b7280", "/images/svg/odontograma/cirugia.svg"],
  ["frenectomia", "Frenectomía", "Cirugía oral", "#1f2937", "/images/svg/odontograma/cirugia.svg"],
  ["implante", "Implante dental", "Implantología", "#4f46e5", "/images/svg/odontograma/implante.svg"],
  ["injerto-oseo", "Injerto óseo", "Implantología", "#6366f1", "/images/svg/odontograma/implante.svg"],
  ["elevacion-seno", "Elevación de seno maxilar", "Implantología", "#818cf8", "/images/svg/odontograma/implante.svg"],
  ["corona-implante", "Corona sobre implante", "Implantología", "#4338ca", "/images/svg/odontograma/implante.svg"],
  ["rehabilitacion-implantes", "Rehabilitación sobre implantes", "Implantología", "#3730a3", "/images/svg/odontograma/implante.svg"],
  ["brackets-metalicos", "Brackets metálicos", "Ortodoncia", "#7c3aed", "/images/svg/odontograma/ortodoncia.svg"],
  ["brackets-esteticos", "Brackets estéticos", "Ortodoncia", "#8b5cf6", "/images/svg/odontograma/ortodoncia.svg"],
  ["alineadores", "Alineadores", "Ortodoncia", "#a78bfa", "/images/svg/odontograma/ortodoncia.svg"],
  ["retenedores", "Retenedores", "Ortodoncia", "#6d28d9", "/images/svg/odontograma/ortodoncia.svg"],
  ["expansion-maxilar", "Expansión maxilar", "Ortodoncia", "#5b21b6", "/images/svg/odontograma/ortodoncia.svg"],
  ["sellantes", "Sellantes de fosas y fisuras", "Preventivo", "#f97316", "/images/svg/odontograma/preventivo.svg"],
  ["fluorizacion", "Fluorización", "Preventivo", "#fb923c", "/images/svg/odontograma/preventivo.svg"],
  ["higiene", "Educación en higiene oral", "Preventivo", "#ea580c", "/images/svg/odontograma/preventivo.svg"],
].map(([id, name, category, color, icon]) => ({ id, name, category, color, icon }));

function ToothSvg({ toothId, entries, selected, onSurfaceClick }: { toothId: number; entries: OdontogramaEntry[]; selected: boolean; onSurfaceClick: (surface: Surface) => void }) {
  const bySurface = (surface: Surface) => entries.find((entry) => entry.surface === surface);
  const fill = (surface: Surface) => bySurface(surface)?.color ?? "transparent";
  return (
    <div className={`rounded-xl border bg-white p-2 shadow-sm transition ${selected ? "ring-2 ring-primary" : "hover:border-primary/50"}`}>
      <svg viewBox="0 0 100 120" className="h-24 w-20">
        <image href={getToothSvg(toothId)} x="0" y="0" width="100" height="120" preserveAspectRatio="xMidYMid meet" />
        <path d="M24 22h52L61 42H39z" fill={fill("V")} fillOpacity="0.72" stroke="#334155" strokeOpacity="0.25" onClick={() => onSurfaceClick("V")} className="cursor-pointer" />
        <path d="M24 88h52L61 66H39z" fill={fill("L")} fillOpacity="0.72" stroke="#334155" strokeOpacity="0.25" onClick={() => onSurfaceClick("L")} className="cursor-pointer" />
        <path d="M24 22v66l16-22V42z" fill={fill("M")} fillOpacity="0.72" stroke="#334155" strokeOpacity="0.25" onClick={() => onSurfaceClick("M")} className="cursor-pointer" />
        <path d="M76 22v66L60 66V42z" fill={fill("D")} fillOpacity="0.72" stroke="#334155" strokeOpacity="0.25" onClick={() => onSurfaceClick("D")} className="cursor-pointer" />
        <rect x="39" y="42" width="22" height="24" rx="5" fill={fill("O")} fillOpacity="0.72" stroke="#334155" strokeOpacity="0.25" onClick={() => onSurfaceClick("O")} className="cursor-pointer" />
        {entries.map((entry) => {
          const center = surfaceCenters[entry.surface];
          return <image key={`${entry.toothId}-${entry.surface}-${entry.treatmentId}`} href={entry.icon} x={center.x - 7} y={center.y - 7} width="14" height="14" className="pointer-events-none" />;
        })}
        <text x="50" y="116" textAnchor="middle" className="fill-slate-800 text-[13px] font-bold pointer-events-none">{toothId}</text>
      </svg>
      <div className="mt-1 text-center text-[11px] text-muted-foreground">{toothNames[toothId]}</div>
    </div>
  );
}

export function OdontogramaSelector({ value, onChange, detailValue = [], onDetailChange }: OdontogramaSelectorProps) {
  const [dentition, setDentition] = useState<Dentition>("permanente");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(value[0] ?? null);
  const [selectedSurface, setSelectedSurface] = useState<Surface>("O");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState(treatments[0].id);
  const selectedTreatment = treatments.find((item) => item.id === selectedTreatmentId) ?? treatments[0];
  const quadrants = dentition === "permanente" ? permanentQuadrants : temporaryQuadrants;
  const selectedEntries = useMemo(() => detailValue.filter((entry) => entry.toothId === selectedTooth), [detailValue, selectedTooth]);

  const syncValue = (entries: OdontogramaEntry[]) => onChange(Array.from(new Set(entries.map((entry) => entry.toothId))).sort((a, b) => a - b));

  const applyTreatment = (toothId = selectedTooth, surface = selectedSurface) => {
    if (!toothId) return;
    const nextEntry: OdontogramaEntry = { toothId, surface, treatmentId: selectedTreatment.id, treatmentName: selectedTreatment.name, category: selectedTreatment.category, color: selectedTreatment.color, icon: selectedTreatment.icon };
    const next = [...detailValue.filter((entry) => !(entry.toothId === toothId && entry.surface === surface)), nextEntry];
    onDetailChange?.(next);
    syncValue(next);
    setSelectedTooth(toothId);
    setSelectedSurface(surface);
  };

  const removeEntry = (toothId: number, surface?: Surface) => {
    const next = detailValue.filter((entry) => entry.toothId !== toothId || (surface && entry.surface !== surface));
    onDetailChange?.(next);
    syncValue(next);
  };

  return (
    <div className="space-y-4 rounded-xl border bg-slate-50/60 p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant={dentition === "permanente" ? "default" : "outline"} onClick={() => setDentition("permanente")}>Permanente FDI (32)</Button>
            <Button type="button" variant={dentition === "temporal" ? "default" : "outline"} onClick={() => setDentition("temporal")}>Temporal FDI (20)</Button>
            <Badge variant="secondary">Capas por superficie M-D-V-L-O</Badge>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {quadrants.map((quadrant) => (
              <section key={quadrant.title} className="rounded-lg border bg-white p-3">
                <h4 className="mb-2 text-sm font-semibold">{quadrant.title}</h4>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {quadrant.teeth.map((toothId) => (
                    <ToothSvg key={toothId} toothId={toothId} selected={selectedTooth === toothId} entries={detailValue.filter((entry) => entry.toothId === toothId)} onSurfaceClick={(surface) => { setSelectedTooth(toothId); setSelectedSurface(surface); applyTreatment(toothId, surface); }} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
        <aside className="space-y-3 rounded-lg border bg-white p-3">
          <div>
            <p className="text-sm font-semibold">Tratamiento / diagnóstico</p>
            <Select value={selectedTreatmentId} onValueChange={setSelectedTreatmentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-80">
                {treatments.map((item) => <SelectItem key={item.id} value={item.id}>{item.category} · {item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm font-semibold">Superficie activa</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {surfaces.map((surface) => <Button key={surface.id} type="button" size="sm" variant={selectedSurface === surface.id ? "default" : "outline"} onClick={() => setSelectedSurface(surface.id)}>{surface.id} · {surface.label}</Button>)}
            </div>
          </div>
          <Button type="button" className="w-full" disabled={!selectedTooth} onClick={() => applyTreatment()}>Aplicar a pieza {selectedTooth ?? "—"}</Button>
          <div className="rounded-md border p-2 text-sm">
            <div className="flex items-center gap-2"><Image src={selectedTreatment.icon} alt="" width={28} height={28} /><span>{selectedTreatment.name}</span></div>
            <p className="mt-1 text-xs text-muted-foreground">SVG usado desde public/images/svg/odontograma.</p>
          </div>
          {selectedTooth ? <div className="space-y-2"><p className="text-sm font-semibold">Capas en pieza {selectedTooth}</p>{selectedEntries.length ? selectedEntries.map((entry) => <div key={`${entry.toothId}-${entry.surface}`} className="flex items-center justify-between rounded border p-2 text-xs"><span><b>{entry.surface}</b> {entry.treatmentName}</span><Button type="button" variant="ghost" size="sm" onClick={() => removeEntry(entry.toothId, entry.surface)}>Quitar</Button></div>) : <p className="text-xs text-muted-foreground">Sin capas.</p>}<Button type="button" variant="outline" size="sm" onClick={() => removeEntry(selectedTooth)}>Limpiar pieza</Button></div> : null}
        </aside>
      </div>
      <p className="text-xs text-muted-foreground">Piezas con capas: {value.length > 0 ? value.join(", ") : "ninguna"}. Registros clínicos: {detailValue.length}.</p>
    </div>
  );
}
