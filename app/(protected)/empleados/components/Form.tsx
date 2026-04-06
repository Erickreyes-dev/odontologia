"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";

import { z } from "zod";
import { Puesto } from "../../puestos/schema";
import { createEmpleado, updateEmpleado } from "../actions";
import { EmpleadoSchema } from "../schema";
import { toast } from "sonner";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function EmpleadoFormulario({
  isUpdate,
  initialData,
  puestos,
  redirectAfterSave = "/empleados",
}: {
  isUpdate: boolean;
  initialData?: z.infer<typeof EmpleadoSchema>;
  puestos: Puesto[];
  redirectAfterSave?: string;
}) {
  const router = useRouter();

  const form = useForm<z.infer<typeof EmpleadoSchema>>({
    resolver: zodResolver(EmpleadoSchema),
    defaultValues: initialData
      ? {
        ...initialData,
        fechaNacimiento:
          initialData.fechaNacimiento instanceof Date
            ? initialData.fechaNacimiento
            : initialData.fechaNacimiento
              ? new Date(initialData.fechaNacimiento as unknown as string)
              : undefined,
        fechaIngreso:
          initialData.fechaIngreso instanceof Date
            ? initialData.fechaIngreso
            : initialData.fechaIngreso
              ? new Date(initialData.fechaIngreso as unknown as string)
              : undefined,
      }
      : {},
  });


  async function onSubmit(data: z.infer<typeof EmpleadoSchema>) {
    // Verificación de validez antes del submit
    const empleadoData = {
      id: initialData?.id,
      empleado: data,
    };

    try {
      if (isUpdate) {
        await updateEmpleado(empleadoData.id!, empleadoData.empleado);
        toast.success("Empleado actualizado correctamente");
      } else {
        await createEmpleado(empleadoData.empleado);
        toast.success("Empleado creado correctamente");
      }

      router.push(redirectAfterSave);
      router.refresh();
    } catch (error) {
      console.error("Error en la operación:", error);
      toast.error("Error al crear o actualizar el empleado");
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 border rounded-md p-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nombre */}
        <Controller
          name="nombre"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
              <FieldContent>
                <Input placeholder="Ingresa tu nombre" {...field} />
              </FieldContent>
              <FieldDescription>Por favor ingresa tu nombre completo.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {/* Apellido */}
        <Controller
          control={form.control}
          name="apellido"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Apellido</FieldLabel>
              <FieldContent>
                <Input placeholder="Ingresa tu apellido" {...field} />
              </FieldContent>
              <FieldDescription>Por favor ingresa tu apellido.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Número de Identificación */}
        <Controller
          control={form.control}
          name="identidad"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Número de Identificación</FieldLabel>
              <FieldContent>
                <Input placeholder="Ej. 0801-1999-00001" {...field} />
              </FieldContent>
              <FieldDescription>Documento o cédula del empleado.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Correo */}
        <Controller
          control={form.control}
          name="correo"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Correo electrónico</FieldLabel>
              <FieldContent>
                <Input type="email" placeholder="Ingresa tu correo" {...field} />
              </FieldContent>
              <FieldDescription>Debe ser un correo válido.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Fecha de Nacimiento */}
        <Controller
          control={form.control}
          name="fechaNacimiento"
          render={({ field, fieldState }) => {
            const dateValue =
              field.value instanceof Date
                ? field.value
                : field.value
                  ? new Date(field.value)
                  : undefined;

            return (
              <Field data-invalid={fieldState.invalid} className="flex flex-col">
                <FieldLabel>Fecha de nacimiento</FieldLabel>
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
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>

                <FieldDescription>
                  Fecha de nacimiento del empleado.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />

        {/* Fecha de Ingreso */}
        <Controller
          control={form.control}
          name="fechaIngreso"
          render={({ field, fieldState }) => {
            const dateValue =
              field.value instanceof Date
                ? field.value
                : field.value
                  ? new Date(field.value)
                  : undefined;

            return (
              <Field data-invalid={fieldState.invalid} className="flex flex-col">
                <FieldLabel>Fecha de ingreso</FieldLabel>
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
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>

                <FieldDescription>
                  Fecha en que ingresó a la empresa.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />



        {/* Teléfono */}
        <Controller
          control={form.control}
          name="telefono"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Teléfono</FieldLabel>
              <FieldContent>
                <Input placeholder="Ej. 9999-9999" {...field} />
              </FieldContent>
              <FieldDescription>Número de teléfono móvil o fijo.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />


        {/* Vacaciones */}
        <Controller
          control={form.control}
          name="vacaciones"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Días de vacaciones</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  {...field}
                  onChange={(e) => {
                    // Convertimos el string a número antes de pasarlo a Zod
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : Number(val));
                  }}
                />
              </FieldContent>
              <FieldDescription>Cantidad de días de vacaciones.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Género */}
        <Controller
          control={form.control}
          name="genero"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Género</FieldLabel>
              <FieldContent>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>Indica tu género.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Puesto */}
        <Controller
          control={form.control}
          name="puesto_id"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Puesto</FieldLabel>
              <FieldContent>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un puesto" />
                  </SelectTrigger>
                  <SelectContent>
                    {puestos.map((puestoItem) => (
                      <SelectItem key={puestoItem.id} value={puestoItem.id || ""}>
                        {puestoItem.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>Selecciona el puesto del empleado.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

      </div>

      {/* Estado Activo (solo actualización) */}
      {isUpdate && (
        <Controller
          control={form.control}
          name="activo"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(value) => field.onChange(value === "true")}
                  defaultValue={field.value ? "true" : "false"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>
                Define si el empleado está activo o inactivo.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}

      {/* Botón Enviar */}
      <div className="flex justify-end">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : isUpdate ? (
            "Actualizar"
          ) : (
            "Crear"
          )}
        </Button>
      </div>
    </form>
  );
}
