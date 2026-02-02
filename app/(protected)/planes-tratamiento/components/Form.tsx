"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

import { createPlanTratamiento, updatePlanTratamiento } from "../actions";
import { PlanTratamientoSchema, ESTADOS_PLAN } from "../schema";
import { Paciente } from "../../pacientes/schema";
import { Medico } from "../../medicos/schema";

interface Servicio {
  id: string;
  nombre: string;
  precioBase: number;
  duracionMin: number;
}

interface PlanFormularioProps {
  isUpdate: boolean;
  initialData?: z.infer<typeof PlanTratamientoSchema>;
  pacientes: Paciente[];
  servicios: Servicio[];
  medicos: Medico[];
  defaultPacienteId?: string;
}

export function PlanFormulario({
  isUpdate,
  initialData,
  pacientes,
  servicios,
  medicos,
  defaultPacienteId,
}: PlanFormularioProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof PlanTratamientoSchema>>({
    resolver: zodResolver(PlanTratamientoSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          fechaInicio:
            initialData.fechaInicio instanceof Date
              ? initialData.fechaInicio
              : new Date(initialData.fechaInicio),
          fechaFin:
            initialData.fechaFin instanceof Date
              ? initialData.fechaFin
              : initialData.fechaFin
                ? new Date(initialData.fechaFin)
                : null,
          etapas: initialData.etapas ?? [],
        }
      : {
          pacienteId: defaultPacienteId ?? "",
          nombre: "",
          descripcion: "",
          estado: "ACTIVO",
          fechaInicio: new Date(),
          fechaFin: null,
          medicoResponsableId: "",
          etapas: [],
        },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "etapas",
  });

  const handleAddEtapa = () => {
    append({
      servicioId: "",
      nombre: "",
      descripcion: "",
      orden: fields.length + 1,
      intervaloDias: 30,
      repeticiones: 1,
      programarCita: true,
      responsableMedicoId: "",
    });
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
      // Actualizar orden
      const etapas = form.getValues("etapas");
      etapas?.forEach((_, i) => {
        form.setValue(`etapas.${i}.orden`, i + 1);
      });
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
      // Actualizar orden
      const etapas = form.getValues("etapas");
      etapas?.forEach((_, i) => {
        form.setValue(`etapas.${i}.orden`, i + 1);
      });
    }
  };

  const handleServicioChange = (index: number, servicioId: string) => {
    const servicio = servicios.find((s) => s.id === servicioId);
    if (servicio) {
      form.setValue(`etapas.${index}.servicioId`, servicioId);
      form.setValue(`etapas.${index}.servicioNombre`, servicio.nombre);
      // Si el nombre está vacío, usar el nombre del servicio
      const currentName = form.getValues(`etapas.${index}.nombre`);
      if (!currentName) {
        form.setValue(`etapas.${index}.nombre`, servicio.nombre);
      }
    }
  };

  async function onSubmit(data: z.infer<typeof PlanTratamientoSchema>) {
    try {
      // Actualizar orden de etapas
      const planData = {
        ...data,
        etapas: data.etapas?.map((e, index) => ({
          ...e,
          orden: index + 1,
        })),
      };

      if (isUpdate && initialData?.id) {
        const result = await updatePlanTratamiento(initialData.id, planData);
        if (result.success) {
          toast.success("Plan actualizado correctamente");
          router.push("/planes-tratamiento");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createPlanTratamiento(planData);
        if (result.success) {
          toast.success("Plan creado correctamente. Se generaron los seguimientos.");
          router.push("/planes-tratamiento");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error("Error en la operación:", error);
      toast.error("Error al procesar el plan de tratamiento");
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 border rounded-md p-4"
    >
      {/* Datos principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Paciente */}
        <Controller
          name="pacienteId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Paciente</FieldLabel>
              <FieldContent>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id!}>
                        {p.nombre} {p.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>
                Selecciona el paciente para el plan.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Nombre del Plan */}
        <Controller
          name="nombre"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Nombre del Plan</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Ej: Brackets - Ortodoncia completa"
                  {...field}
                />
              </FieldContent>
              <FieldDescription>
                Nombre descriptivo del tratamiento.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Fecha Inicio */}
        <Controller
          name="fechaInicio"
          control={form.control}
          render={({ field, fieldState }) => {
            const dateValue =
              field.value instanceof Date
                ? field.value
                : field.value
                  ? new Date(field.value)
                  : undefined;

            return (
              <Field data-invalid={fieldState.invalid} className="flex flex-col">
                <FieldLabel>Fecha de Inicio</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !dateValue && "text-muted-foreground"
                      )}
                    >
                      {dateValue ? (
                        format(dateValue, "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateValue}
                      onSelect={field.onChange}
                    />
                  </PopoverContent>
                </Popover>
                <FieldDescription>Fecha de inicio del tratamiento.</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            );
          }}
        />

        {/* Estado */}
        <Controller
          name="estado"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
              <FieldContent>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_PLAN.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>Estado actual del plan.</FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Médico Responsable */}
        <Controller
          name="medicoResponsableId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Médico Responsable</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un médico (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicos.map((m) => (
                      <SelectItem key={m.idEmpleado} value={m.idEmpleado}>
                        {m.empleado?.nombre} {m.empleado?.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>
                Médico que lidera el tratamiento.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Descripción */}
        <Controller
          name="descripcion"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor={field.name}>Descripción</FieldLabel>
              <FieldContent>
                <Textarea
                  placeholder="Descripción del plan de tratamiento..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FieldContent>
              <FieldDescription>
                Notas adicionales sobre el plan (opcional).
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </div>

      {/* Etapas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Etapas del Tratamiento</CardTitle>
            <Button type="button" onClick={handleAddEtapa} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Agregar Etapa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay etapas agregadas. Haz clic en "Agregar Etapa" para comenzar.
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Etapa {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === fields.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Servicio */}
                      <Controller
                        name={`etapas.${index}.servicioId`}
                        control={form.control}
                        render={({ field: f }) => (
                          <div className="space-y-2">
                            <Label>Servicio</Label>
                            <Select
                              onValueChange={(value) =>
                                handleServicioChange(index, value)
                              }
                              value={f.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar servicio..." />
                              </SelectTrigger>
                              <SelectContent>
                                {servicios.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      />

                      {/* Nombre de la Etapa */}
                      <Controller
                        name={`etapas.${index}.nombre`}
                        control={form.control}
                        render={({ field: f }) => (
                          <div className="space-y-2">
                            <Label>Nombre de la Etapa</Label>
                            <Input
                              placeholder="Ej: Ajuste Mensual"
                              {...f}
                            />
                          </div>
                        )}
                      />

                      {/* Intervalo en días */}
                      <Controller
                        name={`etapas.${index}.intervaloDias`}
                        control={form.control}
                        render={({ field: f }) => (
                          <div className="space-y-2">
                            <Label>Intervalo (días)</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="30"
                              {...f}
                              value={f.value ?? ""}
                              onChange={(e) =>
                                f.onChange(
                                  e.target.value ? parseInt(e.target.value) : null
                                )
                              }
                            />
                          </div>
                        )}
                      />

                      {/* Repeticiones */}
                      <Controller
                        name={`etapas.${index}.repeticiones`}
                        control={form.control}
                        render={({ field: f }) => (
                          <div className="space-y-2">
                            <Label>Repeticiones</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              {...f}
                              value={f.value ?? ""}
                              onChange={(e) =>
                                f.onChange(
                                  e.target.value ? parseInt(e.target.value) : null
                                )
                              }
                            />
                          </div>
                        )}
                      />

                      {/* Médico responsable de la etapa */}
                      <Controller
                        name={`etapas.${index}.responsableMedicoId`}
                        control={form.control}
                        render={({ field: f }) => (
                          <div className="space-y-2">
                            <Label>Médico Responsable</Label>
                            <Select
                              onValueChange={f.onChange}
                              value={f.value || ""}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Opcional" />
                              </SelectTrigger>
                              <SelectContent>
                                {medicos.map((m) => (
                                  <SelectItem
                                    key={m.idEmpleado}
                                    value={m.idEmpleado}
                                  >
                                    {m.empleado?.nombre} {m.empleado?.apellido}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      />

                      {/* Programar Cita */}
                      <Controller
                        name={`etapas.${index}.programarCita`}
                        control={form.control}
                        render={({ field: f }) => (
                          <div className="flex items-center gap-3 pt-6">
                            <Switch
                              checked={f.value}
                              onCheckedChange={f.onChange}
                            />
                            <Label>Programar cita automatica</Label>
                          </div>
                        )}
                      />
                    </div>

                    {/* Descripción de la etapa */}
                    <Controller
                      name={`etapas.${index}.descripcion`}
                      control={form.control}
                      render={({ field: f }) => (
                        <div className="space-y-2">
                          <Label>Descripción</Label>
                          <Textarea
                            placeholder="Descripción de la etapa..."
                            {...f}
                            value={f.value ?? ""}
                          />
                        </div>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Guardando..."
            : isUpdate
              ? "Actualizar Plan"
              : "Crear Plan"}
        </Button>
      </div>
    </form>
  );
}
