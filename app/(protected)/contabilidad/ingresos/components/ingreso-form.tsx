"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createIngresoManual } from "../../actions";

type TipoIngreso = { id: string; nombre: string };

export function IngresoForm({ tiposIngreso }: { tiposIngreso: TipoIngreso[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const tipoIngresoId = String(formData.get("tipoIngresoId") || "");
    const fecha = String(formData.get("fecha") || "");
    const concepto = String(formData.get("concepto") || "").trim();
    const monto = Number(formData.get("monto") || 0);
    const metodoPago = String(formData.get("metodoPago") || "");
    const comentario = String(formData.get("comentario") || "").trim();

    if (!tipoIngresoId || !fecha || !concepto || !metodoPago || !Number.isFinite(monto) || monto <= 0) {
      setError("Debe completar tipo, fecha, concepto, método de pago y un monto mayor a 0.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createIngresoManual({ tipoIngresoId, fecha: new Date(fecha), concepto, monto, metodoPago, comentario });
      if (!result.ok) setError(result.message ?? "No se pudo guardar");
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-2 rounded-lg border p-3 md:grid-cols-7">
      <select name="tipoIngresoId" required className="rounded-md border p-2">
        <option value="">Tipo de ingreso</option>
        {tiposIngreso.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
      </select>
      <input name="fecha" type="date" required className="rounded-md border p-2" defaultValue={new Date().toISOString().slice(0, 10)} />
      <input name="concepto" required placeholder="Concepto" className="rounded-md border p-2" />
      <input name="monto" required type="number" min="0.01" step="0.01" placeholder="Monto" className="rounded-md border p-2" />
      <select name="metodoPago" required className="rounded-md border p-2">
        <option value="">Método</option><option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="TRANSFERENCIA">Transferencia</option><option value="SEGURO">Seguro</option><option value="OTRO">Otro</option>
      </select>
      <input name="comentario" placeholder="Comentario" className="rounded-md border p-2" />
      <Button disabled={isPending}>{isPending ? "Guardando..." : "Agregar"}</Button>
      {error ? <p className="md:col-span-7 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
