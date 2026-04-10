"use client";

import { OdontogramaModul } from "@/components/odontograma/odontograma-modul";

interface PacienteOdontogramaResumenProps {
  treatedTeeth: number[];
  totalConsultasConOdontograma: number;
}

export function PacienteOdontogramaResumen({
  treatedTeeth,
  totalConsultasConOdontograma,
}: PacienteOdontogramaResumenProps) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <OdontogramaModul
        selectedTeeth={treatedTeeth}
        readOnly
      />

      <p className="text-sm text-muted-foreground">
        {totalConsultasConOdontograma > 0
          ? `Piezas tratadas en ${totalConsultasConOdontograma} consulta(s): ${treatedTeeth.join(", ") || "ninguna"}.`
          : "Este paciente todavía no tiene consultas con odontograma registrado."}
      </p>
    </div>
  );
}
