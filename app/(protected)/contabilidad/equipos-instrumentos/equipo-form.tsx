"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { upsertEquipoInstrumento } from "../actions";

type Equipo = {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  cantidad: number | string;
  costoTotal?: number | string | null;
  activo?: boolean;
};

export function EquipoInstrumentoForm({ initialData, submitLabel = "Agregar" }: { initialData?: Equipo; submitLabel?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const nombre = String(formData.get("nombre") || "").trim();
    const descripcion = String(formData.get("descripcion") || "").trim();
    const cantidad = Number(formData.get("cantidad") || 0);
    const costoTotalValue = formData.get("costoTotal");
    const costoTotal = costoTotalValue === null || String(costoTotalValue).trim() === "" ? null : Number(costoTotalValue);

    if (!nombre || !Number.isFinite(cantidad) || cantidad < 0 || (costoTotal !== null && (!Number.isFinite(costoTotal) || costoTotal < 0))) {
      setError("Debe completar nombre, cantidad válida y costo válido.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await upsertEquipoInstrumento({ id: initialData?.id, nombre, descripcion: descripcion || null, cantidad, costoTotal, activo: initialData?.activo ?? true });
      } catch (error) {
        setError(error instanceof Error ? error.message : "No se pudo guardar el equipo o instrumento.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-2 rounded-lg border p-3 md:grid-cols-5">
      <input name="nombre" required placeholder="Equipo o instrumento" className="rounded-md border p-2" defaultValue={initialData?.nombre ?? ""} />
      <input name="descripcion" placeholder="Descripción" className="rounded-md border p-2" defaultValue={initialData?.descripcion ?? ""} />
      <input name="cantidad" required type="number" min="0" step="0.01" placeholder="Cantidad" className="rounded-md border p-2" defaultValue={initialData?.cantidad ?? "0"} />
      <input name="costoTotal" type="number" min="0" step="0.01" placeholder="Costo total" className="rounded-md border p-2" defaultValue={initialData?.costoTotal ?? ""} />
      <Button disabled={isPending}>{isPending ? "Guardando..." : submitLabel}</Button>
      {error ? <p className="md:col-span-5 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
