"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Rol } from "../../roles/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Empleado } from "../../empleados/schema";
import { createUsuario, updateUsuario } from "../actions";
import { Usuario, UsuarioSchema } from "../schema";

export function Formulario({
  isUpdate,
  initialData,
  empleados,
  roles,
  empleadoAsignado,
}: {
  isUpdate: boolean;
  initialData?: z.infer<typeof UsuarioSchema>;
  empleados: Empleado[];
  roles: Rol[];
  empleadoAsignado?: Empleado | null;
}) {
  const router = useRouter();

  const form = useForm<z.infer<typeof UsuarioSchema>>({
    resolver: zodResolver(UsuarioSchema),
    defaultValues: initialData,
  });

  async function onSubmit(data: z.infer<typeof UsuarioSchema>) {
    const usuarioData = {
      usuario: data.usuario,
      empleado_id: data.empleado_id,
      rol_id: data.rol_id,
      activo: isUpdate ? data.activo : undefined,
      id: isUpdate ? data.id : undefined,
    };

    try {
      if (isUpdate) {
        await updateUsuario(usuarioData as Usuario);
        toast.success("El usuario ha sido actualizado.");
      } else {
        await createUsuario(usuarioData as Usuario);
        toast.success("El usuario ha sido creado.");
      }

      router.push("/usuarios");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Hubo un problema al guardar.";
      toast.error(message);
    }
  }

  const empleadosFinales = empleadoAsignado
    ? [empleadoAsignado, ...empleados]
    : empleados;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 border rounded-md p-4"
    >
      {/* Usuario */}
      <Controller
        name="usuario"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Usuario</FieldLabel>
            <FieldContent>
              <Input placeholder="Usuario" {...field} />
            </FieldContent>
            <FieldDescription>
              Ingresa el nombre de usuario.
            </FieldDescription>
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      {/* Empleado */}
      <Controller
        name="empleado_id"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Empleado</FieldLabel>
            <FieldContent>
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleadosFinales.map((empleado) => (
                    <SelectItem key={empleado.id} value={empleado.id || ""}>
                      {empleado.nombre} {empleado.apellido}
                      {empleadoAsignado?.id === empleado.id && " (Asignado)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
            <FieldDescription>
              Selecciona un empleado.
            </FieldDescription>
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      {/* Rol */}
      <Controller
        name="rol_id"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Rol</FieldLabel>
            <FieldContent>
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id || ""}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
            <FieldDescription>
              Selecciona el rol del usuario.
            </FieldDescription>
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      {/* Estado (solo update) */}
      {isUpdate && (
        <Controller
          name="activo"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Estado</FieldLabel>
              <FieldContent>
                <Select
                  value={field.value ? "true" : "false"}
                  onValueChange={(value) =>
                    field.onChange(value === "true")
                  }
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
                Define si el usuario está activo o inactivo.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      )}

      {/* Submit */}
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
