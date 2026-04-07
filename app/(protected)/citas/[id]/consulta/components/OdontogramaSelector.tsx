"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Odontogram,
  initialPermanentTeeth,
  initialTemporaryTeeth,
} from "op-odontogram";

type ToothLike = {
  id: number;
  status?: string;
  selected?: boolean;
  isSelected?: boolean;
};

interface OdontogramaSelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
}

export function OdontogramaSelector({ value, onChange }: OdontogramaSelectorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<ToothLike | null>(null);
  const [showTemporaryTeeth, setShowTemporaryTeeth] = useState(false);
  const [showBiteEffect, setShowBiteEffect] = useState(false);
  const [isAnimatingBite, setIsAnimatingBite] = useState(false);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const normalizeTooth = (tooth: ToothLike, isSelected: boolean) => ({
    ...tooth,
    status: isSelected ? "filled" : "healthy",
    selected: isSelected,
    isSelected,
  });

  const [teeth, setTeeth] = useState<any[]>(() =>
    initialPermanentTeeth.map((tooth: ToothLike) => ({
      ...normalizeTooth(tooth, selectedSet.has(tooth.id)),
    }))
  );

  const [temporaryTeeth, setTemporaryTeeth] = useState<any[]>(() =>
    initialTemporaryTeeth.map((tooth: ToothLike) => ({
      ...normalizeTooth(tooth, selectedSet.has(tooth.id)),
    }))
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setTeeth((current) =>
      current.map((tooth: ToothLike) => ({
        ...normalizeTooth(tooth, selectedSet.has(tooth.id)),
      }))
    );

    setTemporaryTeeth((current) =>
      current.map((tooth: ToothLike) => ({
        ...normalizeTooth(tooth, selectedSet.has(tooth.id)),
      }))
    );
  }, [selectedSet]);

  const onToothClick = (tooth: ToothLike) => {
    setSelectedTooth(tooth);

    const nextSelected = selectedSet.has(tooth.id)
      ? value.filter((id) => id !== tooth.id)
      : [...value, tooth.id];

    const sortedSelection = nextSelected.sort((a, b) => a - b);
    const nextSelectionSet = new Set(sortedSelection);

    setTeeth((current) =>
      current.map((item: ToothLike) => ({
        ...normalizeTooth(item, nextSelectionSet.has(item.id)),
      }))
    );
    setTemporaryTeeth((current) =>
      current.map((item: ToothLike) => ({
        ...normalizeTooth(item, nextSelectionSet.has(item.id)),
      }))
    );

    onChange(sortedSelection);
  };

  const onSimulateBite = () => {
    if (isAnimatingBite) return;
    setIsAnimatingBite(true);
    setShowBiteEffect(false);

    setTimeout(() => setShowBiteEffect(true), 300);
    setTimeout(() => setShowBiteEffect(false), 1000);
    setTimeout(() => setIsAnimatingBite(false), 1500);
  };

  return (
    <div
      className="space-y-3 rounded-md border p-3"
      onClickCapture={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button")) {
          event.preventDefault();
        }
      }}
    >
      {isMounted ? (
        <Odontogram
          teeth={teeth}
          temporaryTeeth={temporaryTeeth}
          showTemporaryTeeth={showTemporaryTeeth}
          onToggleTemporaryTeeth={setShowTemporaryTeeth}
          selectedTooth={selectedTooth}
          onToothClick={onToothClick}
          showBiteEffect={showBiteEffect}
          onToggleBiteEffect={setShowBiteEffect}
          isAnimatingBite={isAnimatingBite}
          onSimulateBite={onSimulateBite}
        />
      ) : (
        <div className="h-[420px] w-full animate-pulse rounded-md bg-muted" />
      )}
      <p className="text-xs text-muted-foreground">
        Piezas seleccionadas: {value.length > 0 ? value.join(", ") : "ninguna"}.
      </p>
    </div>
  );
}
