"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateTenantPlan } from "../actions";
import { toast } from "sonner";

type PaqueteOption = { id: string; nombre: string };

interface Props {
  tenantId: string;
  currentPaqueteId: string | null;
  currentPeriodoPlan: string;
  currentEstado: "vigente" | "expirado" | "cancelado";
  currentFechaExpiracion?: Date | null;
  paquetes: PaqueteOption[];
}

function toDateInputValue(date?: Date | null) {
  if (!date) return "";
  const iso = new Date(date).toISOString();
  return iso.slice(0, 10);
}

export default function TenantPlanEditor({
  tenantId,
  currentPaqueteId,
  currentPeriodoPlan,
  currentEstado,
  currentFechaExpiracion,
  paquetes,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [paqueteId, setPaqueteId] = useState(currentPaqueteId ?? "");
  const [periodoPlan, setPeriodoPlan] = useState(currentPeriodoPlan || "mensual");
  const [estado, setEstado] = useState<"vigente" | "expirado" | "cancelado">(currentEstado);
  const [fechaExpiracion, setFechaExpiracion] = useState(toDateInputValue(currentFechaExpiracion));

  const onSave = () => {
    startTransition(async () => {
      if (!fechaExpiracion) {
        toast.error("Seleccione una fecha de finalización");
        return;
      }

      const result = await updateTenantPlan({
        tenantId,
        paqueteId,
        periodoPlan: periodoPlan as "mensual" | "trimestral" | "semestral" | "anual",
        estado,
        fechaExpiracion: new Date(fechaExpiracion),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Plan del tenant actualizado");
    });
  };

  return (
    <div className="mt-3 grid gap-2 md:grid-cols-5">
      <select
        className="rounded-md border bg-background p-2 text-sm"
        value={paqueteId}
        onChange={(e) => setPaqueteId(e.target.value)}
      >
        <option value="">Seleccione paquete</option>
        {paquetes.map((p) => (
          <option key={p.id} value={p.id}>{p.nombre}</option>
        ))}
      </select>
      <select
        className="rounded-md border bg-background p-2 text-sm"
        value={periodoPlan}
        onChange={(e) => setPeriodoPlan(e.target.value)}
      >
        <option value="mensual">Mensual</option>
        <option value="trimestral">Trimestral</option>
        <option value="semestral">Semestral</option>
        <option value="anual">Anual</option>
      </select>
      <select
        className="rounded-md border bg-background p-2 text-sm"
        value={estado}
        onChange={(e) => setEstado(e.target.value as "vigente" | "expirado" | "cancelado")}
      >
        <option value="vigente">Vigente</option>
        <option value="expirado">Expirado</option>
        <option value="cancelado">Cancelado</option>
      </select>
      <input
        type="date"
        className="rounded-md border bg-background p-2 text-sm"
        value={fechaExpiracion}
        onChange={(e) => setFechaExpiracion(e.target.value)}
      />
      <Button size="sm" disabled={isPending || !paqueteId || !fechaExpiracion} onClick={onSave}>
        {isPending ? "Guardando..." : "Actualizar plan"}
      </Button>
    </div>
  );
}
