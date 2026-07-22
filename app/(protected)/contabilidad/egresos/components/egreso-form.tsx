"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createEgreso } from "../../actions";

type Tipo = { id: string; nombre: string; descripciones?: { id: string; nombre: string }[] };
type Option = { id: string; nombre: string };
type ConsultaLaboratorio = { id: string; servicioId: string; nombre: string };
export type Catalogs = {
  tiposEgreso: Tipo[];
  productos: Option[];
  serviciosLaboratorio: Option[];
  consultasLaboratorio: ConsultaLaboratorio[];
  equipos: Option[];
};

const specialTypes = ["Materiales Odontológicos", "Laboratorio", "Equipos e Instrumentos"];

type InitialData = {
  tipoEgresoId: string;
  descripcionEgresoId?: string | null;
  descripcionManual?: string | null;
  productoId?: string | null;
  servicioId?: string | null;
  equipoId?: string | null;
  consultaId?: string | null;
  cantidad: number;
  metodoPago: string;
  monto: number;
  fecha: string;
  comentario: string;
};

export function EgresoForm({
  catalogs,
  initialData,
  submitLabel = "Agregar",
  action = createEgreso,
}: {
  catalogs: Catalogs;
  initialData?: InitialData;
  submitLabel?: string;
  action?: (payload: unknown) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [tipoId, setTipoId] = useState(initialData?.tipoEgresoId ?? "");
  const [selectedId, setSelectedId] = useState(initialData?.productoId ?? initialData?.servicioId ?? initialData?.equipoId ?? initialData?.descripcionEgresoId ?? "");
  const [consultaId, setConsultaId] = useState(initialData?.consultaId ?? "");
  const [manual, setManual] = useState(initialData?.descripcionManual ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tipo = catalogs.tiposEgreso.find((t) => t.id === tipoId);
  const isSpecial = !!tipo && specialTypes.includes(tipo.nombre);
  const isLaboratorio = tipo?.nombre === "Laboratorio";
  const options = useMemo(() => {
    if (!tipo) return [];
    if (tipo.nombre === "Materiales Odontológicos") return catalogs.productos;
    if (tipo.nombre === "Laboratorio") return catalogs.serviciosLaboratorio;
    if (tipo.nombre === "Equipos e Instrumentos") return catalogs.equipos;
    return tipo.descripciones ?? [];
  }, [catalogs, tipo]);
  const consultasServicio = useMemo(
    () => catalogs.consultasLaboratorio.filter((consulta) => consulta.servicioId === selectedId),
    [catalogs.consultasLaboratorio, selectedId],
  );

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
    if (isLaboratorio && (!selectedId || !consultaId)) {
      setError("Debe seleccionar el servicio y la consulta pendiente de liquidar para el egreso de laboratorio.");
      return;
    }

    const payload: Record<string, unknown> = { tipoEgresoId: tipoId, descripcionManual, cantidad, metodoPago, monto, comentario, fecha: new Date(fecha) };
    if (tipo?.nombre === "Materiales Odontológicos" && selectedId) payload.productoId = selectedId;
    else if (tipo?.nombre === "Laboratorio" && selectedId) {
      payload.servicioId = selectedId;
      payload.consultaId = consultaId;
    } else if (tipo?.nombre === "Equipos e Instrumentos" && selectedId) payload.equipoId = selectedId;
    else if (selectedId) payload.descripcionEgresoId = selectedId;

    setError(null);
    startTransition(async () => {
      const result = await action(payload);
      if (!result.ok) setError(result.message ?? "No se pudo guardar");
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 [&_input]:min-w-0 [&_select]:min-w-0">
      <select name="tipoEgresoId" required value={tipoId} onChange={(e) => { setTipoId(e.target.value); setSelectedId(""); setConsultaId(""); setManual(""); }} className="rounded-md border p-2">
        <option value="">Tipo de egreso</option>
        {catalogs.tiposEgreso.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
      </select>
      {isSpecial ? (
        <select name="descripcionSelect" value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setConsultaId(""); }} className="rounded-md border p-2">
          <option value="">{isLaboratorio ? "Seleccionar servicio" : "Seleccionar descripción"}</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </select>
      ) : null}
      {isLaboratorio ? (
        <select name="consultaId" value={consultaId} onChange={(e) => setConsultaId(e.target.value)} className="rounded-md border p-2" disabled={!selectedId}>
          <option value="">Consulta pendiente de liquidar</option>
          {consultasServicio.map((consulta) => <option key={consulta.id} value={consulta.id}>{consulta.nombre}</option>)}
        </select>
      ) : null}
      <input name="descripcionManual" value={manual} onChange={(e) => setManual(e.target.value)} placeholder={isSpecial ? "O agregar nueva descripción" : "Descripción"} className="rounded-md border p-2" />
      <input name="cantidad" required type="number" min="0.01" step="0.01" defaultValue={initialData?.cantidad ?? "1"} className="rounded-md border p-2" />
      <select name="metodoPago" required className="rounded-md border p-2" defaultValue={initialData?.metodoPago ?? ""}><option value="">Método</option><option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="TRANSFERENCIA">Transferencia</option><option value="SEGURO">Seguro</option><option value="OTRO">Otro</option></select>
      <input name="monto" required type="number" min="0.01" step="0.01" placeholder="Monto" className="rounded-md border p-2" defaultValue={initialData?.monto ?? ""} />
      <input name="fecha" required type="date" className="rounded-md border p-2" defaultValue={initialData?.fecha ?? new Date().toISOString().slice(0, 10)} />
      <input name="comentario" placeholder="Comentario" className="rounded-md border p-2" defaultValue={initialData?.comentario ?? ""} />
      <Button disabled={isPending}>{isPending ? "Guardando..." : submitLabel}</Button>
      {error ? <p className="md:col-span-4 xl:col-span-8 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
