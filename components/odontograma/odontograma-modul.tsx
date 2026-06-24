"use client";

import Image from "next/image";
import { type MouseEvent, useMemo, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
] as const;

const TEMPLATES: Record<11 | 13 | 14 | 16, string> = {
  11: "/odontograma-svg/11.svg",
  13: "/odontograma-svg/13.svg",
  14: "/odontograma-svg/14.svg",
  16: "/odontograma-svg/16.svg",
};

const TEMPLATES_OCCL: Partial<Record<14 | 16, string>> = {
  14: "/odontograma-svg/14_occl.svg",
  16: "/odontograma-svg/16_occl.svg",
};

const TOOTH_TEMPLATE = new Map<number, { tpl: 11 | 13 | 14 | 16; rot: 0 | 180; mirror: boolean }>([
  [11, { tpl: 11, rot: 0, mirror: false }], [12, { tpl: 11, rot: 0, mirror: false }],
  [21, { tpl: 11, rot: 0, mirror: true }], [22, { tpl: 11, rot: 0, mirror: true }],
  [31, { tpl: 11, rot: 180, mirror: false }], [32, { tpl: 11, rot: 180, mirror: false }],
  [41, { tpl: 11, rot: 180, mirror: true }], [42, { tpl: 11, rot: 180, mirror: true }],
  [13, { tpl: 13, rot: 0, mirror: false }], [23, { tpl: 13, rot: 0, mirror: true }],
  [33, { tpl: 13, rot: 180, mirror: false }], [43, { tpl: 13, rot: 180, mirror: true }],
  [14, { tpl: 14, rot: 0, mirror: false }], [15, { tpl: 14, rot: 0, mirror: false }],
  [24, { tpl: 14, rot: 0, mirror: true }], [25, { tpl: 14, rot: 0, mirror: true }],
  [34, { tpl: 14, rot: 180, mirror: false }], [35, { tpl: 14, rot: 180, mirror: false }],
  [44, { tpl: 14, rot: 180, mirror: true }], [45, { tpl: 14, rot: 180, mirror: true }],
  [16, { tpl: 16, rot: 0, mirror: false }], [17, { tpl: 16, rot: 0, mirror: false }], [18, { tpl: 16, rot: 0, mirror: false }],
  [26, { tpl: 16, rot: 0, mirror: true }], [27, { tpl: 16, rot: 0, mirror: true }], [28, { tpl: 16, rot: 0, mirror: true }],
  [36, { tpl: 16, rot: 180, mirror: false }], [37, { tpl: 16, rot: 180, mirror: false }], [38, { tpl: 16, rot: 180, mirror: false }],
  [46, { tpl: 16, rot: 180, mirror: true }], [47, { tpl: 16, rot: 180, mirror: true }], [48, { tpl: 16, rot: 180, mirror: true }],
]);

interface OdontogramaModulProps {
  selectedTeeth: number[];
  onSelectedTeethChange?: (next: number[]) => void;
  readOnly?: boolean;
}

function transformFor(conf: { rot: 0 | 180; mirror: boolean }) {
  return `rotate(${conf.rot}deg) scaleX(${conf.mirror ? "-1" : "1"})`;
}

function ToolButton({ src, label }: { src: string; label: string }) {
  return (
    <button type="button" className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300 bg-violet-100">
      <div className="relative h-9 w-9">
        <Image src={src} alt={label} fill sizes="36px" className="object-contain" />
      </div>
    </button>
  );
}

function ToothTile({ tooth, selected, readOnly, onClick }: { tooth: number; selected: boolean; readOnly: boolean; onClick: (event: MouseEvent, tooth: number) => void }) {
  const conf = TOOTH_TEMPLATE.get(tooth);
  if (!conf) return null;

  const img = TEMPLATES[conf.tpl];
  const occl = TEMPLATES_OCCL[conf.tpl as 14 | 16];
  const style = { transform: transformFor(conf) };

  return (
    <button
      type="button"
      onClick={(event) => onClick(event, tooth)}
      disabled={readOnly}
      className={cn(
        "relative h-[108px] rounded-2xl border border-slate-300 bg-slate-50 p-1 transition",
        selected && "border-blue-500 ring-2 ring-blue-300"
      )}
    >
      {occl && (
        <div className="absolute inset-x-0 top-1 mx-auto h-8 w-8">
          <Image src={occl} alt={`oclusal ${tooth}`} fill sizes="32px" className="object-contain" style={style} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-1 mx-auto h-16 w-10">
        <Image src={img} alt={`pieza ${tooth}`} fill sizes="40px" className="object-contain" style={style} />
      </div>
    </button>
  );
}

export function OdontogramaModul({ selectedTeeth, onSelectedTeethChange, readOnly = false }: OdontogramaModulProps) {
  const [activeTooth, setActiveTooth] = useState<number | null>(selectedTeeth[0] ?? null);
  const selectedSet = useMemo(() => new Set(selectedTeeth), [selectedTeeth]);

  const handleToothClick = (event: MouseEvent, tooth: number) => {
    if (readOnly || !onSelectedTeethChange) return;

    const isMulti = event.metaKey || event.ctrlKey;
    const next = isMulti
      ? selectedSet.has(tooth)
        ? selectedTeeth.filter((id) => id !== tooth)
        : [...selectedTeeth, tooth]
      : selectedSet.has(tooth) && selectedTeeth.length === 1
        ? []
        : [tooth];

    setActiveTooth(tooth);
    onSelectedTeethChange(next.sort((a, b) => a - b));
  };

  const topRow = ALL_TEETH.slice(0, 16);
  const bottomRow = [...ALL_TEETH.slice(16)].reverse();

  return (
    <div className="rounded-3xl border bg-[#f3f5f8]">
      {!readOnly && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900">Carta dental</h3>
            <p className="text-sm text-slate-600">Haz clic en un diente. Para selección múltiple, usa CMD/CTRL + clic.</p>
          </div>
          <div className="flex gap-2">
            <ToolButton src={TEMPLATES[11]} label="base" />
            <ToolButton src={TEMPLATES[13]} label="variante" />
            <ToolButton src={TEMPLATES[14]} label="restauración" />
            <ToolButton src={TEMPLATES[16]} label="raíz" />
          </div>
        </div>
      )}

      <div className="grid gap-0 lg:grid-cols-[1fr_430px]">
        <div className="p-4">
          <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-2 text-center text-sm font-semibold text-slate-600">
            {topRow.map((tooth, idx) => <span key={`${tooth}-${idx}`}>{idx + 1}</span>)}
          </div>

          <div className="mt-2 grid grid-cols-8 gap-2 md:grid-cols-[repeat(16,minmax(0,1fr))]">
            {topRow.map((tooth) => (
              <ToothTile key={tooth} tooth={tooth} selected={selectedSet.has(tooth)} readOnly={readOnly} onClick={handleToothClick} />
            ))}
          </div>

          <div className="mt-2 grid grid-cols-8 gap-2 md:grid-cols-[repeat(16,minmax(0,1fr))]">
            {bottomRow.map((tooth) => (
              <ToothTile key={tooth} tooth={tooth} selected={selectedSet.has(tooth)} readOnly={readOnly} onClick={handleToothClick} />
            ))}
          </div>

          <div className="mt-2 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-2 text-center text-sm font-semibold text-slate-600">
            {bottomRow.map((tooth) => <span key={`label-${tooth}`}>{tooth}</span>)}
          </div>
        </div>

        {!readOnly && (
          <aside className="border-l bg-[#f0f2f5] p-4">
            <div className="rounded-2xl border bg-white/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-2xl font-bold text-slate-900">Controles</h4>
                <button
                  type="button"
                  className="rounded-xl border border-red-300 px-4 py-1 text-red-600"
                  onClick={() => onSelectedTeethChange?.([])}
                >
                  Borrar selección
                </button>
              </div>
              <p className="mb-3 text-sm text-slate-600">
                Diente activo: <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold">{activeTooth ?? "-"}</span>
              </p>
              <div className="space-y-3">
                <section className="rounded-2xl border bg-white/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h5 className="text-lg font-bold">Raíz</h5>
                    <Minus className="h-4 w-4" />
                  </div>
                  <button type="button" className="w-full rounded-xl bg-slate-200 px-3 py-2 text-left font-semibold">Raíz sana</button>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-400 bg-emerald-100 px-3 py-1">Pulpitis</span>
                    <span className="rounded-full border px-3 py-1">Diente resecado</span>
                    <span className="rounded-full border px-3 py-1">Pin parapulpar</span>
                  </div>
                </section>

                {[
                  "Caries",
                  "Obturaciones y restauración",
                  "Periodonto e inflamaciones",
                ].map((title) => (
                  <section key={title} className="rounded-2xl border bg-white/60 p-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-lg font-bold">{title}</h5>
                      <Plus className="h-4 w-4" />
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
