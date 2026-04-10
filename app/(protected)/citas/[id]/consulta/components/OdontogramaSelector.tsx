"use client";

import { OdontogramaModul } from "@/components/odontograma/odontograma-modul";

interface OdontogramaSelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
}

export function OdontogramaSelector({ value, onChange }: OdontogramaSelectorProps) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <OdontogramaModul selectedTeeth={value} onSelectedTeethChange={onChange} />
      <p className="text-xs text-muted-foreground">
        Piezas seleccionadas: {value.length > 0 ? value.join(", ") : "ninguna"}.
      </p>
    </div>
  );
}
