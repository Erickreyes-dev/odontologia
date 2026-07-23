"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sincronizarStockInventario } from "../actions";

export function SincronizarInventarioButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await sincronizarStockInventario(formData);
      if (result.success) {
        toast.success(`Inventario sincronizado: ${result.productosActualizados} productos ajustados (${result.totalDescontado} unidades descontadas).`);
        setOpen(false);
      } else {
        toast.error(result.error || "No se pudo sincronizar el inventario");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 md:w-auto">
          <RefreshCw className="h-4 w-4" />
          Sincronizar stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sincronizar stock desde consultas</DialogTitle>
          <DialogDescription>
            Usa el stock actual como la cantidad ingresada por última vez y descuenta los productos registrados en consultas dentro del rango seleccionado.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Desde</Label>
              <Input id="fechaInicio" name="fechaInicio" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaFin">Hasta</Label>
              <Input id="fechaFin" name="fechaFin" type="date" required />
            </div>
          </div>
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Recomendación: seleccione desde la fecha de la última entrada de inventario hasta hoy. La acción queda registrada en reportería.
          </p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Sincronizando..." : "Sincronizar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
