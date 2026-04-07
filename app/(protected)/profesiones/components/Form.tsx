"use client";

import { zodResolver } from "@hookform/resolvers/zod"; // Usamos el resolutor de Zod
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createProfesion, updateProfesion } from "../actions"; // Tu función para enviar datos
import { ProfesionSchema } from "../schema"; // Tu esquema de Zod para profesion
import { Field, FieldContent, FieldDescription, FieldLabel, FieldError } from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
export function ProfesionFormulario({
  isUpdate,
  initialData,
  redirectAfterSave = "/profesiones",
}: {
  isUpdate: boolean;
  initialData: z.infer<typeof ProfesionSchema>;
  redirectAfterSave?: string;
}) {
  const router = useRouter();

  // Usamos Zod para resolver la validación
  const form = useForm<z.infer<typeof ProfesionSchema>>({
    resolver: zodResolver(ProfesionSchema),
    defaultValues: initialData,
  });

;
  
  async function onSubmit(data: z.infer<typeof ProfesionSchema>) {
    try {
      let result;
      if (isUpdate) {
        if (!data.id) {
          toast.error("Error", {
            description: "ID de la profesion no encontrado.",
          });
          return;
        }
        result = await updateProfesion(data.id, data);
      } else {
        result = await createProfesion(data);
      }

      if (result.success) {
        // Notificación de éxito
        toast.success(
          isUpdate ? "Actualización Exitosa" : "Creación Exitosa", {
          description: isUpdate
            ? "La profesion ha sido actualizado correctamente."
            : "La profesion ha sido creado correctamente.",
        });

        router.push(redirectAfterSave);
        router.refresh();
      } else {
        // Notificación de error con mensaje específico
        toast.error(
          isUpdate ? "Error al actualizar la profesion" : "Error al crear la profesión", {
          description: result.error || "Por favor, intenta nuevamente más tarde.",
        });
      }
    } catch (error) {
      console.error("Error en la operación:", error);
      toast.error(
        isUpdate ? "Error al actualizar la profesión" : "Error al crear la profesión", {
        description: "Por favor, intenta nuevamente más tarde.",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <Controller
        name="nombre"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Nombre de la profesión</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                type="text"
                placeholder="Ingresa el nombre de la profesión"
              />
            </FieldContent>
            <FieldDescription>Agrega el nombre de la profesión.</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="descripcion"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Descripción de la profesión</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                type="text"
                placeholder="Ingresa la descripción de la profesión"
              />
            </FieldContent>
            <FieldDescription>Agrega la descripción de la profesión.</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {
        isUpdate && (<Controller
          name="activo"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Estado de la profesión</FieldLabel>
              <FieldContent>
                <Switch
                  id={field.name}
                  checked={field.value} // boolean ✅
                  onCheckedChange={(val: boolean) => field.onChange(val)} // recibe boolean
                  disabled={field.disabled}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </FieldContent>
              <FieldDescription>Indica si la profesion está activo o inactivo.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />)
      }


      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {isUpdate ? "Actualizar la profesión" : "Crear la profesión"}
      </Button>




    </form>
  );
}
