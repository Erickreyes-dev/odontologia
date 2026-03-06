"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toggleTenantStatus } from "../actions";

interface Props {
  tenantId: string;
  activo: boolean;
}

export default function TenantStatusToggle({ tenantId, activo }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant={activo ? "destructive" : "default"}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleTenantStatus(tenantId, !activo);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success(`Tenant ${!activo ? "activado" : "desactivado"}`);
        })
      }
    >
      {isPending ? "Procesando..." : activo ? "Desactivar" : "Activar"}
    </Button>
  );
}
