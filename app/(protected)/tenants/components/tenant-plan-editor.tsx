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
  paquetes: PaqueteOption[];
}

export default function TenantPlanEditor({ tenantId, currentPaqueteId, currentPeriodoPlan, paquetes }: Props) {
  const [isPending, startTransition] = useTransition();
  const [paqueteId, setPaqueteId] = useState(currentPaqueteId ?? "");
  const [periodoPlan, setPeriodoPlan] = useState(currentPeriodoPlan || "mensual");

  const onSave = () => {
    startTransition(async () => {
      const result = await updateTenantPlan({
        tenantId,
        paqueteId,
        periodoPlan: periodoPlan as "mensual" | "trimestral" | "semestral" | "anual",
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Plan del tenant actualizado");
    });
  };

  return (
    <div className="mt-3 grid gap-2 md:grid-cols-3">
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
      <Button size="sm" disabled={isPending || !paqueteId} onClick={onSave}>
        {isPending ? "Guardando..." : "Actualizar plan"}
      </Button>
    </div>
  );
}
