"use client";

import Image from "next/image";
import { useMemo } from "react";
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
  [11, { tpl: 11, rot: 0, mirror: false }],
  [12, { tpl: 11, rot: 0, mirror: false }],
  [21, { tpl: 11, rot: 0, mirror: true }],
  [22, { tpl: 11, rot: 0, mirror: true }],
  [31, { tpl: 11, rot: 180, mirror: false }],
  [32, { tpl: 11, rot: 180, mirror: false }],
  [41, { tpl: 11, rot: 180, mirror: true }],
  [42, { tpl: 11, rot: 180, mirror: true }],

  [13, { tpl: 13, rot: 0, mirror: false }],
  [23, { tpl: 13, rot: 0, mirror: true }],
  [33, { tpl: 13, rot: 180, mirror: false }],
  [43, { tpl: 13, rot: 180, mirror: true }],

  [14, { tpl: 14, rot: 0, mirror: false }],
  [15, { tpl: 14, rot: 0, mirror: false }],
  [24, { tpl: 14, rot: 0, mirror: true }],
  [25, { tpl: 14, rot: 0, mirror: true }],
  [34, { tpl: 14, rot: 180, mirror: false }],
  [35, { tpl: 14, rot: 180, mirror: false }],
  [44, { tpl: 14, rot: 180, mirror: true }],
  [45, { tpl: 14, rot: 180, mirror: true }],

  [16, { tpl: 16, rot: 0, mirror: false }],
  [17, { tpl: 16, rot: 0, mirror: false }],
  [18, { tpl: 16, rot: 0, mirror: false }],
  [26, { tpl: 16, rot: 0, mirror: true }],
  [27, { tpl: 16, rot: 0, mirror: true }],
  [28, { tpl: 16, rot: 0, mirror: true }],
  [36, { tpl: 16, rot: 180, mirror: false }],
  [37, { tpl: 16, rot: 180, mirror: false }],
  [38, { tpl: 16, rot: 180, mirror: false }],
  [46, { tpl: 16, rot: 180, mirror: true }],
  [47, { tpl: 16, rot: 180, mirror: true }],
  [48, { tpl: 16, rot: 180, mirror: true }],
]);

interface OdontogramaModulProps {
  selectedTeeth: number[];
  onSelectedTeethChange?: (next: number[]) => void;
  readOnly?: boolean;
}

function getTransform(rot: 0 | 180, mirror: boolean) {
  const rotate = `rotate(${rot}deg)`;
  const scale = mirror ? "scaleX(-1)" : "scaleX(1)";
  return `${rotate} ${scale}`;
}

function ToothTile({
  tooth,
  selected,
  readOnly,
  onToothClick,
}: {
  tooth: number;
  selected: boolean;
  readOnly: boolean;
  onToothClick: (tooth: number) => void;
}) {
  const conf = TOOTH_TEMPLATE.get(tooth);

  if (!conf) return null;

  const img = TEMPLATES[conf.tpl];
  const occl = TEMPLATES_OCCL[conf.tpl as 14 | 16];

  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={() => onToothClick(tooth)}
      aria-label={`Pieza ${tooth}`}
      className={cn(
        "group relative flex h-28 w-14 flex-col items-center justify-between rounded-lg border px-1 py-1 transition",
        selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/60",
        readOnly ? "cursor-default" : "cursor-pointer"
      )}
    >
      <span className="text-[11px] font-semibold leading-none text-muted-foreground">{tooth}</span>

      {occl ? (
        <div className="relative h-4 w-4">
          <Image
            src={occl}
            alt={`oclusal ${tooth}`}
            fill
            sizes="16px"
            className="object-contain"
            style={{ transform: getTransform(conf.rot, conf.mirror) }}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : (
        <span className="h-4" />
      )}

      <div className="relative h-14 w-9">
        <Image
          src={img}
          alt={`Pieza ${tooth}`}
          fill
          sizes="36px"
          className="object-contain"
          style={{ transform: getTransform(conf.rot, conf.mirror) }}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </div>

      <span
        className={cn(
          "mb-0.5 h-2 w-2 rounded-full transition",
          selected ? "bg-primary" : "bg-muted group-hover:bg-primary/50"
        )}
      />
    </button>
  );
}

export function OdontogramaModul({ selectedTeeth, onSelectedTeethChange, readOnly = false }: OdontogramaModulProps) {
  const selectedSet = useMemo(() => new Set(selectedTeeth), [selectedTeeth]);

  const onToothClick = (tooth: number) => {
    if (readOnly || !onSelectedTeethChange) return;

    const next = selectedSet.has(tooth)
      ? selectedTeeth.filter((id) => id !== tooth)
      : [...selectedTeeth, tooth];

    onSelectedTeethChange(next.sort((a, b) => a - b));
  };

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="grid grid-cols-8 gap-2 md:grid-cols-[repeat(16,minmax(0,1fr))]">
        {ALL_TEETH.map((tooth) => (
          <ToothTile
            key={tooth}
            tooth={tooth}
            selected={selectedSet.has(tooth)}
            readOnly={readOnly}
            onToothClick={onToothClick}
          />
        ))}
      </div>
    </div>
  );
}
