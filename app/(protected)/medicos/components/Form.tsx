"use client";

import { zodResolver } from "@hookform/resolvers/zod"; // Usamos el resolutor de Zod
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";


import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Field, FieldContent, FieldDescription, FieldLabel, FieldError } from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { MedicoSchema } from "../schema";
import { createMedico, updateMedico } from "../actions";
import { Empleado } from "../../empleados/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Profesion } from "../../profesiones/schema";
export function MedicoFormulario({
  isUpdate,
  initialData,
  empleados,
  profesiones,
}: {
  isUpdate: boolean;
  initialData: z.infer<typeof MedicoSchema>;
  empleados: Empleado[];
  profesiones: Profesion[];

}) {
  const router = useRouter();

  // Usamos Zod para resolver la validación
  const form = useForm<z.infer<typeof MedicoSchema>>({
    resolver: zodResolver(MedicoSchema),
    defaultValues: initialData,
  });

  ;

  async function onSubmit(data: z.infer<typeof MedicoSchema>) {
    try {
      let result;
      if (isUpdate) {
        if (!data.id) {
          toast.error("Error", {
            description: "ID del medico no encontrado.",
          });
          return;
        }
        result = await updateMedico(data.id, data);
      } else {
        result = await createMedico(data);
      }

      if (result.success) {
        // Notificación de éxito
        toast.success(
          isUpdate ? "Actualización Exitosa" : "Creación Exitosa", {
          description: isUpdate
            ? "El medico ha sido actualizado correctamente."
            : "El medico ha sido creado correctamente.",
        });

        router.push("/medicos");
        router.refresh();
      } else {
        // Notificación de error con mensaje específico
        toast.error(
          isUpdate ? "Error al actualizar el medico" : "Error al crear el medico", {
          description: result.error || "Por favor, intenta nuevamente más tarde.",
        });
      }
    } catch (error) {
      console.error("Error en la operación:", error);
      toast.error(
        isUpdate ? "Error al actualizar el medico" : "Error al crear el medico", {
        description: "Por favor, intenta nuevamente más tarde.",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

      <Controller
        name="idEmpleado"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Empleado</FieldLabel>
            <FieldContent>
              <Select
                value={field.value || ""}
                onValueChange={(val) => field.onChange(val || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map((p) => (
                    <SelectItem key={p.id} value={p.id!}>
                      {p.nombre} {p.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
            <FieldDescription>
              Selecciona el empleado para el medico.
            </FieldDescription>
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />
      <Controller
        name="profesionId"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Profesión</FieldLabel>
            <FieldContent>
              <Select
                value={field.value || ""}
                onValueChange={(val) => field.onChange(val || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una profesión" />
                </SelectTrigger>
                <SelectContent>
                  {profesiones.map((p) => (
                    <SelectItem key={p.id} value={p.id!}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
            <FieldDescription>
              Selecciona la profesión para el medico.
            </FieldDescription>
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      {
        isUpdate && (<Controller
          name="activo"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Estado del medico</FieldLabel>
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
              <FieldDescription>Indica si el medico está activo o inactivo.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />)
      }


      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {isUpdate ? "Actualizar medico" : "Crear medico"}
      </Button>




    </form>
  );
}
