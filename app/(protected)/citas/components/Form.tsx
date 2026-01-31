"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { CitaSchema, ESTADOS_CITA } from "../schema";
import { createCita, updateCita } from "../actions";
import { Paciente } from "../../pacientes/schema";
import { Medico } from "../../medicos/schema";
import { Consultorio } from "../../consultorios/schema";

interface CitaFormularioProps {
  isUpdate: boolean;
  initialData: z.infer<typeof CitaSchema>;
  pacientes: Paciente[];
  medicos: Medico[];
  consultorios: Consultorio[];
  defaultPacienteId?: string;
}

export function CitaFormulario({
  isUpdate,
  initialData,
  pacientes,
  medicos,
  consultorios,
  defaultPacienteId,
}: CitaFormularioProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof CitaSchema>>({
    resolver: zodResolver(CitaSchema),
    defaultValues: {
      ...initialData,
      pacienteId: defaultPacienteId || initialData.pacienteId,
      fechaHora:
        initialData.fechaHora instanceof Date
          ? initialData.fechaHora
          : initialData.fechaHora
            ? new Date(initialData.fechaHora as unknown as string)
            : new Date(),
    },
  });

  async function onSubmit(data: z.infer<typeof CitaSchema>) {
    try {
      let result;
      if (isUpdate) {
        if (!data.id) {
          toast.error("Error", {
            description: "ID de la cita no encontrado.",
          });
          return;
        }
        result = await updateCita(data.id, data);
      } else {
        result = await createCita(data);
      }

      if (result.success) {
        toast.success(isUpdate ? "Cita actualizada" : "Cita creada", {
          description: "Los datos se guardaron correctamente.",
        });
        router.push("/citas");
        router.refresh();
      } else {
        toast.error("Error", {
          description: result.error || "Intenta nuevamente.",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error inesperado", {
        description: "Intenta nuevamente mas tarde.",
      });
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 mx-auto px-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Paciente */}
        <Controller
          name="pacienteId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Paciente</FieldLabel>
              <FieldContent>
                <Select
                  value={field.value || ""}
                  onValueChange={(val) => field.onChange(val || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id!}>
                        {p.nombre} {p.apellido} - {p.identidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>
                Selecciona el paciente para la cita.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Medico */}
        <Controller
          name="medicoId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Medico</FieldLabel>
              <FieldContent>
                <Select
                  value={field.value || ""}
                  onValueChange={(val) => field.onChange(val || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un medico" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicos.map((m) => (
                      <SelectItem key={m.idEmpleado} value={m.idEmpleado}>
                        {m.empleado
                          ? `${m.empleado.nombre} ${m.empleado.apellido}`
                          : m.idEmpleado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>
                Selecciona el medico que atendera.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Consultorio */}
        <Controller
          name="consultorioId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Consultorio</FieldLabel>
              <FieldContent>
                <Select
                  value={field.value || ""}
                  onValueChange={(val) => field.onChange(val || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un consultorio" />
                  </SelectTrigger>
                  <SelectContent>
                    {consultorios.map((c) => (
                      <SelectItem key={c.id} value={c.id!}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>
                Consultorio donde se realizara la cita.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Fecha y Hora */}
        <Controller
          control={form.control}
          name="fechaHora"
          render={({ field, fieldState }) => {
            const dateValue =
              field.value instanceof Date
                ? field.value
                : field.value
                  ? new Date(field.value)
                  : undefined;

            return (
              <Field
                data-invalid={fieldState.invalid}
                className="flex flex-col"
              >
                <FieldLabel>Fecha y Hora</FieldLabel>
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
                      onSelect={(date) => {
                        if (date) {
                          // Mantener la hora si ya existe
                          const currentTime = dateValue || new Date();
                          date.setHours(currentTime.getHours());
                          date.setMinutes(currentTime.getMinutes());
                          field.onChange(date);
                        }
                      }}
                      disabled={(date) => date < new Date("1900-01-01")}
                    />
                  </PopoverContent>
                </Popover>
                <FieldDescription>
                  Fecha programada para la cita.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            );
          }}
        />

        {/* Hora */}
        <Controller
          control={form.control}
          name="fechaHora"
          render={({ field, fieldState }) => {
            const dateValue =
              field.value instanceof Date
                ? field.value
                : field.value
                  ? new Date(field.value)
                  : new Date();

            const timeValue = format(dateValue, "HH:mm");

            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Hora</FieldLabel>
                <FieldContent>
                  <Input
                    type="time"
                    value={timeValue}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value
                        .split(":")
                        .map(Number);
                      const newDate = new Date(dateValue);
                      newDate.setHours(hours);
                      newDate.setMinutes(minutes);
                      field.onChange(newDate);
                    }}
                  />
                </FieldContent>
                <FieldDescription>Hora de la cita.</FieldDescription>
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
              <FieldLabel>Estado</FieldLabel>
              <FieldContent>
                <Select
                  value={field.value || ""}
                  onValueChange={(val) => field.onChange(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CITA.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>Estado actual de la cita.</FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Motivo */}
        <Controller
          name="motivo"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor={field.name}>Motivo de la cita</FieldLabel>
              <FieldContent>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  id={field.name}
                  placeholder="Describe el motivo de la cita..."
                  rows={2}
                />
              </FieldContent>
              <FieldDescription>
                Motivo o razon de la consulta (opcional).
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Observacion */}
        <Controller
          name="observacion"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor={field.name}>Observaciones</FieldLabel>
              <FieldContent>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  id={field.name}
                  placeholder="Observaciones adicionales..."
                  rows={2}
                />
              </FieldContent>
              <FieldDescription>
                Notas u observaciones adicionales (opcional).
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {isUpdate ? "Actualizar cita" : "Crear cita"}
      </Button>
    </form>
  );
}
