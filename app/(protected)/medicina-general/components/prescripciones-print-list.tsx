"use client";

import { Button } from "@/components/ui/button";
import { generateRecetaMedicaPDF, type RecetaPrintable } from "@/lib/pdf/receta-medica-pdf";
import { Printer } from "lucide-react";
import { toast } from "sonner";

interface PrescripcionesPrintListProps {
  recetas: RecetaPrintable[];
  clinicName?: string;
}

export function PrescripcionesPrintList({ recetas, clinicName = "Clínica" }: PrescripcionesPrintListProps) {
  if (!recetas.length) {
    return (
      <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        Sin prescripciones registradas aún.
      </div>
    );
  }

  const handlePrint = (receta: RecetaPrintable) => {
    generateRecetaMedicaPDF(receta, clinicName);
    toast.success("Receta generada en PDF");
  };

  return (
    <div className="mt-4 rounded-md border bg-muted/30 p-3 space-y-2">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recetas e impresión</p>
      {recetas.map((receta) => (
        <div key={receta.id} className="flex flex-col gap-2 rounded-md border bg-background p-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm">
            <p className="font-medium">{receta.pacienteNombre}</p>
            <p className="text-xs text-muted-foreground">Receta {receta.id.slice(0, 8)} · {receta.items.length} item(s)</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => handlePrint(receta)}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir receta
          </Button>
        </div>
      ))}
    </div>
  );
}
