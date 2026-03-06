"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { togglePaqueteStatus } from "../actions";

interface Props {
  paqueteId: string;
  activo: boolean;
}

export default function PaqueteStatusToggle({ paqueteId, activo }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant={activo ? "destructive" : "default"}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await togglePaqueteStatus(paqueteId, !activo);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success(`Paquete ${!activo ? "activado" : "desactivado"}`);
        })
      }
    >
      {isPending ? "Procesando..." : activo ? "Desactivar" : "Activar"}
    </Button>
  );
}
