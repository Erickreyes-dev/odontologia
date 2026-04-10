"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const PERMANENT_ARCADES = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
} as const;

const TEMPORARY_ARCADES = {
  upperRight: [55, 54, 53, 52, 51],
  upperLeft: [61, 62, 63, 64, 65],
  lowerLeft: [71, 72, 73, 74, 75],
  lowerRight: [85, 84, 83, 82, 81],
} as const;

interface OdontogramaModulProps {
  selectedTeeth: number[];
  onSelectedTeethChange?: (next: number[]) => void;
  readOnly?: boolean;
  showTemporaryTeethToggle?: boolean;
  defaultShowTemporaryTeeth?: boolean;
}

function ToothCell({
  tooth,
  selected,
  readOnly,
  onClick,
}: {
  tooth: number;
  selected: boolean;
  readOnly: boolean;
  onClick: (tooth: number) => void;
}) {
  const imagePath = `/odontograma-svg/${tooth}.svg`;

  return (
    <button
      type="button"
      onClick={() => onClick(tooth)}
      disabled={readOnly}
      className={cn(
        "relative flex h-16 w-14 flex-col items-center justify-center rounded-md border transition",
        readOnly ? "cursor-default" : "cursor-pointer hover:border-primary/70",
        selected ? "border-primary bg-primary/10" : "border-muted-foreground/30 bg-background"
      )}
      aria-pressed={selected}
      aria-label={`Pieza ${tooth}`}
      title={`Pieza ${tooth}`}
    >
      <div className="relative h-9 w-9">
        <Image
          src={imagePath}
          alt={`Pieza ${tooth}`}
          fill
          sizes="36px"
          className={cn("object-contain", selected && "opacity-80")}
          onError={(event) => {
            const target = event.currentTarget;
            target.style.display = "none";
          }}
        />
      </div>
      <span className="mt-1 text-xs font-medium">{tooth}</span>
      {selected && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />}
    </button>
  );
}

function ArcadeRow({
  label,
  teeth,
  selectedSet,
  readOnly,
  onToothClick,
}: {
  label: string;
  teeth: readonly number[];
  selectedSet: Set<number>;
  readOnly: boolean;
  onToothClick: (tooth: number) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="grid grid-cols-8 gap-2 sm:grid-cols-8">
        {teeth.map((tooth) => (
          <ToothCell
            key={tooth}
            tooth={tooth}
            selected={selectedSet.has(tooth)}
            readOnly={readOnly}
            onClick={onToothClick}
          />
        ))}
      </div>
    </div>
  );
}

function TemporaryArcadeRow({
  label,
  teeth,
  selectedSet,
  readOnly,
  onToothClick,
}: {
  label: string;
  teeth: readonly number[];
  selectedSet: Set<number>;
  readOnly: boolean;
  onToothClick: (tooth: number) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="grid grid-cols-5 gap-2">
        {teeth.map((tooth) => (
          <ToothCell
            key={tooth}
            tooth={tooth}
            selected={selectedSet.has(tooth)}
            readOnly={readOnly}
            onClick={onToothClick}
          />
        ))}
      </div>
    </div>
  );
}

export function OdontogramaModul({
  selectedTeeth,
  onSelectedTeethChange,
  readOnly = false,
  showTemporaryTeethToggle = true,
  defaultShowTemporaryTeeth = false,
}: OdontogramaModulProps) {
  const [showTemporaryTeeth, setShowTemporaryTeeth] = useState(defaultShowTemporaryTeeth);

  const selectedSet = useMemo(() => new Set(selectedTeeth), [selectedTeeth]);

  const onToothClick = (tooth: number) => {
    if (readOnly || !onSelectedTeethChange) return;

    const next = selectedSet.has(tooth)
      ? selectedTeeth.filter((id) => id !== tooth)
      : [...selectedTeeth, tooth];

    onSelectedTeethChange(next.sort((a, b) => a - b));
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      {showTemporaryTeethToggle && (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={showTemporaryTeeth}
            onChange={(event) => setShowTemporaryTeeth(event.target.checked)}
            className="h-4 w-4 rounded border"
          />
          Mostrar dentición temporal
        </label>
      )}

      <div className="space-y-4">
        <ArcadeRow
          label="Superior derecha"
          teeth={PERMANENT_ARCADES.upperRight}
          selectedSet={selectedSet}
          readOnly={readOnly}
          onToothClick={onToothClick}
        />
        <ArcadeRow
          label="Superior izquierda"
          teeth={PERMANENT_ARCADES.upperLeft}
          selectedSet={selectedSet}
          readOnly={readOnly}
          onToothClick={onToothClick}
        />
        <ArcadeRow
          label="Inferior izquierda"
          teeth={PERMANENT_ARCADES.lowerLeft}
          selectedSet={selectedSet}
          readOnly={readOnly}
          onToothClick={onToothClick}
        />
        <ArcadeRow
          label="Inferior derecha"
          teeth={PERMANENT_ARCADES.lowerRight}
          selectedSet={selectedSet}
          readOnly={readOnly}
          onToothClick={onToothClick}
        />
      </div>

      {showTemporaryTeeth && (
        <div className="space-y-4 border-t pt-4">
          <TemporaryArcadeRow
            label="Temporal superior derecha"
            teeth={TEMPORARY_ARCADES.upperRight}
            selectedSet={selectedSet}
            readOnly={readOnly}
            onToothClick={onToothClick}
          />
          <TemporaryArcadeRow
            label="Temporal superior izquierda"
            teeth={TEMPORARY_ARCADES.upperLeft}
            selectedSet={selectedSet}
            readOnly={readOnly}
            onToothClick={onToothClick}
          />
          <TemporaryArcadeRow
            label="Temporal inferior izquierda"
            teeth={TEMPORARY_ARCADES.lowerLeft}
            selectedSet={selectedSet}
            readOnly={readOnly}
            onToothClick={onToothClick}
          />
          <TemporaryArcadeRow
            label="Temporal inferior derecha"
            teeth={TEMPORARY_ARCADES.lowerRight}
            selectedSet={selectedSet}
            readOnly={readOnly}
            onToothClick={onToothClick}
          />
        </div>
      )}
    </div>
  );
}
