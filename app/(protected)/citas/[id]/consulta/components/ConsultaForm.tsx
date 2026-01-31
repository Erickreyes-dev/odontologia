"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Save, ArrowLeft, User, Calendar, Stethoscope, FileText, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { ConsultaSchema, Consulta, ConsultaServicio } from "../schema";
import { upsertConsulta } from "../actions";
import Link from "next/link";

interface ServicioDisponible {
  id: string;
  nombre: string;
  precioBase: number;
  duracionMin: number;
}

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
  servicios: ServicioDisponible[];
}

export function ConsultaForm({ cita, consulta, servicios }: ConsultaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Consulta>({
    resolver: zodResolver(ConsultaSchema),
    defaultValues: {
      id: consulta?.id || undefined,
      citaId: cita.id,
      diagnostico: consulta?.diagnostico || "",
      notas: consulta?.notas || "",
      detalles: consulta?.detalles || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "detalles",
  });

  const watchDetalles = form.watch("detalles");

  const calcularTotal = () => {
    return watchDetalles.reduce((acc, detalle) => {
      return acc + (detalle.precioAplicado * detalle.cantidad);
    }, 0);
  };

  const handleAddServicio = () => {
    append({
      servicioId: "",
      precioAplicado: 0,
      cantidad: 1,
    });
  };

  const handleServicioChange = (index: number, servicioId: string) => {
    const servicio = servicios.find((s) => s.id === servicioId);
    if (servicio) {
      form.setValue(`detalles.${index}.servicioId`, servicioId);
      form.setValue(`detalles.${index}.precioAplicado`, servicio.precioBase);
      form.setValue(`detalles.${index}.servicio`, {
        id: servicio.id,
        nombre: servicio.nombre,
        precioBase: servicio.precioBase,
      });
    }
  };

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
    } catch (error) {
      toast.error("Error", {
        description: "Ocurrio un error inesperado.",
      });
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
      {/* Informacion de la cita */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card del Paciente */}
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

        {/* Card de la Cita */}
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

        {/* Card del Medico */}
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

      {/* Formulario de Consulta */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Diagnostico y Notas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Diagnostico y Observaciones
              </CardTitle>
              <CardDescription>
                Ingrese el diagnostico y las notas relevantes de la consulta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="diagnostico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnostico</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Escriba el diagnostico del paciente..."
                        className="min-h-[100px] resize-y"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas / Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales, recomendaciones, tratamiento..."
                        className="min-h-[120px] resize-y"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Servicios Realizados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Servicios Realizados
                  </CardTitle>
                  <CardDescription>
                    Agregue los servicios que se realizaron durante la consulta
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddServicio}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Servicio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fields.length > 0 ? (
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Servicio</TableHead>
                          <TableHead className="w-[20%]">Precio Unitario</TableHead>
                          <TableHead className="w-[15%]">Cantidad</TableHead>
                          <TableHead className="w-[15%]">Subtotal</TableHead>
                          <TableHead className="w-[10%]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => {
                          const detalle = watchDetalles[index];
                          const subtotal = (detalle?.precioAplicado || 0) * (detalle?.cantidad || 1);

                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`detalles.${index}.servicioId`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          handleServicioChange(index, value);
                                        }}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Seleccione un servicio" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {servicios.map((servicio) => (
                                            <SelectItem key={servicio.id} value={servicio.id}>
                                              {servicio.nombre} - L. {servicio.precioBase.toFixed(2)}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`detalles.${index}.precioAplicado`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`detalles.${index}.cantidad`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          {...field}
                                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">
                                  L. {subtotal.toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => remove(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {fields.map((field, index) => {
                      const detalle = watchDetalles[index];
                      const subtotal = (detalle?.precioAplicado || 0) * (detalle?.cantidad || 1);

                      return (
                        <Card key={field.id} className="p-4">
                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name={`detalles.${index}.servicioId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Servicio</FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      handleServicioChange(index, value);
                                    }}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un servicio" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {servicios.map((servicio) => (
                                        <SelectItem key={servicio.id} value={servicio.id}>
                                          {servicio.nombre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-3">
                              <FormField
                                control={form.control}
                                name={`detalles.${index}.precioAplicado`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Precio</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`detalles.${index}.cantidad`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Cantidad</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="font-medium">
                                Subtotal: L. {subtotal.toFixed(2)}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Total */}
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">
                        L. {calcularTotal().toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No se han agregado servicios a esta consulta.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddServicio}
                    className="mt-3"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Primer Servicio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de accion */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Link href="/citas">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Citas
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Guardando..." : "Guardar Consulta"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
