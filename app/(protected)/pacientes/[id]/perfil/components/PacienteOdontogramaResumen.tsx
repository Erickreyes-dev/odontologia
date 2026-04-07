"use client";

import { useEffect, useMemo, useState } from "react";
import { Odontogram, initialPermanentTeeth, initialTemporaryTeeth } from "op-odontogram";

type ToothLike = {
  id: number;
  status?: string;
  selected?: boolean;
  isSelected?: boolean;
};

interface PacienteOdontogramaResumenProps {
  treatedTeeth: number[];
  totalConsultasConOdontograma: number;
}

export function PacienteOdontogramaResumen({
  treatedTeeth,
  totalConsultasConOdontograma,
}: PacienteOdontogramaResumenProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<ToothLike | null>(null);
  const [showTemporaryTeeth, setShowTemporaryTeeth] = useState(false);
  const [showDemoMode, setShowDemoMode] = useState(false);
  const [showBiteEffect, setShowBiteEffect] = useState(false);
  const [isAnimatingBite, setIsAnimatingBite] = useState(false);

  const treatedSet = useMemo(() => new Set(treatedTeeth), [treatedTeeth]);

  const normalizeTooth = (tooth: ToothLike, isSelected: boolean) => ({
    ...tooth,
    status: isSelected ? "filled" : "healthy",
    selected: isSelected,
    isSelected,
  });

  const [teeth, setTeeth] = useState<any[]>(() =>
    initialPermanentTeeth.map((tooth: ToothLike) => ({
      ...normalizeTooth(tooth, treatedSet.has(tooth.id)),
    }))
  );

  const [temporaryTeeth, setTemporaryTeeth] = useState<any[]>(() =>
    initialTemporaryTeeth.map((tooth: ToothLike) => ({
      ...normalizeTooth(tooth, treatedSet.has(tooth.id)),
    }))
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setTeeth((current) =>
      current.map((tooth: ToothLike) => ({
        ...normalizeTooth(tooth, treatedSet.has(tooth.id)),
      }))
    );

    setTemporaryTeeth((current) =>
      current.map((tooth: ToothLike) => ({
        ...normalizeTooth(tooth, treatedSet.has(tooth.id)),
      }))
    );
  }, [treatedSet]);

  const onToothClick = (tooth: ToothLike) => {
    setSelectedTooth(tooth);
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
      {isMounted ? (
        <Odontogram
          teeth={teeth}
          temporaryTeeth={temporaryTeeth}
          showTemporaryTeeth={showTemporaryTeeth}
          onToggleTemporaryTeeth={setShowTemporaryTeeth}
          showDemoMode={showDemoMode}
          onToggleDemoMode={setShowDemoMode}
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

      <p className="text-sm text-muted-foreground">
        {totalConsultasConOdontograma > 0
          ? `Piezas tratadas en ${totalConsultasConOdontograma} consulta(s): ${treatedTeeth.join(", ") || "ninguna"}.`
          : "Este paciente todavía no tiene consultas con odontograma registrado."}
      </p>
    </div>
  );
}
