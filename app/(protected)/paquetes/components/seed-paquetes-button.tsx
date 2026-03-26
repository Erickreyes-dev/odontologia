"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { seedRecommendedPaquetes } from "../actions";

export default function SeedPaquetesButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() =>
        startTransition(async () => {
          const result = await seedRecommendedPaquetes();
          if (!result.success) {
            toast.error(result.error);
            return;
          }

          if (result.created === 0) {
            toast.message("Los 3 paquetes sugeridos ya existen");
            return;
          }

          toast.success(`Se crearon ${result.created} paquetes sugeridos`);
        })
      }
      disabled={isPending}
    >
      {isPending ? "Generando..." : "Generar 3 paquetes sugeridos"}
    </Button>
  );
}
