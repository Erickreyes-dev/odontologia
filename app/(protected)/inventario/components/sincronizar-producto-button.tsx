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
import { sincronizarStockProducto } from "../actions";
import type { Producto } from "../schema";

interface SincronizarProductoButtonProps {
  producto: Pick<Producto, "id" | "nombre" | "stock">;
  variant?: "menu" | "button";
}

export function SincronizarProductoButton({ producto, variant = "menu" }: SincronizarProductoButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("productoId", producto.id ?? "");

    startTransition(async () => {
      const result = await sincronizarStockProducto(formData);
      if (result.success && "stockDespues" in result) {
        toast.success(
          `${producto.nombre}: stock sincronizado de ${result.inventarioInicial} a ${result.stockDespues} (${result.cantidadUsada} unidades en ${result.registros} registros).`
        );
        setOpen(false);
      } else {
        toast.error(result.error || "No se pudo sincronizar el producto");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "button" ? (
          <Button type="button" variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Sincronizar
          </Button>
        ) : (
          <button type="button" className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground">
            Sincronizar stock
          </button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sincronizar {producto.nombre}</DialogTitle>
          <DialogDescription>
            Indique el rango y el inventario inicial real para este producto. El sistema descontará únicamente la cantidad registrada en consultas dentro del rango.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="productoId" value={producto.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`fechaInicio-${producto.id}`}>Desde</Label>
              <Input id={`fechaInicio-${producto.id}`} name="fechaInicio" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`fechaFin-${producto.id}`}>Hasta</Label>
              <Input id={`fechaFin-${producto.id}`} name="fechaFin" type="date" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`inventarioInicial-${producto.id}`}>Inventario inicial</Label>
            <Input id={`inventarioInicial-${producto.id}`} name="inventarioInicial" type="number" min="0" step="1" defaultValue={producto.stock} required />
          </div>
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Fórmula: inventario inicial ingresado - cantidad usada registrada = stock final. No se usa el stock actual como base.
          </p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Sincronizando..." : "Sincronizar producto"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
