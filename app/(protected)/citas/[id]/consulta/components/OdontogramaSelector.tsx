"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Surface = "M" | "D" | "V" | "L" | "O" | "FULL";
type Dentition = "permanente" | "temporal";
type EstadoTratamiento = "bueno" | "malo";

export type OdontogramaEntry = {
  toothId: number;
  surface: Surface;
  treatmentId: string;
  treatmentName: string;
  category: string;
  color: string;
  icon: string;
  state?: EstadoTratamiento;
};

interface OdontogramaSelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
  detailValue?: OdontogramaEntry[];
  onDetailChange?: (value: OdontogramaEntry[]) => void;
}

const BAD_STATE_COLOR = "#dc2626";

const surfaces: { id: Exclude<Surface, "FULL">; label: string }[] = [
  { id: "M", label: "Mesial" },
  { id: "D", label: "Distal" },
  { id: "V", label: "Vestibular" },
  { id: "L", label: "Lingual/Palatino" },
  { id: "O", label: "Oclusal/Incisal" },
];

const permanentArches = [
  { title: "Arco superior", teeth: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28] },
  { title: "Arco inferior", teeth: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38] },
];

const temporaryArches = [
  { title: "Arco superior temporal", teeth: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65] },
  { title: "Arco inferior temporal", teeth: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75] },
];

const toothNames: Record<number, string> = Object.fromEntries([
  ...[11, 21, 31, 41, 51, 61, 71, 81].map((id) => [id, "Incisivo central"]),
  ...[12, 22, 32, 42, 52, 62, 72, 82].map((id) => [id, "Incisivo lateral"]),
  ...[13, 23, 33, 43, 53, 63, 73, 83].map((id) => [id, "Canino"]),
  ...[14, 24, 34, 44].map((id) => [id, "Primer premolar"]),
  ...[15, 25, 35, 45].map((id) => [id, "Segundo premolar"]),
  ...[16, 26, 36, 46, 54, 64, 74, 84].map((id) => [id, "Primer molar"]),
  ...[17, 27, 37, 47, 55, 65, 75, 85].map((id) => [id, "Segundo molar"]),
  ...[18, 28, 38, 48].map((id) => [id, "Tercer molar"]),
]);

// Formas anatómicas: corona + raíz(es) en tono marfil, similar al estilo de referencia
type ToothVisual = { crown: string; roots: string[] };

function getToothVisual(toothId: number): ToothVisual {
  const lastDigit = toothId % 10;
  if (lastDigit === 3) {
    return {
      crown: "M32 10 L50 2 L68 10 L65 84 L35 84 Z",
      roots: ["M35 84 L65 84 L58 106 L52 118 Q50 122 48 118 L42 106 Z"],
    };
  }
  if ([4, 5].includes(lastDigit) && toothId < 50) {
    return {
      crown: "M26 18 H74 L71 84 H29 Z",
      roots: ["M29 84 H71 L62 104 Q50 112 38 104 Z"],
    };
  }
  if (lastDigit >= 4) {
    return {
      crown: "M22 20 H78 V84 H22 Z",
      roots: [
        "M26 84 L22 108 Q21 114 26 115 L34 115 L36 84 Z",
        "M74 84 L78 108 Q79 114 74 115 L66 115 L64 84 Z",
      ],
    };
  }
  return {
    crown: "M30 14 Q50 4 70 14 L67 84 L33 84 Z",
    roots: ["M33 84 L67 84 L58 100 L54 110 Q50 116 46 110 L42 100 Z"],
  };
}

const surfaceCenters: Record<Exclude<Surface, "FULL">, { x: number; y: number }> = {
  V: { x: 50, y: 30 },
  L: { x: 50, y: 77 },
  M: { x: 27, y: 54 },
  D: { x: 73, y: 54 },
  O: { x: 50, y: 54 },
};

const CATEGORY_ICON: Record<string, string> = {
  "Diagnóstico": "triangle",
  "Restaurador": "square",
  "Endodoncia": "teardrop",
  "Periodoncia": "ring",
  "Cirugía oral": "diamond",
  "Implantología": "hexagon",
  "Ortodoncia": "cross",
  "Preventivo": "shield",
};

function CategoryMarker({ category, color, cx, cy, size = 13 }: { category: string; color: string; cx: number; cy: number; size?: number }) {
  const shape = CATEGORY_ICON[category] ?? "circle";
  const half = size / 2;
  const common = { fill: color, stroke: "white", strokeWidth: 1.5 };

  if (shape === "triangle") {
    return <polygon points={`${cx},${cy - half} ${cx + half},${cy + half * 0.8} ${cx - half},${cy + half * 0.8}`} {...common} strokeLinejoin="round" />;
  }
  if (shape === "square") {
    return <rect x={cx - half} y={cy - half} width={size} height={size} rx={2.5} {...common} />;
  }
  if (shape === "teardrop") {
    return (
      <path
        d={`M${cx} ${cy - half} C${cx + half} ${cy - half} ${cx + half} ${cy + half * 0.3} ${cx} ${cy + half} C${cx - half} ${cy + half * 0.3} ${cx - half} ${cy - half} ${cx} ${cy - half} Z`}
        {...common}
      />
    );
  }
  if (shape === "ring") {
    return (
      <>
        <circle cx={cx} cy={cy} r={half} fill="none" stroke={color} strokeWidth={3} />
        <circle cx={cx} cy={cy} r={2} fill={color} />
      </>
    );
  }
  if (shape === "diamond") {
    return <rect x={cx - half * 0.8} y={cy - half * 0.8} width={size * 0.8} height={size * 0.8} rx={1.5} transform={`rotate(45 ${cx} ${cy})`} {...common} />;
  }
  if (shape === "hexagon") {
    const pts = Array.from({ length: 6 })
      .map((_, i) => {
        const angle = (Math.PI / 180) * (60 * i - 30);
        return `${cx + half * Math.cos(angle)},${cy + half * Math.sin(angle)}`;
      })
      .join(" ");
    return <polygon points={pts} {...common} strokeLinejoin="round" />;
  }
  if (shape === "cross") {
    return (
      <>
        <rect x={cx - half} y={cy - 2.5} width={size} height={5} rx={1.5} {...common} />
        <rect x={cx - 2.5} y={cy - half} width={5} height={size} rx={1.5} fill={color} stroke="white" strokeWidth={1.5} />
      </>
    );
  }
  if (shape === "shield") {
    return (
      <path
        d={`M${cx} ${cy - half} L${cx + half} ${cy - half * 0.5} V${cy} C${cx + half} ${cy + half * 0.7} ${cx} ${cy + half} ${cx} ${cy + half} C${cx} ${cy + half} ${cx - half} ${cy + half * 0.7} ${cx - half} ${cy} V${cy - half * 0.5} Z`}
        {...common}
      />
    );
  }
  return <circle cx={cx} cy={cy} r={half} {...common} />;
}

const WHOLE_TOOTH_IDS = new Set([
  "fractura-radicular", "ausencia", "impactacion", "movilidad", "gingivitis", "periodontitis",
  "absceso", "necrosis", "maloclusion", "desgaste", "rct", "retratamiento", "pulpotomia",
  "pulpectomia", "apicectomia", "profilaxis", "raspado", "curetaje", "cirugia-periodontal",
  "injerto-gingival", "mantenimiento-periodontal", "extraccion-simple", "extraccion-quirurgica",
  "terceros-molares", "drenaje", "frenectomia", "implante", "injerto-oseo", "elevacion-seno",
  "corona-implante", "rehabilitacion-implantes", "brackets-metalicos", "brackets-esteticos",
  "alineadores", "retenedores", "expansion-maxilar", "fluorizacion", "higiene",
]);

const STATEABLE_IDS = new Set([
  "obturacion", "amalgama", "incrustacion", "corona", "carilla", "reconstruccion",
  "implante", "corona-implante", "rehabilitacion-implantes", "brackets-metalicos",
  "brackets-esteticos", "alineadores", "retenedores", "sellantes", "rct", "retratamiento",
]);

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
].map(([id, name, category, color, icon]) => ({
  id,
  name,
  category,
  color,
  icon,
  wholeTooth: WHOLE_TOOTH_IDS.has(id),
  hasStates: STATEABLE_IDS.has(id),
}));

function ToothSvg({
  toothId,
  entries,
  selected,
  onSurfaceClick,
  onWholeToothClick,
}: {
  toothId: number;
  entries: OdontogramaEntry[];
  selected: boolean;
  onSurfaceClick: (surface: Exclude<Surface, "FULL">) => void;
  onWholeToothClick: () => void;
}) {
  const surfaceEntries = entries.filter((entry) => entry.surface !== "FULL");
  const fullEntry = entries.find((entry) => entry.surface === "FULL");
  const bySurface = (surface: Exclude<Surface, "FULL">) => surfaceEntries.find((entry) => entry.surface === surface);
  const fill = (surface: Exclude<Surface, "FULL">) => bySurface(surface)?.color ?? "transparent";
  const visual = getToothVisual(toothId);
  const isAusente = fullEntry?.treatmentId === "ausencia";
  const isMovilidad = fullEntry?.treatmentId === "movilidad";

  return (
    <div
      className={`w-full rounded-md border bg-white p-0.5 shadow-sm transition cursor-pointer ${selected ? "ring-2 ring-primary" : "hover:border-primary/50"}`}
      onClick={onWholeToothClick}
      title={`${toothId} · ${toothNames[toothId]}`}
    >
      <svg viewBox="0 0 100 130" className="h-auto w-full">
        {isAusente ? (
          <>
            <path d={visual.crown} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3" />
            {visual.roots.map((r, i) => (
              <path key={i} d={r} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3" />
            ))}
          </>
        ) : (
          <>
            {visual.roots.map((r, i) => (
              <path key={i} d={r} fill="#eaddc0" stroke="#c9b58c" strokeWidth="1.5" onClick={(e) => e.stopPropagation()} />
            ))}
            <path d={visual.crown} fill="#faf3e3" stroke="#d9c9a3" strokeWidth="1.5" onClick={(e) => e.stopPropagation()} />
          </>
        )}

        {!isAusente && (
          <g onClick={(e) => e.stopPropagation()}>
            <path d="M24 22h52L61 42H39z" fill={fill("V")} fillOpacity="0.72" stroke="#334155" strokeOpacity="0.25" onClick={() => onSurfaceClick("V")} className="cursor-pointer" />
            <path d="M24 88h52L61 66H39z" fill={fill("L")} fillOpacity="0.72" stroke="#334155" strokeOpacity="0.25" onClick={() => onSurfaceClick("L")} className="cursor-pointer" />
            <path d="M24 22v66l16-22V42z" fill={fill("M")} fillOpacity="0.72" stroke="#334155" strokeOpacity="0.25" onClick={() => onSurfaceClick("M")} className="cursor-pointer" />
            <path d="M76 22v66L60 66V42z" fill={fill("D")} fillOpacity="0.72" stroke="#334155" strokeOpacity="0.25" onClick={() => onSurfaceClick("D")} className="cursor-pointer" />
            <rect x="39" y="42" width="22" height="24" rx="5" fill={fill("O")} fillOpacity="0.72" stroke="#334155" strokeOpacity="0.25" onClick={() => onSurfaceClick("O")} className="cursor-pointer" />
          </g>
        )}

        {surfaceEntries.map((entry) => {
          const center = surfaceCenters[entry.surface as Exclude<Surface, "FULL">];
          return (
            <g key={`${entry.toothId}-${entry.surface}-${entry.treatmentId}`} className="pointer-events-none">
              <CategoryMarker category={entry.category} color={entry.color} cx={center.x} cy={center.y} size={13} />
            </g>
          );
        })}

        {isAusente && (
          <g className="pointer-events-none">
            <line x1="30" y1="20" x2="70" y2="80" stroke="#6b7280" strokeWidth="4" strokeLinecap="round" />
            <line x1="70" y1="20" x2="30" y2="80" stroke="#6b7280" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {isMovilidad && (
          <g className="pointer-events-none" stroke={fullEntry?.color} strokeWidth="3" strokeLinecap="round" fill="none">
            <line x1="30" y1="54" x2="70" y2="54" />
            <path d="M36 47 L28 54 L36 61" />
            <path d="M64 47 L72 54 L64 61" />
          </g>
        )}

        {fullEntry && !isAusente && !isMovilidad && (
          <g className="pointer-events-none">
            <rect x="20" y="16" width="60" height="72" rx="10" fill="none" stroke={fullEntry.color} strokeWidth="2.5" strokeDasharray="6 4" opacity="0.65" />
            <CategoryMarker category={fullEntry.category} color={fullEntry.color} cx={78} cy={18} size={16} />
          </g>
        )}

        <text x="50" y="126" textAnchor="middle" className="fill-slate-800 text-[13px] font-bold pointer-events-none">{toothId}</text>
      </svg>
    </div>
  );
}

export function OdontogramaSelector({ value, onChange, detailValue = [], onDetailChange }: OdontogramaSelectorProps) {
  const [dentition, setDentition] = useState<Dentition>("permanente");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(value[0] ?? null);
  const [selectedSurface, setSelectedSurface] = useState<Exclude<Surface, "FULL">>("O");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState(treatments[0].id);
  const [selectedState, setSelectedState] = useState<EstadoTratamiento>("bueno");
  const [treatmentSearch, setTreatmentSearch] = useState("");
  const [treatmentPickerOpen, setTreatmentPickerOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const selectedTreatment = treatments.find((item) => item.id === selectedTreatmentId) ?? treatments[0];
  const arches = dentition === "permanente" ? permanentArches : temporaryArches;
  const half = dentition === "permanente" ? 8 : 5;

  const selectedEntries = useMemo(() => detailValue.filter((entry) => entry.toothId === selectedTooth), [detailValue, selectedTooth]);
  const filteredTreatments = useMemo(() => {
    const query = treatmentSearch.trim().toLowerCase();
    if (!query) return treatments;
    return treatments.filter((item) => `${item.category} ${item.name}`.toLowerCase().includes(query));
  }, [treatmentSearch]);

  const syncValue = (entries: OdontogramaEntry[]) => onChange(Array.from(new Set(entries.map((entry) => entry.toothId))).sort((a, b) => a - b));

  const entryColor = () => (selectedTreatment.hasStates && selectedState === "malo" ? BAD_STATE_COLOR : selectedTreatment.color);
  const entryName = () => (selectedTreatment.hasStates ? `${selectedTreatment.name} (${selectedState === "malo" ? "mal" : "buen"} estado)` : selectedTreatment.name);

  const applyTreatment = (toothId: number | null = selectedTooth, surface: Surface = selectedSurface) => {
    if (!toothId) return;
    const nextEntry: OdontogramaEntry = {
      toothId,
      surface,
      treatmentId: selectedTreatment.id,
      treatmentName: entryName(),
      category: selectedTreatment.category,
      color: entryColor(),
      icon: selectedTreatment.icon,
      state: selectedTreatment.hasStates ? selectedState : undefined,
    };
    const next = [...detailValue.filter((entry) => !(entry.toothId === toothId && entry.surface === surface)), nextEntry];
    onDetailChange?.(next);
    syncValue(next);
    setSelectedTooth(toothId);
  };

  const handleWholeToothClick = (toothId: number) => {
    setSelectedTooth(toothId);
    if (selectedTreatment.wholeTooth) {
      applyTreatment(toothId, "FULL");
    }
  };

  const handleSurfaceClick = (toothId: number, surface: Exclude<Surface, "FULL">) => {
    setSelectedTooth(toothId);
    setSelectedSurface(surface);
    if (!selectedTreatment.wholeTooth) {
      applyTreatment(toothId, surface);
    }
  };

  const removeEntry = (toothId: number, surface?: Surface) => {
    const next = detailValue.filter((entry) => entry.toothId !== toothId || (surface && entry.surface !== surface));
    onDetailChange?.(next);
    syncValue(next);
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 overflow-hidden rounded-xl border bg-slate-50/60 p-4">
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant={dentition === "permanente" ? "default" : "outline"} onClick={() => setDentition("permanente")}>Permanente FDI (32)</Button>
            <Button type="button" variant={dentition === "temporal" ? "default" : "outline"} onClick={() => setDentition("temporal")}>Temporal FDI (20)</Button>
            <Badge variant="secondary">Capas por superficie M-D-V-L-O</Badge>
            <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BAD_STATE_COLOR }} /> Mal estado</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Buen estado</span>
            </span>
          </div>

          <div className="min-w-0 space-y-3 rounded-lg border bg-white p-3">
            {arches.map((arch) => (
              <div key={arch.title} className="min-w-0">
                <h4 className="mb-2 text-sm font-semibold">{arch.title}</h4>
                <div className="grid min-w-0 gap-0.5" style={{ gridTemplateColumns: `repeat(${arch.teeth.length}, minmax(0, 1fr))` }}>
                  {arch.teeth.map((toothId, index) => (
                    <div key={toothId} className={index === half ? "border-l-2 border-slate-300 pl-0.5" : ""}>
                      <ToothSvg
                        toothId={toothId}
                        selected={selectedTooth === toothId}
                        entries={detailValue.filter((entry) => entry.toothId === toothId)}
                        onSurfaceClick={(surface) => handleSurfaceClick(toothId, surface)}
                        onWholeToothClick={() => handleWholeToothClick(toothId)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="min-w-0 space-y-3 rounded-lg border bg-white p-3">
          <div>
            <p className="text-sm font-semibold">Tratamiento / diagnóstico</p>
            <Popover open={treatmentPickerOpen} onOpenChange={(open) => { setTreatmentPickerOpen(open); if (!open) setTreatmentSearch(""); }}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-start gap-2 font-normal">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: selectedTreatment.color }} />
                  <span className="truncate">{selectedTreatment.category} · {selectedTreatment.name}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <div className="p-2">
                  <Input
                    autoFocus
                    placeholder="Buscar tratamiento..."
                    value={treatmentSearch}
                    onChange={(event) => setTreatmentSearch(event.target.value)}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto border-t">
                  {filteredTreatments.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100 ${item.id === selectedTreatmentId ? "bg-slate-100 font-medium" : ""}`}
                      onClick={() => {
                        setSelectedTreatmentId(item.id);
                        setTreatmentPickerOpen(false);
                        setTreatmentSearch("");
                      }}
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.category} · {item.name}</span>
                    </button>
                  ))}
                  {!filteredTreatments.length ? <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div> : null}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {selectedTreatment.hasStates && (
            <div>
              <p className="text-sm font-semibold">Estado</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button type="button" size="sm" variant={selectedState === "bueno" ? "default" : "outline"} onClick={() => setSelectedState("bueno")}>Buen estado</Button>
                <Button type="button" size="sm" variant={selectedState === "malo" ? "default" : "outline"} className={selectedState === "malo" ? "bg-red-600 hover:bg-red-700" : ""} onClick={() => setSelectedState("malo")}>Mal estado</Button>
              </div>
            </div>
          )}

          {selectedTreatment.wholeTooth ? (
            <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
              Este diagnóstico se aplica a toda la pieza. Haz clic en cualquier parte del diente (fuera de las 5 caras) para aplicarlo.
            </p>
          ) : (
            <div>
              <p className="text-sm font-semibold">Superficie activa</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {surfaces.map((surface) => <Button key={surface.id} type="button" size="sm" variant={selectedSurface === surface.id ? "default" : "outline"} onClick={() => setSelectedSurface(surface.id)}>{surface.id} · {surface.label}</Button>)}
              </div>
            </div>
          )}

          <Button type="button" className="w-full" disabled={!selectedTooth} onClick={() => applyTreatment(selectedTooth, selectedTreatment.wholeTooth ? "FULL" : selectedSurface)}>
            {selectedTreatment.wholeTooth ? `Aplicar a toda la pieza ${selectedTooth ?? "—"}` : `Aplicar a superficie ${selectedSurface} en pieza ${selectedTooth ?? "—"}`}
          </Button>

          <div className="rounded-md border p-2 text-sm">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24"><CategoryMarker category={selectedTreatment.category} color={entryColor()} cx={12} cy={12} size={18} /></svg>
              <span>{entryName()}</span>
            </div>
          </div>

          <button type="button" className="text-xs text-primary underline" onClick={() => setShowLegend((v) => !v)}>
            {showLegend ? "Ocultar" : "Ver"} leyenda de símbolos
          </button>
          {showLegend && (
            <div className="grid grid-cols-2 gap-1.5 rounded-md border bg-slate-50 p-2 text-[10px] text-muted-foreground">
              {Object.keys(CATEGORY_ICON).map((cat) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14"><CategoryMarker category={cat} color="#475569" cx={7} cy={7} size={11} /></svg>
                  <span>{cat}</span>
                </div>
              ))}
            </div>
          )}

          {selectedTooth ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Capas en pieza {selectedTooth}</p>
              {selectedEntries.length ? selectedEntries.map((entry) => (
                <div key={`${entry.toothId}-${entry.surface}-${entry.treatmentId}`} className="flex items-center justify-between rounded border p-2 text-xs">
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 14 14"><CategoryMarker category={entry.category} color={entry.color} cx={7} cy={7} size={11} /></svg>
                    <b>{entry.surface === "FULL" ? "Toda la pieza" : entry.surface}</b> {entry.treatmentName}
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry(entry.toothId, entry.surface)}>Quitar</Button>
                </div>
              )) : <p className="text-xs text-muted-foreground">Sin capas.</p>}
              <Button type="button" variant="outline" size="sm" onClick={() => removeEntry(selectedTooth)}>Limpiar pieza</Button>
            </div>
          ) : null}
        </aside>
      </div>
      <p className="text-xs text-muted-foreground">Piezas con capas: {value.length > 0 ? value.join(", ") : "ninguna"}. Registros clínicos: {detailValue.length}.</p>
    </div>
  );
}