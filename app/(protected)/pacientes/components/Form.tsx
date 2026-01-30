"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createPaciente, updatePaciente } from "../actions";
import { PacienteSchema } from "../schema";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Seguro } from "../../seguros/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PacienteFormulario({
  isUpdate,
  initialData,
  seguros,
}: {
  isUpdate: boolean;
  initialData: z.infer<typeof PacienteSchema>;
  seguros?: Seguro[];
}) {
  const router = useRouter();

  const form = useForm<z.infer<typeof PacienteSchema>>({
    resolver: zodResolver(PacienteSchema),
    defaultValues: initialData,
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
          {
            description: "Los datos se guardaron correctamente.",
          }
        );
        router.push("/pacientes");
        router.refresh();
      } else {
        toast.error("Error", {
          description: result.error || "Intenta nuevamente más tarde.",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error inesperado", {
        description: "Intenta nuevamente más tarde.",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6  mx-auto px-4">

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Identidad */}
        <Controller
          name="identidad"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Identidad</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  placeholder="Número de identidad"
                  aria-invalid={fieldState.invalid}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Teléfono */}
        <Controller
          name="telefono"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Teléfono</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  placeholder="Número de teléfono"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Nombre */}
        <Controller
          name="nombre"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Nombre</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  placeholder="Nombre del paciente"
                />
              </FieldContent>
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
              <FieldLabel>Apellido</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  placeholder="Apellido del paciente"
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Fecha de nacimiento */}
        <Controller
          name="fechaNacimiento"
          control={form.control}
          render={({ field, fieldState }) => {
            const dateValue =
              field.value instanceof Date
                ? field.value
                : field.value
                  ? new Date(field.value)
                  : undefined;

            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Fecha de nacimiento</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full text-left font-normal",
                        !dateValue && "text-muted-foreground"
                      )}
                    >
                      {dateValue
                        ? format(dateValue, "PPP", { locale: es })
                        : "Selecciona una fecha"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-full p-0">
                    <Calendar
                      mode="single"
                      selected={dateValue}
                      onSelect={(date) => field.onChange(date ?? null)}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />

        {/* Género */}
        <Controller
          name="genero"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Género</FieldLabel>
              <FieldContent>
                <Select
                  value={field.value || ""}
                  onValueChange={(val) => field.onChange(val || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Correo */}
        <div className="col-span-1 sm:col-span-2">
          <Controller
            name="correo"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Correo electrónico</FieldLabel>
                <FieldContent>
                  <Input
                    type="email"
                    {...field}
                    value={field.value ?? ""}
                    placeholder="correo@ejemplo.com"
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FieldContent>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Dirección */}
        <div className="col-span-1 sm:col-span-2">
          <Controller
            name="direccion"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Dirección</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Dirección de residencia"
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FieldContent>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Seguro */}
        <Controller
          name="seguroId"
          control={form.control}
          render={({ field }) => (
            <select
              className="w-full border rounded-md h-9 px-2"
              value={field.value ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === "" ? null : val); // <-- aquí
              }}
            >
              <option value="">Sin seguro</option>
              {seguros?.map((seguro) => (
                <option key={seguro.id} value={seguro.id}>
                  {seguro.nombre}
                </option>
              ))}
            </select>
          )}
        />


        {/* Activo */}
        {
          isUpdate &&
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
              </Field>
            )}
          />
        }

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
