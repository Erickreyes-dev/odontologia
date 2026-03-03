"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleTenantStatus } from "../actions";

type Props = {
  tenantId: string;
  activo: boolean;
};

export default function TenantStatusToggle({ tenantId, activo }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onToggle = () => {
    setError(null);
    startTransition(async () => {
      const result = await toggleTenantStatus(tenantId, !activo);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="mt-2">
      <Button type="button" size="sm" variant={activo ? "destructive" : "default"} onClick={onToggle} disabled={isPending}>
        {isPending ? "Guardando..." : activo ? "Inhabilitar tenant" : "Habilitar tenant"}
      </Button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
