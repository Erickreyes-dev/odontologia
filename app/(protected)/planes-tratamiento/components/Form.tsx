"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, Resolver, useFieldArray, useForm } from "react-hook-form";
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

type PlanFormValues = z.infer<typeof PlanTratamientoSchema>;

const form = useForm<PlanFormValues>({
  resolver: zodResolver(PlanTratamientoSchema) as Resolver<PlanFormValues>,
  defaultValues: initialData
    ? {
        ...initialData,
        // Forzamos campos que podrían ser undefined/null a sus tipos estrictos
        descripcion: initialData.descripcion ?? null,
        medicoResponsableId: initialData.medicoResponsableId ?? null,
        estado: initialData.estado,
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
        
        // MAPEADO EXPLÍCITO DE ETAPAS (Esto resuelve el error de 'orden')
        etapas: (initialData.etapas ?? []).map((etapa) => ({
          id: etapa.id,
          planId: etapa.planId,
          servicios: etapa.servicios?.length
            ? etapa.servicios.map((servicio) => ({
                id: servicio.id,
                servicioId: servicio.servicioId,
                precioAplicado: servicio.precioAplicado,
                cantidad: servicio.cantidad,
                servicioNombre: servicio.servicioNombre,
              }))
            : [],
          nombre: etapa.nombre,
          descripcion: etapa.descripcion ?? null,
          // Aquí está la solución al error: aseguramos que 'orden' sea siempre number
          orden: typeof etapa.orden === "number" && etapa.orden >= 1 ? etapa.orden : 1, 
          intervaloDias: etapa.intervaloDias ?? null,
          repeticiones: etapa.repeticiones ?? null,
          // Aseguramos que programarCita sea boolean, no undefined
          programarCita: !!etapa.programarCita, 
          responsableMedicoId: etapa.responsableMedicoId ?? null,
          crearDesdeConsultaId: etapa.crearDesdeConsultaId ?? null,
        })),
      }
    : {
        pacienteId: defaultPacienteId ?? "",
        nombre: "",
        descripcion: null,
        estado: "ACTIVO",
        fechaInicio: new Date(),
        fechaFin: null,
        medicoResponsableId: null,
        etapas: [],
      },
});


  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "etapas",
  });

  const handleAddEtapa = () => {
    append({
      servicios: [{ servicioId: "", precioAplicado: 0, cantidad: 1 }],
      nombre: "",
      descripcion: null,
      orden: fields.length + 1,
      intervaloDias: 30,
      repeticiones: 1,
      programarCita: true,
      responsableMedicoId: null,
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

  const handleServicioChange = (
    etapaIndex: number,
    servicioIndex: number,
    servicioId: string
  ) => {
    const servicio = servicios.find((s) => s.id === servicioId);
    if (servicio) {
      form.setValue(`etapas.${etapaIndex}.servicios.${servicioIndex}.servicioId`, servicioId);
      form.setValue(
        `etapas.${etapaIndex}.servicios.${servicioIndex}.servicioNombre`,
        servicio.nombre
      );
      form.setValue(
        `etapas.${etapaIndex}.servicios.${servicioIndex}.precioAplicado`,
        servicio.precioBase
      );
      const currentName = form.getValues(`etapas.${etapaIndex}.nombre`);
      if (!currentName) {
        form.setValue(`etapas.${etapaIndex}.nombre`, servicio.nombre);
      }
    }
  };

  const handleAddServicio = (etapaIndex: number) => {
    const serviciosActuales = form.getValues(`etapas.${etapaIndex}.servicios`) ?? [];
    form.setValue(`etapas.${etapaIndex}.servicios`, [
      ...serviciosActuales,
      { servicioId: "", precioAplicado: 0, cantidad: 1 },
    ]);
  };

  const handleRemoveServicio = (etapaIndex: number, servicioIndex: number) => {
    const serviciosActuales = form.getValues(`etapas.${etapaIndex}.servicios`) ?? [];
    form.setValue(
      `etapas.${etapaIndex}.servicios`,
      serviciosActuales.filter((_, index) => index !== servicioIndex)
    );
  };

  async function onSubmit(data: PlanFormValues) {
    try {
      // Actualizar orden de etapas y convertir "" a null para FKs opcionales
      const planData = {
        ...data,
        medicoResponsableId: data.medicoResponsableId || null,
        etapas: data.etapas?.map((e, index) => ({
          ...e,
          orden: index + 1,
          responsableMedicoId: e.responsableMedicoId || null,
          servicios: e.servicios?.map((servicio) => ({
            ...servicio,
            precioAplicado: Number(servicio.precioAplicado),
            cantidad: Number(servicio.cantidad),
          })),
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
              No hay etapas agregadas. Haz clic en &quot;Agregar Etapa&quot; para comenzar.
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Servicios de la etapa</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddServicio(index)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar servicio
                        </Button>
                      </div>
                      {(form.watch(`etapas.${index}.servicios`) ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Agrega al menos un servicio para esta etapa.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {(form.watch(`etapas.${index}.servicios`) ?? []).map(
                            (_servicio, servicioIndex) => (
                              <div
                                key={`${field.id}-servicio-${servicioIndex}`}
                                className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-md border p-3"
                              >
                                <Controller
                                  name={`etapas.${index}.servicios.${servicioIndex}.servicioId`}
                                  control={form.control}
                                  render={({ field: f }) => (
                                    <div className="space-y-2 md:col-span-2">
                                      <Label>Servicio</Label>
                                      <Select
                                        onValueChange={(value) =>
                                          handleServicioChange(index, servicioIndex, value)
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
                                <Controller
                                  name={`etapas.${index}.servicios.${servicioIndex}.precioAplicado`}
                                  control={form.control}
                                  render={({ field: f }) => (
                                    <div className="space-y-2">
                                      <Label>Precio (L)</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...f}
                                        value={f.value ?? ""}
                                        onChange={(event) =>
                                          f.onChange(
                                            event.target.value
                                              ? parseFloat(event.target.value)
                                              : 0
                                          )
                                        }
                                      />
                                    </div>
                                  )}
                                />
                                <Controller
                                  name={`etapas.${index}.servicios.${servicioIndex}.cantidad`}
                                  control={form.control}
                                  render={({ field: f }) => (
                                    <div className="space-y-2">
                                      <Label>Cantidad</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        {...f}
                                        value={f.value ?? ""}
                                        onChange={(event) =>
                                          f.onChange(
                                            event.target.value
                                              ? parseInt(event.target.value, 10)
                                              : 1
                                          )
                                        }
                                      />
                                    </div>
                                  )}
                                />
                                <div className="flex items-end justify-end md:col-span-4">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveServicio(index, servicioIndex)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              min="0"
                              placeholder="0"
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
