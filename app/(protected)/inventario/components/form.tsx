"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Producto, ProductoSchema } from "../schema";
import { postProducto, putProducto } from "../actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";

export function FormularioProducto({
  isUpdate,
  initialData,
}: {
  isUpdate: boolean;
  initialData?: Producto;
}) {
  const router = useRouter();

  const form = useForm<Producto>({
    resolver: zodResolver(ProductoSchema),
    defaultValues: initialData || {
      nombre: "",
      descripcion: "",
      unidad: "",
      stock: 0,
      stockMinimo: 0,
    },
  });

  async function onSubmit(data: Producto) {
    try {
      if (isUpdate && initialData?.id) {
        await putProducto(data);
        toast.success("Producto actualizado");
      } else {
        await postProducto(data);
        toast.success("Producto creado");
      }
      router.push("/inventario");
      router.refresh();
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al guardar el producto");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 border p-4 rounded-md">
      <Controller
        name="nombre"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Nombre del producto</FieldLabel>
            <FieldContent>
              <Input {...field} placeholder="Nombre del producto" />
            </FieldContent>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="descripcion"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Descripción</FieldLabel>
            <FieldContent>
              <Input {...field} placeholder="Descripción" />
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        name="unidad"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Unidad</FieldLabel>
            <FieldContent>
              <Input {...field} placeholder="Ej: caja, unidad, ml" />
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        name="stock"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Stock actual</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                min="0"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                value={field.value ?? 0}
              />
            </FieldContent>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="stockMinimo"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Stock mínimo</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                min="0"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                value={field.value ?? 0}
              />
            </FieldContent>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
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
