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
};

interface OdontogramaSelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
}

export function OdontogramaSelector({ value, onChange }: OdontogramaSelectorProps) {
  const [selectedTooth, setSelectedTooth] = useState<ToothLike | null>(null);
  const [showTemporaryTeeth, setShowTemporaryTeeth] = useState(false);
  const [showBiteEffect, setShowBiteEffect] = useState(false);
  const [isAnimatingBite, setIsAnimatingBite] = useState(false);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const [teeth, setTeeth] = useState<any[]>(() =>
    initialPermanentTeeth.map((tooth: ToothLike) => ({
      ...tooth,
      status: selectedSet.has(tooth.id) ? "filled" : "healthy",
    }))
  );

  const [temporaryTeeth, setTemporaryTeeth] = useState<any[]>(() =>
    initialTemporaryTeeth.map((tooth: ToothLike) => ({
      ...tooth,
      status: selectedSet.has(tooth.id) ? "filled" : "healthy",
    }))
  );

  useEffect(() => {
    setTeeth((current) =>
      current.map((tooth: ToothLike) => ({
        ...tooth,
        status: selectedSet.has(tooth.id) ? "filled" : "healthy",
      }))
    );

    setTemporaryTeeth((current) =>
      current.map((tooth: ToothLike) => ({
        ...tooth,
        status: selectedSet.has(tooth.id) ? "filled" : "healthy",
      }))
    );
  }, [selectedSet]);

  const onToothClick = (tooth: ToothLike) => {
    setSelectedTooth(tooth);

    const nextSelected = selectedSet.has(tooth.id)
      ? value.filter((id) => id !== tooth.id)
      : [...value, tooth.id];

    onChange(nextSelected.sort((a, b) => a - b));
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
    <div className="space-y-3 rounded-md border p-3">
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
      <p className="text-xs text-muted-foreground">
        Piezas seleccionadas: {value.length > 0 ? value.join(", ") : "ninguna"}.
      </p>
    </div>
  );
}
