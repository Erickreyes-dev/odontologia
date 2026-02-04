"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { differenceInYears, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  FileText,
  Loader2,
  Plus,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ConsultaSchema, Consulta } from "../schema";
import { finalizarConsulta, upsertConsulta } from "../actions";

interface CitaData {
  id: string;
  fechaHora: Date;
  estado: string;
  motivo: string | null;
  observacion: string | null;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    identidad: string;
    telefono?: string | null;
    correo?: string | null;
    fechaNacimiento?: Date | null;
    genero?: string | null;
  } | null;
  medico: {
    idEmpleado: string;
    empleado?: {
      nombre: string;
      apellido: string;
    } | null;
  } | null;
  consultorio: {
    id: string;
    nombre: string;
  } | null;
}

interface ConsultaFormProps {
  cita: CitaData;
  consulta: Consulta | null;
  servicios: { id: string; nombre: string; precioBase: number }[];
  productos: { id: string; nombre: string; unidad: string | null; stock: number }[];
  seguimientos: {
    id: string;
    etapaNombre?: string;
    servicioNombre?: string;
    fechaProgramada: Date;
    citaId?: string | null;
    servicios?: {
      servicioId: string;
      precioAplicado: number;
      cantidad: number;
      servicioNombre?: string;
    }[];
  }[];
  financiamientos: {
    id: string;
    pacienteId: string;
    cuotasLista?: { id: string; numero: number; monto: number; pagada: boolean }[];
  }[];
}

export function ConsultaForm({
  cita,
  consulta,
  servicios,
  productos,
  seguimientos,
  financiamientos,
}: ConsultaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Consulta>({
    resolver: zodResolver(ConsultaSchema),
    defaultValues: {
      id: consulta?.id || undefined,
      citaId: cita.id,
      fechaConsulta: consulta?.fechaConsulta ?? new Date(cita.fechaHora),
      diagnostico: consulta?.diagnostico || "",
      notas: consulta?.notas || "",
      observacionesClinicas: consulta?.observacionesClinicas || "",
      servicios: consulta?.servicios ?? [],
      productos: consulta?.productos ?? [],
      seguimientoId: consulta?.seguimientoId ?? null,
      financiamientoId: consulta?.financiamientoId ?? null,
    },
  });

  const { fields: serviciosFields, append: appendServicio, remove: removeServicio } =
    useFieldArray({
      control: form.control,
      name: "servicios",
    });

  const { fields: productosFields, append: appendProducto, remove: removeProducto } =
    useFieldArray({
      control: form.control,
      name: "productos",
    });

  const serviciosWatch = useWatch({ control: form.control, name: "servicios" }) ?? [];
  const productosWatch = useWatch({ control: form.control, name: "productos" }) ?? [];
  const seguimientoId = useWatch({ control: form.control, name: "seguimientoId" });
  const financiamientoId = useWatch({ control: form.control, name: "financiamientoId" });

  const totalServicios = useMemo(
    () =>
      serviciosWatch.reduce(
        (acc, item) => acc + (item.precioAplicado || 0) * (item.cantidad || 0),
        0
      ),
    [serviciosWatch]
  );

  const financiamientoSeleccionado = useMemo(() => {
    if (!financiamientoId) return null;
    return financiamientos.find((fin) => fin.id === financiamientoId) ?? null;
  }, [financiamientoId, financiamientos]);

  const cuotaPendiente = useMemo(() => {
    if (!financiamientoSeleccionado?.cuotasLista?.length) return null;
    return financiamientoSeleccionado.cuotasLista.find((cuota) => !cuota.pagada) ?? null;
  }, [financiamientoSeleccionado]);

  const totalConsulta = financiamientoSeleccionado
    ? cuotaPendiente?.monto ?? 0
    : totalServicios;

  const hasServiciosPlan = Boolean(seguimientoId);

  const applySeguimientoServicios = useCallback(
    (seguimientoId: string | null) => {
      if (!seguimientoId) return;
      const seguimiento = seguimientos.find((s) => s.id === seguimientoId);
      if (!seguimiento?.servicios?.length) return;

      const serviciosPlan = seguimiento.servicios.map((servicio) => ({
        servicioId: servicio.servicioId,
        precioAplicado: servicio.precioAplicado,
        cantidad: servicio.cantidad,
        servicioNombre: servicio.servicioNombre,
      }));

      const serviciosActuales = form.getValues("servicios") ?? [];
      const extras = serviciosActuales.filter(
        (servicio) => !serviciosPlan.some((plan) => plan.servicioId === servicio.servicioId)
      );

      form.setValue("servicios", [...serviciosPlan, ...extras], {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form, seguimientos]
  );

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    if (consulta?.id) {
      initializedRef.current = true;
      return;
    }
    const seguimientoCita = seguimientos.find((s) => s.citaId === cita.id);
    if (seguimientoCita) {
      form.setValue("seguimientoId", seguimientoCita.id);
      applySeguimientoServicios(seguimientoCita.id);
    }
    initializedRef.current = true;
  }, [applySeguimientoServicios, cita.id, consulta?.id, form, seguimientos]);

  const onSubmit = async (data: Consulta) => {
    setIsSubmitting(true);

    try {
      const result = await upsertConsulta(data);

      if (result.success) {
        toast.success("Consulta guardada", {
          description: "La consulta se ha guardado correctamente.",
        });
        router.push("/citas");
        router.refresh();
      } else {
        toast.error("Error al guardar", {
          description: result.error || "No se pudo guardar la consulta.",
        });
      }
    } catch {
      toast.error("Error", {
        description: "Ocurrio un error inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFinalize = async (data: Consulta) => {
    setIsSubmitting(true);
    try {
      const result = await finalizarConsulta(data);
      if (result.success) {
        toast.success("Consulta finalizada y orden de cobro generada");
        router.push("/ordenes-cobro");
        router.refresh();
      } else {
        toast.error("No se pudo finalizar la consulta", {
          description: result.error,
        });
      }
    } catch {
      toast.error("Error al finalizar consulta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calcularEdad = (fechaNacimiento: Date | null | undefined) => {
    if (!fechaNacimiento) return null;
    return differenceInYears(new Date(), new Date(fechaNacimiento));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">
                {cita.paciente?.nombre} {cita.paciente?.apellido}
              </p>
              <p className="text-sm text-muted-foreground">
                {cita.paciente?.identidad}
              </p>
            </div>
            {cita.paciente?.fechaNacimiento && (
              <p className="text-sm">
                <span className="text-muted-foreground">Edad:</span>{" "}
                {calcularEdad(cita.paciente.fechaNacimiento)} anios
              </p>
            )}
            {cita.paciente?.genero && (
              <p className="text-sm">
                <span className="text-muted-foreground">Genero:</span>{" "}
                {cita.paciente.genero}
              </p>
            )}
            {cita.paciente?.telefono && (
              <p className="text-sm">
                <span className="text-muted-foreground">Telefono:</span>{" "}
                {cita.paciente.telefono}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Cita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  cita.estado === "atendida"
                    ? "default"
                    : cita.estado === "programada"
                    ? "outline"
                    : "destructive"
                }
              >
                {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
              </Badge>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">Fecha:</span>{" "}
              {format(new Date(cita.fechaHora), "PPP", { locale: es })}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Hora:</span>{" "}
              {format(new Date(cita.fechaHora), "p", { locale: es })}
            </p>
            {cita.consultorio && (
              <p className="text-sm">
                <span className="text-muted-foreground">Consultorio:</span>{" "}
                {cita.consultorio.nombre}
              </p>
            )}
            {cita.motivo && (
              <p className="text-sm">
                <span className="text-muted-foreground">Motivo:</span>{" "}
                {cita.motivo}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-4 w-4" />
              Medico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              Dr. {cita.medico?.empleado?.nombre} {cita.medico?.empleado?.apellido}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data))}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Servicios y Productos
            </CardTitle>
            <CardDescription>
              Registre los servicios realizados y productos consumidos en la consulta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel>Servicios realizados</FieldLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendServicio({ servicioId: "", precioAplicado: 0, cantidad: 1 })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar servicio
                </Button>
              </div>
              {serviciosFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay servicios registrados en esta consulta.
                </p>
              ) : (
                <div className="space-y-3">
                  {serviciosFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-md border p-3"
                    >
                      <Controller
                        name={`servicios.${index}.servicioId`}
                        control={form.control}
                        render={({ field: f }) => (
                          <div className="space-y-2 md:col-span-2">
                            <FieldLabel>Servicio</FieldLabel>
                            <Select
                              value={f.value}
                              onValueChange={(value) => {
                                f.onChange(value);
                                const servicio = servicios.find((s) => s.id === value);
                                if (servicio) {
                                  form.setValue(
                                    `servicios.${index}.precioAplicado`,
                                    servicio.precioBase,
                                    { shouldDirty: true, shouldValidate: true }
                                  );
                                  if (!form.getValues(`servicios.${index}.cantidad`)) {
                                    form.setValue(`servicios.${index}.cantidad`, 1, {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    });
                                  }
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un servicio" />
                              </SelectTrigger>
                              <SelectContent>
                                {servicios.map((servicio) => (
                                  <SelectItem key={servicio.id} value={servicio.id}>
                                    {servicio.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      />
                      <Controller
                        name={`servicios.${index}.precioAplicado`}
                        control={form.control}
                        render={({ field: f }) => (
                          <div className="space-y-2">
                            <FieldLabel>Precio (L)</FieldLabel>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...f}
                              value={f.value ?? ""}
                              onChange={(event) =>
                                f.onChange(
                                  event.target.value
                                    ? parseFloat(event.target.value)
                                    : 0
                                )
                              }
                            />
                          </div>
                        )}
                      />
                      <Controller
                        name={`servicios.${index}.cantidad`}
                        control={form.control}
                        render={({ field: f }) => (
                          <div className="space-y-2">
                            <FieldLabel>Cantidad</FieldLabel>
                            <Input
                              type="number"
                              min="1"
                              {...f}
                              value={f.value ?? ""}
                              onChange={(event) =>
                                f.onChange(
                                  event.target.value
                                    ? parseInt(event.target.value, 10)
                                    : 1
                                )
                              }
                            />
                          </div>
                        )}
                      />
                      <div className="flex items-end justify-end md:col-span-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeServicio(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel>Productos consumidos</FieldLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendProducto({ productoId: "", cantidad: 1 })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar producto
                </Button>
              </div>
              {productosFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay productos registrados en esta consulta.
                </p>
              ) : (
                <div className="space-y-3">
                  {productosFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-md border p-3"
                    >
                      <Controller
                        name={`productos.${index}.productoId`}
                        control={form.control}
                        render={({ field: f }) => (
                          <div className="space-y-2 md:col-span-2">
                            <FieldLabel>Producto</FieldLabel>
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto" />
                              </SelectTrigger>
                              <SelectContent>
                                {productos.map((producto) => (
                                  <SelectItem key={producto.id} value={producto.id}>
                                    {producto.nombre} · Stock: {producto.stock}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      />
                      <Controller
                        name={`productos.${index}.cantidad`}
                        control={form.control}
                        render={({ field: f }) => (
                          <div className="space-y-2">
                            <FieldLabel>Cantidad</FieldLabel>
                            <Input
                              type="number"
                              min="1"
                              {...f}
                              value={f.value ?? ""}
                              onChange={(event) =>
                                f.onChange(
                                  event.target.value
                                    ? parseInt(event.target.value, 10)
                                    : 1
                                )
                              }
                            />
                          </div>
                        )}
                      />
                      <div className="flex items-center justify-between md:col-span-4">
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            const selected = productos.find(
                              (producto) => producto.id === productosWatch[index]?.productoId
                            );
                            if (!selected) return "Selecciona un producto para ver stock.";
                            return `Stock disponible: ${selected.stock}${selected.unidad ? ` ${selected.unidad}` : ""}`;
                          })()}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProducto(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field>
                <FieldLabel>Seguimiento del plan (opcional)</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.watch("seguimientoId") || "none"}
                    onValueChange={(value) => {
                      const nextValue = value === "none" ? null : value;
                      form.setValue("seguimientoId", nextValue);
                      applySeguimientoServicios(nextValue);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un seguimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin seguimiento</SelectItem>
                      {seguimientos.map((seguimiento) => (
                        <SelectItem key={seguimiento.id} value={seguimiento.id}>
                          {seguimiento.etapaNombre || "Etapa"} -{" "}
                          {seguimiento.servicioNombre || "Servicios"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Financiamiento (opcional)</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.watch("financiamientoId") || "none"}
                    onValueChange={(value) =>
                      form.setValue("financiamientoId", value === "none" ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un financiamiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin financiamiento</SelectItem>
                      {financiamientos.map((fin) => (
                        <SelectItem key={fin.id} value={fin.id}>
                          Fin. #{fin.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Total de la consulta</FieldLabel>
                <FieldContent>
                  <Input
                    value={totalConsulta.toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </FieldContent>
                <FieldDescription>
                  {financiamientoSeleccionado
                    ? cuotaPendiente
                      ? `Total basado en la cuota ${cuotaPendiente.numero}.`
                      : "No hay cuotas pendientes en este financiamiento."
                    : hasServiciosPlan
                      ? "Total calculado en base a los servicios del plan."
                      : "Total calculado en base a los servicios seleccionados."}
                </FieldDescription>
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Diagnostico y Observaciones
            </CardTitle>
            <CardDescription>
              Registre el diagnostico y las observaciones clinicas de la consulta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Controller
              name="fechaConsulta"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Fecha de consulta</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value ? new Date(`${value}T00:00:00`) : null);
                      }}
                    />
                  </FieldContent>
                  <FieldDescription>
                    Puede ajustar la fecha de la consulta si es necesario.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="diagnostico"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Diagnostico</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id={field.name}
                      placeholder="Escriba el diagnostico del paciente..."
                      className="min-h-[100px] resize-y"
                      {...field}
                      value={field.value || ""}
                    />
                  </FieldContent>
                  <FieldDescription>
                    Describa el diagnostico del paciente basado en la evaluacion realizada.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="observacionesClinicas"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Observaciones clinicas</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id={field.name}
                      placeholder="Observaciones clinicas relevantes..."
                      className="min-h-[120px] resize-y"
                      {...field}
                      value={field.value || ""}
                    />
                  </FieldContent>
                  <FieldDescription>
                    Incluya observaciones clinicas importantes del control.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="notas"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Notas adicionales</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id={field.name}
                      placeholder="Notas adicionales, recomendaciones, tratamiento..."
                      className="min-h-[120px] resize-y"
                      {...field}
                      value={field.value || ""}
                    />
                  </FieldContent>
                  <FieldDescription>
                    Incluya notas sobre recomendaciones o informacion adicional.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : consulta ? (
              "Actualizar Consulta"
            ) : (
              "Registrar Consulta"
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => form.handleSubmit((data) => onFinalize(data))()}
            disabled={isSubmitting || totalConsulta <= 0}
          >
            Finalizar consulta y generar orden
          </Button>
        </div>
      </form>
    </div>
  );
}
