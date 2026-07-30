"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createDescripcionEgreso, createTipoEgreso, createTipoIngreso, updateEstadoResultadosImpuesto } from "../../actions";

type TipoEgreso = { id: string; nombre: string; categoriaEstadoResultados: string };
type ImpuestoEstadoResultados = { activo: boolean; nombre: string; tasa: number };

function ErrorMessage({ message }: { message: string | null }) {
  return message ? <p className="basis-full rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">{message}</p> : null;
}

export function TipoIngresoForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  function submit(formData: FormData) {
    const nombre = String(formData.get("nombre") || "").trim();
    const descripcion = String(formData.get("descripcion") || "").trim();
    if (!nombre) return setError("Debe escribir el nombre del tipo de ingreso.");
    setError(null);
    startTransition(async () => {
      const result = await createTipoIngreso({ nombre, descripcion });
      if (!result.ok) setError(result.message ?? "No se pudo guardar");
    });
  }
  return <form action={submit} className="my-2 flex flex-wrap gap-2"><input name="nombre" required className="rounded-md border p-2" placeholder="Nuevo tipo"/><input name="descripcion" className="rounded-md border p-2" placeholder="Descripción"/><Button disabled={isPending}>Agregar</Button><ErrorMessage message={error}/></form>;
}

export function TipoEgresoForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  function submit(formData: FormData) {
    const nombre = String(formData.get("nombre") || "").trim();
    const categoriaEstadoResultados = String(formData.get("categoriaEstadoResultados") || "");
    if (!nombre || !categoriaEstadoResultados) return setError("Debe escribir el nombre y seleccionar la categoría.");
    setError(null);
    startTransition(async () => {
      const result = await createTipoEgreso({ nombre, categoriaEstadoResultados });
      if (!result.ok) setError(result.message ?? "No se pudo guardar");
    });
  }
  return <form action={submit} className="my-2 flex flex-wrap gap-2"><input name="nombre" required className="rounded-md border p-2" placeholder="Nuevo tipo"/><select name="categoriaEstadoResultados" required className="rounded-md border p-2"><option value="COSTOS">Costos</option><option value="GASTOS_OPERACION">Gastos operación</option><option value="GASTOS_FINANCIEROS">Gastos financieros</option><option value="IMPUESTOS">Impuestos</option></select><Button disabled={isPending}>Agregar</Button><ErrorMessage message={error}/></form>;
}

export function DescripcionEgresoForm({ tiposEgreso }: { tiposEgreso: TipoEgreso[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  function submit(formData: FormData) {
    const tipoEgresoId = String(formData.get("tipoEgresoId") || "");
    const nombre = String(formData.get("nombre") || "").trim();
    if (!tipoEgresoId || !nombre) return setError("Debe seleccionar un tipo de egreso y escribir la descripción.");
    setError(null);
    startTransition(async () => {
      const result = await createDescripcionEgreso({ tipoEgresoId, nombre });
      if (!result.ok) setError(result.message ?? "No se pudo guardar");
    });
  }
  return <form action={submit} className="my-2 flex flex-wrap gap-2"><select name="tipoEgresoId" required className="rounded-md border p-2"><option value="">Tipo de egreso</option>{tiposEgreso.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}</select><input name="nombre" required className="rounded-md border p-2" placeholder="Descripción"/><Button disabled={isPending}>Agregar</Button><ErrorMessage message={error}/></form>;
}

export function ImpuestoEstadoResultadosForm({ impuesto }: { impuesto: ImpuestoEstadoResultados }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const nombre = String(formData.get("nombre") || "").trim();
    const tasa = Number(formData.get("tasa") ?? 15);
    if (!nombre) return setError("Debe escribir el nombre del impuesto.");
    if (Number.isNaN(tasa) || tasa < 0 || tasa > 100) return setError("La tasa debe estar entre 0 y 100.");
    setError(null);
    startTransition(async () => {
      const result = await updateEstadoResultadosImpuesto({ activo: formData.get("activo") === "1", nombre, tasa });
      if (!result.ok) setError(result.message ?? "No se pudo guardar");
    });
  }

  return (
    <form action={submit} className="my-2 max-w-2xl rounded-lg border bg-white p-4 text-sm shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 font-medium">
          <input name="activo" type="checkbox" value="1" defaultChecked={impuesto.activo} className="h-4 w-4" />
          Aplicar impuesto guardado al estado de resultados
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Nombre del impuesto</span>
          <input name="nombre" required maxLength={80} defaultValue={impuesto.nombre} className="w-44 rounded-md border p-2" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Tasa (%)</span>
          <input name="tasa" type="number" min="0" max="100" step="0.01" defaultValue={impuesto.tasa} className="w-28 rounded-md border p-2" />
        </label>
        <Button disabled={isPending}>Guardar configuración</Button>
        <ErrorMessage message={error} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Esta configuración queda guardada para el tenant y se calcula sobre la utilidad antes de impuestos.
      </p>
    </form>
  );
}
