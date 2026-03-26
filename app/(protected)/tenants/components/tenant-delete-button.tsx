"use client";

import { useTransition } from "react";
import { deleteTenant } from "../actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function TenantDeleteButton({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    const approved = window.confirm(`¿Seguro que deseas eliminar el tenant ${tenantName}? Esta acción no se puede deshacer.`);
    if (!approved) return;

    startTransition(async () => {
      const result = await deleteTenant(tenantId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Tenant eliminado correctamente");
    });
  };

  return (
    <Button type="button" variant="destructive" onClick={onDelete} disabled={isPending}>
      <Trash2 className="mr-2 h-4 w-4" /> {isPending ? "Eliminando..." : "Eliminar tenant"}
    </Button>
  );
}
