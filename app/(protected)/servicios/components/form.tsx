"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Servicio, ServicioSchema } from "../schema";
import { postServicio, putServicio } from "../actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field, FieldLabel, FieldContent, FieldDescription, FieldError } from "@/components/ui/field";
import { Medico } from "../../medicos/schema";
import { CheckboxMedicos } from "./checkBoxMedicos";

export function FormularioServicio({
    isUpdate,
    initialData,
    medicosDisponibles,
}: {
    isUpdate: boolean;
    initialData?: Servicio;
    medicosDisponibles: Medico[];
}) {
    const router = useRouter();

    const form = useForm<Servicio>({
        resolver: zodResolver(ServicioSchema),
        defaultValues: initialData || { medicos: [] },
    });

    // 🔹 Esto imprime todos los valores cada vez que cambian
    const values = form.watch();
    console.log("🚀 ~ FormularioServicio ~ values:", values)

    async function onSubmit(data: Servicio) {

        try {
            if (isUpdate && initialData?.id) {
                await putServicio(data);
                toast.success("Servicio actualizado");
            } else {
                await postServicio(data);
                toast.success("Servicio creado");
            }
            router.push("/servicios");
            router.refresh();
        } catch (error) {
            console.error("Error al guardar:", error);
            toast.error("Error al guardar el servicio");
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 border p-4 rounded-md">
            <Controller
                name="nombre"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Nombre del servicio</FieldLabel>
                        <FieldContent>
                            <Input {...field} placeholder="Nombre del servicio" />
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
                name="precioBase"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Precio base</FieldLabel>
                        <FieldContent>
                            <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                value={field.value ?? ""}
                            />
                        </FieldContent>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <Controller
                name="duracionMin"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Duración (minutos)</FieldLabel>
                        <FieldContent>
                            <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                value={field.value ?? ""}
                            />
                        </FieldContent>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />
            <Controller
                name="medicos"
                control={form.control}
                render={({ field }) => (
                    <Field>
                        <FieldLabel>Médicos que pueden realizar este servicio</FieldLabel>
                        <FieldContent>
                            <CheckboxMedicos
                                medicos={medicosDisponibles}
                                selectedMedicos={field.value?.map((m) => m.idEmpleado) || []}
                                onChange={(selectedIds) => {
                                    const selected = medicosDisponibles.filter((m) => selectedIds.includes(m.idEmpleado));
                                    field.onChange(selected);
                                }}
                            />
                        </FieldContent>
                    </Field>
                )}
            />

            <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : isUpdate ? "Actualizar" : "Crear"}
                </Button>
            </div>
        </form>
    );
}
