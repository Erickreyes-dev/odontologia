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
import { Switch } from "@/components/ui/switch";
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
import { PacienteSchema } from "../schema";
import { createPaciente, updatePaciente } from "../actions";
import { Seguro } from "../../seguros/schema";

export function PacienteFormulario({
  isUpdate,
  initialData,
  seguros,
}: {
  isUpdate: boolean;
  initialData: z.infer<typeof PacienteSchema>;
  seguros: Seguro[];
}) {
  const router = useRouter();

  const form = useForm<z.infer<typeof PacienteSchema>>({
    resolver: zodResolver(PacienteSchema),
    defaultValues: {
      ...initialData,
      fechaNacimiento:
        initialData.fechaNacimiento instanceof Date
          ? initialData.fechaNacimiento
          : initialData.fechaNacimiento
            ? new Date(initialData.fechaNacimiento as unknown as string)
            : null,
    },
  });

  async function onSubmit(data: z.infer<typeof PacienteSchema>) {
    try {
      let result;
      if (isUpdate) {
        if (!data.id) {
          toast.error("Error", {
            description: "ID del paciente no encontrado.",
          });
          return;
        }
        result = await updatePaciente(data.id, data);
      } else {
        result = await createPaciente(data);
      }

      if (result.success) {
        toast.success(
          isUpdate ? "Paciente actualizado" : "Paciente creado",
          { description: "Los datos se guardaron correctamente." }
        );
        router.push("/pacientes");
        router.refresh();
      } else {
        toast.error("Error", { description: result.error || "Intenta nuevamente." });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error inesperado", { description: "Intenta nuevamente más tarde." });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mx-auto px-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Nombre */}
        <Controller
          name="nombre"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Ingresa el nombre"
                />
              </FieldContent>
              <FieldDescription>Nombre del paciente.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Apellido */}
        <Controller
          name="apellido"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Apellido</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Ingresa el apellido"
                />
              </FieldContent>
              <FieldDescription>Apellido del paciente.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Identidad */}
        <Controller
          name="identidad"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Identidad</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Ej. 0801-1999-00001"
                />
              </FieldContent>
              <FieldDescription>Documento de identidad del paciente.</FieldDescription>
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
                <FieldDescription>Fecha de nacimiento del paciente.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />

        {/* Genero */}
        <Controller
          control={form.control}
          name="genero"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Genero</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un genero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>Indica el genero del paciente.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Telefono */}
        <Controller
          name="telefono"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Telefono</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  value={field.value || ""}
                  id={field.name}
                  placeholder="Ej. 9999-9999"
                />
              </FieldContent>
              <FieldDescription>Numero de telefono del paciente.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Correo */}
        <Controller
          name="correo"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Correo electronico</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  value={field.value || ""}
                  id={field.name}
                  type="email"
                  placeholder="correo@ejemplo.com"
                />
              </FieldContent>
              <FieldDescription>Correo electronico del paciente.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Direccion */}
        <Controller
          name="direccion"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Direccion</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  value={field.value || ""}
                  id={field.name}
                  placeholder="Direccion del paciente"
                />
              </FieldContent>
              <FieldDescription>Direccion de residencia.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Seguro */}
        <Controller
          name="seguroId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Seguro</FieldLabel>
              <FieldContent>
                <Select
                  value={field.value || ""}
                  onValueChange={(val) => field.onChange(val || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un seguro (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin seguro</SelectItem>
                    {seguros.map(seg => (
                      <SelectItem key={seg.id} value={seg.id!}>
                        {seg.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>Seguro medico del paciente (opcional).</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Activo */}
        {isUpdate && (
          <Controller
            name="activo"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Paciente activo</FieldLabel>
                <FieldContent>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FieldContent>
                <FieldDescription>Indica si el paciente esta activo.</FieldDescription>
              </Field>
            )}
          />
        )}

      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {isUpdate ? "Actualizar paciente" : "Crear paciente"}
      </Button>
    </form>
  );
}
