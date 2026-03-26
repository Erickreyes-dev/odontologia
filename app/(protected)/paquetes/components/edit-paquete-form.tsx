"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updatePaquete } from "../actions";

type EditablePaquete = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precioTrimestral: number | null;
  precioSemestral: number | null;
  precioAnual: number | null;
  maxUsuarios: number;
  trialActivo: boolean;
  trialDias: number;
};

export default function EditPaqueteForm({ paquete }: { paquete: EditablePaquete }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [trialActivo, setTrialActivo] = useState(Boolean(paquete.trialActivo));

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updatePaquete(paquete.id, {
        nombre: String(formData.get("nombre") || ""),
        descripcion: String(formData.get("descripcion") || ""),
        precio: Number(formData.get("precio") || 0),
        precioTrimestral: Number(formData.get("precioTrimestral") || 0),
        precioSemestral: Number(formData.get("precioSemestral") || 0),
        precioAnual: Number(formData.get("precioAnual") || 0),
        maxUsuarios: Number(formData.get("maxUsuarios") || 1),
        trialActivo,
        trialDias: Number(formData.get("trialDias") || 0),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Paquete actualizado");
      setIsEditing(false);
    });
  };

  if (!isEditing) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
        Editar
      </Button>
    );
  }

  return (
    <form action={onSubmit} className="mt-3 grid gap-2 rounded-lg border p-3 md:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor={`nombre-${paquete.id}`}>Nombre</Label>
        <Input id={`nombre-${paquete.id}`} name="nombre" defaultValue={paquete.nombre} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`maxUsuarios-${paquete.id}`}>Máx usuarios</Label>
        <Input id={`maxUsuarios-${paquete.id}`} name="maxUsuarios" type="number" min={1} defaultValue={paquete.maxUsuarios} required />
      </div>
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor={`descripcion-${paquete.id}`}>Descripción</Label>
        <Input id={`descripcion-${paquete.id}`} name="descripcion" defaultValue={paquete.descripcion ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`precio-${paquete.id}`}>Mensual USD</Label>
        <Input id={`precio-${paquete.id}`} name="precio" type="number" min={0} step="0.01" defaultValue={paquete.precio} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`precioTrimestral-${paquete.id}`}>Trimestral USD</Label>
        <Input id={`precioTrimestral-${paquete.id}`} name="precioTrimestral" type="number" min={0} step="0.01" defaultValue={Number(paquete.precioTrimestral ?? 0)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`precioSemestral-${paquete.id}`}>Semestral USD</Label>
        <Input id={`precioSemestral-${paquete.id}`} name="precioSemestral" type="number" min={0} step="0.01" defaultValue={Number(paquete.precioSemestral ?? 0)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`precioAnual-${paquete.id}`}>Anual USD</Label>
        <Input id={`precioAnual-${paquete.id}`} name="precioAnual" type="number" min={0} step="0.01" defaultValue={Number(paquete.precioAnual ?? 0)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`trialActivo-${paquete.id}`}>Prueba gratis</Label>
        <div className="flex h-10 items-center gap-2 rounded-md border px-3">
          <input id={`trialActivo-${paquete.id}`} type="checkbox" checked={trialActivo} onChange={(e) => setTrialActivo(e.target.checked)} />
          <span className="text-sm">{trialActivo ? "Activa" : "Desactivada"}</span>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`trialDias-${paquete.id}`}>Días trial</Label>
        <Input id={`trialDias-${paquete.id}`} name="trialDias" type="number" min={0} max={60} disabled={!trialActivo} defaultValue={paquete.trialDias} />
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Guardando..." : "Guardar cambios"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={isPending}>Cancelar</Button>
      </div>
    </form>
  );
}
