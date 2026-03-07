"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createPromocion, updatePromocion } from "../actions";
import { PromocionSchema } from "../schema";

export function PromocionForm({
  isUpdate,
  initialData,
  servicios,
}: {
  isUpdate: boolean;
  initialData: z.infer<typeof PromocionSchema>;
  servicios: { id: string; nombre: string; precioBase: number }[];
}) {
  const router = useRouter();
  const form = useForm<z.infer<typeof PromocionSchema>>({
    resolver: zodResolver(PromocionSchema),
    defaultValues: initialData,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "servicios",
  });

  const serviciosSeleccionados = useWatch({
    control: form.control,
    name: "servicios",
  });

  useEffect(() => {
    const precioNormal = (serviciosSeleccionados ?? []).reduce((total, item) => {
      if (!item?.servicioId) return total;
      const servicio = servicios.find((svc) => svc.id === item.servicioId);
      const cantidad = Number(item.cantidad || 0);
      const precioAplicado = item.precioAplicado ?? servicio?.precioBase ?? 0;
      return total + Number(precioAplicado) * cantidad;
    }, 0);

    form.setValue("precioReferencial", Number(precioNormal.toFixed(2)), { shouldValidate: true });
  }, [form, servicios, serviciosSeleccionados]);

  async function onSubmit(data: z.infer<typeof PromocionSchema>) {
    const result = isUpdate && data.id
      ? await updatePromocion(data.id, data)
      : await createPromocion(data);

    if (result.success) {
      toast.success(isUpdate ? "Promoción actualizada" : "Promoción creada");
      router.push("/promociones");
      router.refresh();
      return;
    }

    toast.error("No se pudo guardar", { description: result.error });
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        name="nombre"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Nombre</FieldLabel>
            <FieldContent>
              <Input {...field} />
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
              <Textarea {...field} value={field.value ?? ""} />
            </FieldContent>
          </Field>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Controller
          name="precioReferencial"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Precio normal</FieldLabel>
              <FieldContent>
                <Input type="number" min="0" step="0.01" {...field} value={Number(field.value || 0)} readOnly disabled />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="precioPromocional"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Precio promocional</FieldLabel>
              <FieldContent>
                <Input type="number" min="0" step="0.01" {...field} onChange={(e) => field.onChange(Number(e.target.value || 0))} />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {isUpdate && (
          <Controller
            name="activo"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Activo</FieldLabel>
                <FieldContent>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FieldContent>
              </Field>
            )}
          />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FieldLabel>Servicios del paquete</FieldLabel>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ servicioId: "", cantidad: 1, precioAplicado: null })}>
            <Plus className="h-4 w-4 mr-1" /> Agregar servicio
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 border rounded p-3">
            <Controller
              name={`servicios.${index}.servicioId`}
              control={form.control}
              render={({ field: f }) => (
                <Field>
                  <FieldLabel>Servicio</FieldLabel>
                  <FieldContent>
                    <Select value={f.value} onValueChange={(value) => {
                      f.onChange(value);
                      const svc = servicios.find((s) => s.id === value);
                      if (svc) {
                        form.setValue(`servicios.${index}.precioAplicado`, svc.precioBase);
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar servicio" /></SelectTrigger>
                      <SelectContent>
                        {servicios.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name={`servicios.${index}.cantidad`}
              control={form.control}
              render={({ field: f }) => (
                <Field>
                  <FieldLabel>Cantidad</FieldLabel>
                  <FieldContent>
                    <Input type="number" min="1" {...f} onChange={(e) => f.onChange(Number(e.target.value || 1))} />
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name={`servicios.${index}.precioAplicado`}
              control={form.control}
              render={({ field: f }) => (
                <Field>
                  <FieldLabel>Precio aplicado</FieldLabel>
                  <FieldContent>
                    <Input type="number" min="0" step="0.01" value={f.value ?? ""} onChange={(e) => f.onChange(Number(e.target.value || 0))} />
                  </FieldContent>
                </Field>
              )}
            />

            <div className="flex items-end">
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {isUpdate ? "Actualizar promoción" : "Crear promoción"}
      </Button>
    </form>
  );
}
