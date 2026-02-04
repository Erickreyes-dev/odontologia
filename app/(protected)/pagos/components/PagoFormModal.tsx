"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { CreatePagoSchema, METODOS_PAGO } from "../schema";
import { createPago } from "../actions";
import { toast } from "sonner";
import type { CreatePagoInput } from "../schema";

interface PagoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monto?: number;
  ordenCobroId?: string;
  ordenesCobro: {
    id: string;
    pacienteNombre: string;
    monto: number;
    financiamientoId?: string | null;
  }[];
  financiamientos?: {
    id: string;
    pacienteId: string;
    pacienteNombre: string;
    cuotasLista?: { id: string; numero: number; monto: number; pagada: boolean }[];
  }[];
  onSuccess?: () => void;
}

export function PagoFormModal({
  open,
  onOpenChange,
  monto: defaultMonto,
  ordenCobroId: defaultOrdenCobroId,
  ordenesCobro,
  financiamientos = [],
  onSuccess,
}: PagoFormModalProps) {
  const form = useForm<CreatePagoInput>({
    resolver: zodResolver(CreatePagoSchema),
    defaultValues: {
      monto: defaultMonto ?? 0,
      metodo: "EFECTIVO",
      referencia: "",
      comentario: "",
      ordenCobroId: defaultOrdenCobroId ?? "",
      cuotaId: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        monto: defaultMonto ?? 0,
        metodo: "EFECTIVO",
        referencia: "",
        comentario: "",
        ordenCobroId: defaultOrdenCobroId ?? "",
        cuotaId: "",
      });
    }
  }, [open, defaultMonto, defaultOrdenCobroId, form]);

  const selectedOrdenId = form.watch("ordenCobroId");
  const selectedOrden = ordenesCobro.find((orden) => orden.id === selectedOrdenId);

  useEffect(() => {
    if (selectedOrden && !defaultMonto) {
      form.setValue("monto", selectedOrden.monto);
    }
  }, [selectedOrden, defaultMonto, form]);

  const cuotasDisponibles = selectedOrden?.financiamientoId
    ? financiamientos
        .find((f) => f.id === selectedOrden.financiamientoId)
        ?.cuotasLista?.filter((c) => !c.pagada) ?? []
    : [];

  const onSubmit = async (data: CreatePagoInput) => {
    const payload = {
      ...data,
      monto: Number(data.monto),
      ordenCobroId: data.ordenCobroId,
      cuotaId: data.cuotaId || null,
      referencia: data.referencia || null,
      comentario: data.comentario || null,
    };

    const result = await createPago(payload);
    if (result.success) {
      toast.success("Pago registrado correctamente");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!form.formState.errors.ordenCobroId}>
            <FieldLabel>Orden de cobro</FieldLabel>
            <FieldContent>
              <Select
                value={form.watch("ordenCobroId")}
                onValueChange={(value) => form.setValue("ordenCobroId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una orden" />
                </SelectTrigger>
                <SelectContent>
                  {ordenesCobro.map((orden) => (
                    <SelectItem key={orden.id} value={orden.id}>
                      {orden.pacienteNombre} · Orden #{orden.id.slice(0, 8)} · L {orden.monto.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
            {form.formState.errors.ordenCobroId && (
              <FieldError errors={[form.formState.errors.ordenCobroId]} />
            )}
          </Field>

          <Field data-invalid={!!form.formState.errors.monto}>
            <FieldLabel>Monto (L)</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...form.register("monto", { valueAsNumber: true })}
              />
            </FieldContent>
            {form.formState.errors.monto && (
              <FieldError errors={[form.formState.errors.monto]} />
            )}
          </Field>

          <Field data-invalid={!!form.formState.errors.metodo}>
            <FieldLabel>Método de pago</FieldLabel>
            <FieldContent>
              <Select
                value={form.watch("metodo")}
                onValueChange={(v) => form.setValue("metodo", v as CreatePagoInput["metodo"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Referencia (opcional)</FieldLabel>
            <FieldContent>
              <Input
                placeholder="No. de transacción, cheque..."
                {...form.register("referencia")}
              />
            </FieldContent>
          </Field>

          {cuotasDisponibles.length > 0 && (
            <Field>
              <FieldLabel>Cuota específica (opcional)</FieldLabel>
              <FieldDescription>
                Deje vacío para aplicar al siguiente pendiente
              </FieldDescription>
              <FieldContent>
                <Select
                  value={form.watch("cuotaId") || ""}
                  onValueChange={(v) => form.setValue("cuotaId", v || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las pendientes" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuotasDisponibles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        Cuota {c.numero} - L {c.monto.toLocaleString("es-HN")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}

          <Field>
            <FieldLabel>Comentario (opcional)</FieldLabel>
            <FieldContent>
              <Textarea
                placeholder="Notas adicionales"
                {...form.register("comentario")}
              />
            </FieldContent>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Guardando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
