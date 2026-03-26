"use client";

import { useState, useTransition } from "react";
import { createPaquete } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function CreatePaqueteForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await createPaquete({
        nombre: String(formData.get("nombre") || ""),
        descripcion: String(formData.get("descripcion") || ""),
        precio: Number(formData.get("precio") || 0),
        precioTrimestral: Number(formData.get("precioTrimestral") || 0),
        precioSemestral: Number(formData.get("precioSemestral") || 0),
        precioAnual: Number(formData.get("precioAnual") || 0),
        maxUsuarios: Number(formData.get("maxUsuarios") || 20),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess("Paquete creado correctamente");
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" placeholder="Growth" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxUsuarios">Max usuarios</Label>
        <Input id="maxUsuarios" name="maxUsuarios" type="number" min={1} defaultValue={20} required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Input id="descripcion" name="descripcion" placeholder="Plan para clínicas medianas" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="precio">Precio mensual (USD)</Label>
        <Input id="precio" name="precio" type="number" min={0} step="0.01" defaultValue={0} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="precioTrimestral">Precio trimestral (USD)</Label>
        <Input id="precioTrimestral" name="precioTrimestral" type="number" min={0} step="0.01" defaultValue={0} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="precioSemestral">Precio semestral (USD)</Label>
        <Input id="precioSemestral" name="precioSemestral" type="number" min={0} step="0.01" defaultValue={0} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="precioAnual">Precio anual (USD)</Label>
        <Input id="precioAnual" name="precioAnual" type="number" min={0} step="0.01" defaultValue={0} required />
      </div>

      {error && <p className="text-sm text-red-500 md:col-span-2">{error}</p>}
      {success && <p className="text-sm text-emerald-600 md:col-span-2">{success}</p>}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Crear paquete"}
        </Button>
      </div>
    </form>
  );
}
