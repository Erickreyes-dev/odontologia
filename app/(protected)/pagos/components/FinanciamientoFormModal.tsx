"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { CreateFinanciamientoSchema } from "../schema";
import { createFinanciamiento } from "../actions";
import { toast } from "sonner";
import type { CreateFinanciamientoInput } from "../schema";

interface FinanciamientoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId?: string;
  cotizacionId?: string;
  planTratamientoId?: string;
  pacientes: { id: string; nombre: string; apellido: string }[];
  cotizaciones?: { id: string; total: number; pacienteNombre: string; pacienteId: string }[];
  planes?: { id: string; nombre: string; pacienteNombre: string; pacienteId: string; montoTotal: number }[];
  onSuccess?: () => void;
}

export function FinanciamientoFormModal({
  open,
  onOpenChange,
  pacienteId: defaultPacienteId,
  cotizacionId: defaultCotizacionId,
  planTratamientoId: defaultPlanTratamientoId,
  pacientes,
  cotizaciones = [],
  planes = [],
  onSuccess,
}: FinanciamientoFormModalProps) {
  const form = useForm<CreateFinanciamientoInput>({
    resolver: zodResolver(CreateFinanciamientoSchema),
    defaultValues: {
      pacienteId: defaultPacienteId ?? "",
      cotizacionId: defaultCotizacionId ?? undefined,
      planTratamientoId: defaultPlanTratamientoId ?? undefined,
      montoTotal: 0,
      anticipo: 0,
      cuotas: 1,
      interes: 0,
      fechaInicio: new Date(),
    },
  });

  // Observadores de estado
  const selectedPacienteId = form.watch("pacienteId");
  const selectedCotizacionId = form.watch("cotizacionId");
  const selectedPlanId = form.watch("planTratamientoId");

  // Resetear el formulario al abrir el modal
  useEffect(() => {
    if (open) {
      form.reset({
        pacienteId: defaultPacienteId ?? "",
        cotizacionId: defaultCotizacionId ?? undefined,
        planTratamientoId: defaultPlanTratamientoId ?? undefined,
        montoTotal: 0,
        anticipo: 0,
        cuotas: 1,
        interes: 0,
        fechaInicio: new Date(),
      });
    }
  }, [open, defaultPacienteId, defaultCotizacionId, defaultPlanTratamientoId, form]);

  // Filtrado de datos con normalización de IDs para evitar errores de tipo
  const cotizacionesFiltradas = useMemo(() => {
    if (!selectedPacienteId) return [];
    return cotizaciones.filter(c => String(c.pacienteId) === String(selectedPacienteId));
  }, [selectedPacienteId, cotizaciones]);

  const planesFiltrados = useMemo(() => {
    if (!selectedPacienteId) return [];
    return planes.filter(p => String(p.pacienteId) === String(selectedPacienteId));
  }, [selectedPacienteId, planes]);

  useEffect(() => {
    if (selectedPlanId) {
      const plan = planes.find((p) => p.id === selectedPlanId);
      if (plan) {
        form.setValue("montoTotal", plan.montoTotal);
      }
      return;
    }

    if (selectedCotizacionId) {
      const cotizacion = cotizaciones.find((c) => c.id === selectedCotizacionId);
      if (cotizacion) {
        form.setValue("montoTotal", cotizacion.total);
      }
    }
  }, [selectedPlanId, selectedCotizacionId, planes, cotizaciones, form]);

  const onSubmit = async (data: CreateFinanciamientoInput) => {
    const payload = {
      ...data,
      cotizacionId: data.cotizacionId || null,
      planTratamientoId: data.planTratamientoId || null,
    };

    const result = await createFinanciamiento(payload);
    if (result.success) {
      toast.success("Financiamiento creado con éxito");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Financiamiento</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Paciente */}
            <Field data-invalid={!!form.formState.errors.pacienteId}>
              <FieldLabel>Paciente</FieldLabel>
              <FieldContent>
                <Select
                  value={selectedPacienteId || ""}
                  onValueChange={(v) => {
                    form.setValue("pacienteId", v);
                    form.setValue("cotizacionId", undefined);
                    form.setValue("planTratamientoId", undefined);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} {p.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              {form.formState.errors.pacienteId && <FieldError errors={[form.formState.errors.pacienteId]} />}
            </Field>

            {/* Cotización - Se usa key para forzar el refresco al cambiar paciente */}
            <Field>
              <FieldLabel>Cotización (opcional)</FieldLabel>
              <FieldContent>
                <Select
                  key={`cot-select-${selectedPacienteId}`}
                  value={selectedCotizacionId || "none"}
                  onValueChange={(v) => form.setValue("cotizacionId", v === "none" ? undefined : v)}
                  disabled={!selectedPacienteId}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        !selectedPacienteId 
                        ? "Seleccione un paciente" 
                        : cotizacionesFiltradas.length === 0 
                          ? "Sin cotizaciones" 
                          : "Vincular cotización"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna / Manual</SelectItem>
                    {cotizacionesFiltradas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        Cotización L {c.total.toLocaleString("es-HN")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            {/* Plan de Tratamiento */}
            <Field>
              <FieldLabel>Plan de tratamiento (opcional)</FieldLabel>
              <FieldContent>
                <Select
                  key={`plan-select-${selectedPacienteId}`}
                  value={form.watch("planTratamientoId") || "none"}
                  onValueChange={(v) => form.setValue("planTratamientoId", v === "none" ? undefined : v)}
                  disabled={!selectedPacienteId}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        !selectedPacienteId 
                        ? "Seleccione un paciente" 
                        : planesFiltrados.length === 0 
                          ? "Sin planes" 
                          : "Vincular plan"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {planesFiltrados.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} (L {p.montoTotal.toLocaleString("es-HN")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            {/* Monto Total */}
            <Field data-invalid={!!form.formState.errors.montoTotal}>
              <FieldLabel>Monto total (L)</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("montoTotal", { valueAsNumber: true })}
                />
              </FieldContent>
            </Field>

            {/* Anticipo */}
            <Field data-invalid={!!form.formState.errors.anticipo}>
              <FieldLabel>Anticipo (L)</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("anticipo", { valueAsNumber: true })}
                />
              </FieldContent>
            </Field>

            {/* Cuotas */}
            <Field data-invalid={!!form.formState.errors.cuotas}>
              <FieldLabel>Número de cuotas</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  {...form.register("cuotas", { valueAsNumber: true })}
                />
              </FieldContent>
            </Field>

            {/* Interés */}
            <Field>
              <FieldLabel>Interés (%)</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("interes", { valueAsNumber: true })}
                />
              </FieldContent>
            </Field>

            {/* Fecha de inicio */}
            <Field data-invalid={!!form.formState.errors.fechaInicio}>
              <FieldLabel>Fecha de inicio</FieldLabel>
              <FieldContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("fechaInicio") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("fechaInicio") ? (
                        format(form.watch("fechaInicio"), "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch("fechaInicio")}
                      onSelect={(d) => d && form.setValue("fechaInicio", d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FieldContent>
            </Field>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creando..." : "Crear financiamiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
