"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

import { createCotizacion, updateCotizacion } from "../actions";
import { CotizacionSchema, ESTADOS_COTIZACION } from "../schema";
import { Paciente } from "../../pacientes/schema";

interface Servicio {
  id: string;
  nombre: string;
  precioBase: number;
}

interface CotizacionFormularioProps {
  isUpdate: boolean;
  initialData?: z.infer<typeof CotizacionSchema>;
  pacientes: Paciente[];
  servicios: Servicio[];
  defaultPacienteId?: string;
}

export function CotizacionFormulario({
  isUpdate,
  initialData,
  pacientes,
  servicios,
  defaultPacienteId,
}: CotizacionFormularioProps) {
  const router = useRouter();
  const [sendEmailToPaciente, setSendEmailToPaciente] = useState(false);

  const form = useForm<z.infer<typeof CotizacionSchema>>({
    resolver: zodResolver(CotizacionSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          fecha:
            initialData.fecha instanceof Date
              ? initialData.fecha
              : new Date(initialData.fecha),
          detalles: initialData.detalles ?? [],
        }
      : {
          pacienteId: defaultPacienteId ?? "",
          fecha: new Date(),
          estado: "borrador",
          total: 0,
          observacion: "",
          detalles: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "detalles",
  });

  const watchDetalles = form.watch("detalles");

  const calcularTotal = () => {
    return (
      watchDetalles?.reduce(
        (acc, item) => acc + (item.precioUnitario ?? 0) * (item.cantidad ?? 1),
        0
      ) ?? 0
    );
  };

  const handleAddServicio = () => {
    append({
      servicioId: "",
      precioUnitario: 0,
      cantidad: 1,
      observacion: "",
    });
  };

  const handleServicioChange = (index: number, servicioId: string) => {
    const servicio = servicios.find((s) => s.id === servicioId);
    if (servicio) {
      form.setValue(`detalles.${index}.servicioId`, servicioId);
      form.setValue(`detalles.${index}.precioUnitario`, servicio.precioBase);
      form.setValue(`detalles.${index}.servicioNombre`, servicio.nombre);
    }
  };

  async function onSubmit(data: z.infer<typeof CotizacionSchema>) {
    try {
      const cotizacionData = {
        ...data,
        total: calcularTotal(),
      };

      if (isUpdate && initialData?.id) {
        const result = await updateCotizacion(initialData.id, cotizacionData);
        if (result.success) {
          toast.success("Cotización actualizada correctamente");
          router.push("/cotizaciones");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } else {
        const selectedPaciente = pacientes.find((p) => p.id === cotizacionData.pacienteId);
        if (sendEmailToPaciente && !selectedPaciente?.correo) {
          toast.error("El paciente no tiene correo registrado.");
          return;
        }

        const shouldSend = sendEmailToPaciente
          ? window.confirm("¿Deseas enviar esta cotización al paciente por correo?")
          : false;

        const result = await createCotizacion(cotizacionData, { sendEmailToPaciente: shouldSend });
        if (result.success) {
          toast.success("Cotización creada correctamente");
          router.push("/cotizaciones");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error("Error en la operación:", error);
      toast.error("Error al procesar la cotización");
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 border rounded-md p-4"
    >
      {/* Datos principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Paciente */}
        <Controller
          name="pacienteId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Paciente</FieldLabel>
              <FieldContent>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id!}>
                        {p.nombre} {p.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>
                Selecciona el paciente para la cotización.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Fecha */}
        <Controller
          name="fecha"
          control={form.control}
          render={({ field, fieldState }) => {
            const dateValue =
              field.value instanceof Date
                ? field.value
                : field.value
                  ? new Date(field.value)
                  : undefined;

            return (
              <Field data-invalid={fieldState.invalid} className="flex flex-col">
                <FieldLabel>Fecha</FieldLabel>
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
                    />
                  </PopoverContent>
                </Popover>
                <FieldDescription>Fecha de la cotización.</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            );
          }}
        />

        {/* Estado */}
        <Controller
          name="estado"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
              <FieldContent>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_COTIZACION.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>
                Estado actual de la cotización.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Observación */}
        <Controller
          name="observacion"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor={field.name}>Observación</FieldLabel>
              <FieldContent>
                <Textarea
                  placeholder="Observaciones adicionales..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FieldContent>
              <FieldDescription>
                Notas u observaciones para la cotización (opcional).
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </div>

      {/* Servicios */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Servicios</CardTitle>
            <Button type="button" onClick={handleAddServicio} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Agregar Servicio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay servicios agregados. Haz clic en &quot;Agregar Servicio&quot; para
              comenzar.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Servicio</TableHead>
                      <TableHead className="w-[120px]">Precio Unit.</TableHead>
                      <TableHead className="w-[100px]">Cantidad</TableHead>
                      <TableHead className="w-[120px] text-right">
                        Subtotal
                      </TableHead>
                      <TableHead className="w-[200px]">Observación</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const precioUnitario =
                        watchDetalles?.[index]?.precioUnitario ?? 0;
                      const cantidad = watchDetalles?.[index]?.cantidad ?? 1;
                      const subtotal = precioUnitario * cantidad;

                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              name={`detalles.${index}.servicioId`}
                              control={form.control}
                              render={({ field: f }) => (
                                <Select
                                  onValueChange={(value) =>
                                    handleServicioChange(index, value)
                                  }
                                  value={f.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {servicios.map((s) => (
                                      <SelectItem key={s.id} value={s.id}>
                                        {s.nombre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Controller
                              name={`detalles.${index}.precioUnitario`}
                              control={form.control}
                              render={({ field: f }) => (
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...f}
                                  onChange={(e) =>
                                    f.onChange(parseFloat(e.target.value) || 0)
                                  }
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Controller
                              name={`detalles.${index}.cantidad`}
                              control={form.control}
                              render={({ field: f }) => (
                                <Input
                                  type="number"
                                  min="1"
                                  {...f}
                                  onChange={(e) =>
                                    f.onChange(parseInt(e.target.value) || 1)
                                  }
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            L.{" "}
                            {subtotal.toLocaleString("es-HN", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            <Controller
                              name={`detalles.${index}.observacion`}
                              control={form.control}
                              render={({ field: f }) => (
                                <Input
                                  placeholder="Nota..."
                                  {...f}
                                  value={f.value ?? ""}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {fields.map((field, index) => {
                  const precioUnitario =
                    watchDetalles?.[index]?.precioUnitario ?? 0;
                  const cantidad = watchDetalles?.[index]?.cantidad ?? 1;
                  const subtotal = precioUnitario * cantidad;

                  return (
                    <Card key={field.id}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium">
                            Servicio {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <Controller
                          name={`detalles.${index}.servicioId`}
                          control={form.control}
                          render={({ field: f }) => (
                            <Select
                              onValueChange={(value) =>
                                handleServicioChange(index, value)
                              }
                              value={f.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar servicio..." />
                              </SelectTrigger>
                              <SelectContent>
                                {servicios.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">
                              Precio Unitario
                            </label>
                            <Controller
                              name={`detalles.${index}.precioUnitario`}
                              control={form.control}
                              render={({ field: f }) => (
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...f}
                                  onChange={(e) =>
                                    f.onChange(parseFloat(e.target.value) || 0)
                                  }
                                />
                              )}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">
                              Cantidad
                            </label>
                            <Controller
                              name={`detalles.${index}.cantidad`}
                              control={form.control}
                              render={({ field: f }) => (
                                <Input
                                  type="number"
                                  min="1"
                                  {...f}
                                  onChange={(e) =>
                                    f.onChange(parseInt(e.target.value) || 1)
                                  }
                                />
                              )}
                            />
                          </div>
                        </div>

                        <Controller
                          name={`detalles.${index}.observacion`}
                          control={form.control}
                          render={({ field: f }) => (
                            <Input
                              placeholder="Observación..."
                              {...f}
                              value={f.value ?? ""}
                            />
                          )}
                        />

                        <div className="text-right font-semibold">
                          Subtotal: L.{" "}
                          {subtotal.toLocaleString("es-HN", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* Total */}
          {fields.length > 0 && (
            <div className="mt-4 flex justify-end">
              <div className="bg-muted px-4 py-2 rounded-md">
                <span className="text-lg font-semibold">
                  Total: L.{" "}
                  {calcularTotal().toLocaleString("es-HN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón Enviar */}
      <div className="rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="enviarCorreoCotizacion"
            checked={sendEmailToPaciente}
            onCheckedChange={(checked) => setSendEmailToPaciente(checked === true)}
          />
          <div>
            <label htmlFor="enviarCorreoCotizacion" className="text-sm font-medium cursor-pointer">
              Preguntar y enviar cotización por correo
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              El sistema solicitará confirmación al guardar.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : isUpdate ? (
            "Actualizar Cotización"
          ) : (
            "Crear Cotización"
          )}
        </Button>
      </div>
    </form>
  );
}
