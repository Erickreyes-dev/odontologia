"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createDescripcionEgreso, createTipoEgreso, createTipoIngreso } from "../../actions";

type TipoEgreso = { id: string; nombre: string; categoriaEstadoResultados: string };

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
