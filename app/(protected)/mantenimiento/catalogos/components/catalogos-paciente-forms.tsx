"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCatalogoConocioClinica, createCatalogoDecisionPaciente } from "@/app/(protected)/pacientes/actions";

function CatalogoForm({ label, placeholder, action }: { label: string; placeholder: string; action: (nombre: string) => Promise<{ ok: boolean; message?: string }> }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        const nombre = String(formData.get("nombre") || "").trim();
        if (!nombre) return setError("Debe escribir una opción.");
        setError(null);
        startTransition(async () => {
          const result = await action(nombre);
          if (!result.ok) setError(result.message ?? "No se pudo guardar la opción.");
        });
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="min-w-64 flex-1 space-y-1">
        <label className="text-sm font-medium">{label}</label>
        <Input name="nombre" placeholder={placeholder} required />
      </div>
      <Button disabled={isPending}>{isPending ? "Guardando..." : "Agregar"}</Button>
      {error ? <p className="basis-full text-sm text-destructive">{error}</p> : null}
    </form>
  );
}

export function CatalogosPacienteForms() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CatalogoForm label="¿Cómo conoció la clínica?" placeholder="Ej. Instagram, referido, rótulo..." action={createCatalogoConocioClinica} />
      <CatalogoForm label="¿Qué influyó en su decisión?" placeholder="Ej. precio, ubicación, confianza..." action={createCatalogoDecisionPaciente} />
    </div>
  );
}
