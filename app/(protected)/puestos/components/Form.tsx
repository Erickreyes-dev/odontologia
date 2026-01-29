"use client";

import { zodResolver } from "@hookform/resolvers/zod"; // Usamos el resolutor de Zod
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createPuesto, updatePuesto } from "../actions"; // Tu función para enviar datos
import { PuestoSchema } from "../schema"; // Tu esquema de Zod para puesto
import { Field, FieldContent, FieldDescription, FieldLabel, FieldError } from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
export function PuestoFormulario({
  isUpdate,
  initialData,
}: {
  isUpdate: boolean;
  initialData: z.infer<typeof PuestoSchema>;
}) {
  const router = useRouter();

  // Usamos Zod para resolver la validación
  const form = useForm<z.infer<typeof PuestoSchema>>({
    resolver: zodResolver(PuestoSchema),
    defaultValues: initialData,
  });

;
  
  async function onSubmit(data: z.infer<typeof PuestoSchema>) {
    try {
      let result;
      if (isUpdate) {
        if (!data.id) {
          toast.error("Error", {
            description: "ID del puesto no encontrado.",
          });
          return;
        }
        result = await updatePuesto(data.id, data);
      } else {
        result = await createPuesto(data);
      }

      if (result.success) {
        // Notificación de éxito
        toast.success(
          isUpdate ? "Actualización Exitosa" : "Creación Exitosa", {
          description: isUpdate
            ? "El puesto ha sido actualizado correctamente."
            : "El puesto ha sido creado correctamente.",
        });

        router.push("/puestos");
        router.refresh();
      } else {
        // Notificación de error con mensaje específico
        toast.error(
          isUpdate ? "Error al actualizar el puesto" : "Error al crear el puesto", {
          description: result.error || "Por favor, intenta nuevamente más tarde.",
        });
      }
    } catch (error) {
      console.error("Error en la operación:", error);
      toast.error(
        isUpdate ? "Error al actualizar el puesto" : "Error al crear el puesto", {
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
            <FieldLabel htmlFor={field.name}>Nombre del Puesto</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                type="text"
                placeholder="Ingresa el nombre del puesto"
              />
            </FieldContent>
            <FieldDescription>Agrega el nombre del puesto.</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="descripcion"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Descripción del Puesto</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                type="text"
                placeholder="Ingresa la descripción del puesto"
              />
            </FieldContent>
            <FieldDescription>Agrega la descripción del puesto.</FieldDescription>
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
              <FieldLabel htmlFor={field.name}>Estado del Puesto</FieldLabel>
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
              <FieldDescription>Indica si el puesto está activo o inactivo.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />)
      }


      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {isUpdate ? "Actualizar Puesto" : "Crear Puesto"}
      </Button>




    </form>
  );
}
