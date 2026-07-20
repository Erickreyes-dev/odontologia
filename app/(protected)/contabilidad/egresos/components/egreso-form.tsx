"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createEgreso } from "../../actions";

type Tipo = { id: string; nombre: string; descripciones?: { id: string; nombre: string }[] };
type Option = { id: string; nombre: string };
type Catalogs = { tiposEgreso: Tipo[]; productos: Option[]; serviciosLaboratorio: Option[]; equipos: Option[] };

const specialTypes = ["Materiales Odontológicos", "Laboratorio", "Equipos e Instrumentos"];

export function EgresoForm({ catalogs }: { catalogs: Catalogs }) {
  const [tipoId, setTipoId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tipo = catalogs.tiposEgreso.find((t) => t.id === tipoId);
  const isSpecial = !!tipo && specialTypes.includes(tipo.nombre);
  const options = useMemo(() => {
    if (!tipo) return [];
    if (tipo.nombre === "Materiales Odontológicos") return catalogs.productos;
    if (tipo.nombre === "Laboratorio") return catalogs.serviciosLaboratorio;
    if (tipo.nombre === "Equipos e Instrumentos") return catalogs.productos;
    return tipo.descripciones ?? [];
  }, [catalogs, tipo]);

  function handleSubmit(formData: FormData) {
    const cantidad = Number(formData.get("cantidad") || 0);
    const monto = Number(formData.get("monto") || 0);
    const metodoPago = String(formData.get("metodoPago") || "");
    const fecha = String(formData.get("fecha") || "");
    const comentario = String(formData.get("comentario") || "").trim();
    const descripcionManual = manual.trim();

    if (!tipoId || !fecha || !metodoPago || !Number.isFinite(cantidad) || cantidad <= 0 || !Number.isFinite(monto) || monto <= 0) {
      setError("Debe completar tipo, cantidad, método de pago, monto y fecha.");
      return;
    }
    if (!selectedId && !descripcionManual) {
      setError("Debe seleccionar una descripción o escribir una nueva opción.");
      return;
    }

    const payload: Record<string, unknown> = { tipoEgresoId: tipoId, descripcionManual, cantidad, metodoPago, monto, comentario, fecha: new Date(fecha) };
    if (tipo?.nombre === "Materiales Odontológicos" && selectedId) payload.productoId = selectedId;
    else if (tipo?.nombre === "Laboratorio" && selectedId) payload.servicioId = selectedId;
    else if (tipo?.nombre === "Equipos e Instrumentos" && selectedId) payload.productoId = selectedId;
    else if (selectedId) payload.descripcionEgresoId = selectedId;

    setError(null);
    startTransition(async () => {
      const result = await createEgreso(payload);
      if (!result.ok) setError(result.message ?? "No se pudo guardar");
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-2 rounded-lg border p-3 md:grid-cols-4 xl:grid-cols-8">
      <select name="tipoEgresoId" required value={tipoId} onChange={(e) => { setTipoId(e.target.value); setSelectedId(""); setManual(""); }} className="rounded-md border p-2">
        <option value="">Tipo de egreso</option>
        {catalogs.tiposEgreso.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
      </select>
      {isSpecial ? (
        <select name="descripcionSelect" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="rounded-md border p-2">
          <option value="">Seleccionar descripción</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </select>
      ) : null}
      <input name="descripcionManual" value={manual} onChange={(e) => setManual(e.target.value)} placeholder={isSpecial ? "O agregar nueva descripción" : "Descripción"} className="rounded-md border p-2" />
      <input name="cantidad" required type="number" min="0.01" step="0.01" defaultValue="1" className="rounded-md border p-2" />
      <select name="metodoPago" required className="rounded-md border p-2"><option value="">Método</option><option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="TRANSFERENCIA">Transferencia</option><option value="SEGURO">Seguro</option><option value="OTRO">Otro</option></select>
      <input name="monto" required type="number" min="0.01" step="0.01" placeholder="Monto" className="rounded-md border p-2" />
      <input name="fecha" required type="date" className="rounded-md border p-2" defaultValue={new Date().toISOString().slice(0, 10)} />
      <input name="comentario" placeholder="Comentario" className="rounded-md border p-2" />
      <Button disabled={isPending}>{isPending ? "Guardando..." : "Agregar"}</Button>
      {error ? <p className="md:col-span-4 xl:col-span-8 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
