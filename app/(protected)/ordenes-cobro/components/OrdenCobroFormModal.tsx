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
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { CreateOrdenCobroSchema } from "../schema";
import { createOrdenCobro } from "../actions";
import { toast } from "sonner";
import type { CreateOrdenCobroInput } from "../schema";

interface OrdenCobroFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId?: string;
  planTratamientoId?: string;
  financiamientoId?: string;
  consultaId?: string;
  seguimientoId?: string;
  pacientes?: { id: string; nombre: string; apellido: string }[];
  planes?: { id: string; nombre: string; pacienteId: string }[];
  financiamientos?: { id: string; pacienteId: string }[];
  onSuccess?: () => void;
}

export function OrdenCobroFormModal({
  open,
  onOpenChange,
  pacienteId: defaultPacienteId,
  planTratamientoId: defaultPlanId,
  financiamientoId: defaultFinId,
  consultaId,
  seguimientoId,
  pacientes = [],
  planes = [],
  financiamientos = [],
  onSuccess,
}: OrdenCobroFormModalProps) {
  const form = useForm<CreateOrdenCobroInput>({
    resolver: zodResolver(CreateOrdenCobroSchema),
    defaultValues: {
      pacienteId: defaultPacienteId ?? "",
      planTratamientoId: defaultPlanId ?? "",
      financiamientoId: defaultFinId ?? "",
      consultaId: consultaId ?? "",
      seguimientoId: seguimientoId ?? "",
      monto: 0,
      concepto: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        pacienteId: defaultPacienteId ?? "",
        planTratamientoId: defaultPlanId ?? "",
        financiamientoId: defaultFinId ?? "",
        consultaId: consultaId ?? "",
        seguimientoId: seguimientoId ?? "",
        monto: 0,
        concepto: "",
      });
    }
  }, [open, defaultPacienteId, defaultPlanId, defaultFinId, consultaId, seguimientoId, form]);

  const onSubmit = async (data: CreateOrdenCobroInput) => {
    const payload = {
      ...data,
      monto: Number(data.monto),
      pacienteId: data.pacienteId,
      planTratamientoId: data.planTratamientoId || null,
      financiamientoId: data.financiamientoId || null,
      consultaId: data.consultaId || null,
      seguimientoId: data.seguimientoId || null,
    };

    const result = await createOrdenCobro(payload);
    if (result.success) {
      toast.success("Orden de cobro creada");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  };

  const pacienteDisabled = Boolean(defaultPacienteId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Orden de Cobro</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!form.formState.errors.pacienteId}>
            <FieldLabel>Paciente</FieldLabel>
            <FieldContent>
              <Select
                value={form.watch("pacienteId")}
                onValueChange={(value) => form.setValue("pacienteId", value)}
                disabled={pacienteDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((paciente) => (
                    <SelectItem key={paciente.id} value={paciente.id}>
                      {paciente.nombre} {paciente.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
            {form.formState.errors.pacienteId && (
              <FieldError errors={[form.formState.errors.pacienteId]} />
            )}
          </Field>

          {planes.length > 0 && (
            <Field>
              <FieldLabel>Plan de tratamiento (opcional)</FieldLabel>
              <FieldContent>
                <Select
                  value={form.watch("planTratamientoId") || ""}
                  onValueChange={(value) => form.setValue("planTratamientoId", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planes.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}

          {financiamientos.length > 0 && (
            <Field>
              <FieldLabel>Financiamiento (opcional)</FieldLabel>
              <FieldContent>
                <Select
                  value={form.watch("financiamientoId") || ""}
                  onValueChange={(value) => form.setValue("financiamientoId", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un financiamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {financiamientos.map((fin) => (
                      <SelectItem key={fin.id} value={fin.id}>
                        Fin. #{fin.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}

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

          <Field data-invalid={!!form.formState.errors.concepto}>
            <FieldLabel>Concepto</FieldLabel>
            <FieldContent>
              <Textarea
                placeholder="Detalle del cobro"
                {...form.register("concepto")}
              />
            </FieldContent>
            {form.formState.errors.concepto && (
              <FieldError errors={[form.formState.errors.concepto]} />
            )}
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Guardando..." : "Crear orden"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
