"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PagoFormModal } from "@/app/(protected)/pagos/components/PagoFormModal";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, DollarSign, FileText, Loader2, Package, Plus, Stethoscope, Trash2, User } from "lucide-react";

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

import { ConsultaSchema, Consulta } from "../schema";
import { upsertConsulta } from "../actions";

interface ServicioDisponible {
  id: string;
  nombre: string;
  precioBase: number;
  duracionMin: number;
}

interface ProductoDisponible {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
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
  productos: ProductoDisponible[];
}

export function ConsultaForm({ cita, consulta, servicios, productos }: ConsultaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [savedConsultaForPago, setSavedConsultaForPago] = useState<{
    id: string;
  } | null>(null);

  const form = useForm<Consulta>({
    resolver: zodResolver(ConsultaSchema),
    defaultValues: {
      id: consulta?.id || undefined,
      citaId: cita.id,
      diagnostico: consulta?.diagnostico || "",
      notas: consulta?.notas || "",
      detalles: consulta?.detalles || [],
      productos: consulta?.productos || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "detalles",
  });

  const {
    fields: productoFields,
    append: appendProducto,
    remove: removeProducto,
  } = useFieldArray({
    control: form.control,
    name: "productos",
  });

  const watchDetalles = form.watch("detalles");
  const watchProductos = form.watch("productos");

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

  const handleAddProducto = () => {
    appendProducto({
      productoId: "",
      cantidad: 1,
    });
  };

  const handleProductoChange = (index: number, productoId: string) => {
    const producto = productos.find((p) => p.id === productoId);
    if (producto) {
      form.setValue(`productos.${index}.productoId`, productoId);
      form.setValue(`productos.${index}.producto`, {
        id: producto.id,
        nombre: producto.nombre,
        unidad: producto.unidad,
        stock: producto.stock,
        stockMinimo: producto.stockMinimo,
      });
    }
  };

  const onSubmit = async (
    data: Consulta,
    options?: { openPagoModal?: boolean }
  ) => {
    setIsSubmitting(true);

    try {
      const result = await upsertConsulta(data);

      if (result.success) {
        toast.success("Consulta guardada", {
          description: "La consulta se ha guardado correctamente.",
        });
        if (
          options?.openPagoModal &&
          result.data &&
          typeof result.data.id === 'string' &&
          calcularTotal() > 0
        ) {
          setSavedConsultaForPago({ id: result.data.id });
          setShowPagoModal(true);
        } else {
          router.push("/citas");
          router.refresh();
        }
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
      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data))}
        className="space-y-6"
      >
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
              name="notas"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Notas / Observaciones</FieldLabel>
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
                    Incluya notas sobre el tratamiento, recomendaciones o informacion adicional.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
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
                              <Controller
                                name={`detalles.${index}.servicioId`}
                                control={form.control}
                                render={({ field: selectField, fieldState }) => (
                                  <Select
                                    onValueChange={(value) => {
                                      selectField.onChange(value);
                                      handleServicioChange(index, value);
                                    }}
                                    value={selectField.value}
                                  >
                                    <SelectTrigger className={fieldState.invalid ? "border-destructive" : ""}>
                                      <SelectValue placeholder="Seleccione un servicio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {servicios.map((servicio) => (
                                        <SelectItem key={servicio.id} value={servicio.id}>
                                          {servicio.nombre} - L. {servicio.precioBase.toFixed(2)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`detalles.${index}.precioAplicado`}
                                control={form.control}
                                render={({ field: inputField }) => (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...inputField}
                                    onChange={(e) => inputField.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`detalles.${index}.cantidad`}
                                control={form.control}
                                render={({ field: inputField }) => (
                                  <Input
                                    type="number"
                                    min="1"
                                    {...inputField}
                                    onChange={(e) => inputField.onChange(parseInt(e.target.value) || 1)}
                                  />
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
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium">Servicio {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Controller
                            name={`detalles.${index}.servicioId`}
                            control={form.control}
                            render={({ field: selectField, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Servicio</FieldLabel>
                                <FieldContent>
                                  <Select
                                    onValueChange={(value) => {
                                      selectField.onChange(value);
                                      handleServicioChange(index, value);
                                    }}
                                    value={selectField.value}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione un servicio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {servicios.map((servicio) => (
                                        <SelectItem key={servicio.id} value={servicio.id}>
                                          {servicio.nombre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FieldContent>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <Controller
                              name={`detalles.${index}.precioAplicado`}
                              control={form.control}
                              render={({ field: inputField, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel>Precio</FieldLabel>
                                  <FieldContent>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      {...inputField}
                                      onChange={(e) => inputField.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FieldContent>
                                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                              )}
                            />
                            <Controller
                              name={`detalles.${index}.cantidad`}
                              control={form.control}
                              render={({ field: inputField, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel>Cantidad</FieldLabel>
                                  <FieldContent>
                                    <Input
                                      type="number"
                                      min="1"
                                      {...inputField}
                                      onChange={(e) => inputField.onChange(parseInt(e.target.value) || 1)}
                                    />
                                  </FieldContent>
                                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                              )}
                            />
                          </div>

                          <div className="flex justify-end pt-2 border-t">
                            <span className="text-sm text-muted-foreground mr-2">Subtotal:</span>
                            <span className="font-medium">L. {subtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Total y Registrar Pago */}
                <div className="flex flex-col sm:flex-row justify-end items-end gap-4 pt-4 border-t">
                  <div className="bg-muted rounded-lg px-6 py-3">
                    <span className="text-muted-foreground mr-2">Total:</span>
                    <span className="text-xl font-bold">L. {calcularTotal().toFixed(2)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      form.handleSubmit((data) =>
                        onSubmit(data, { openPagoModal: true })
                      )()
                    }
                    disabled={isSubmitting || calcularTotal() <= 0}
                    className="shrink-0"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Guardar y Registrar Pago
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay servicios agregados</p>
                <p className="text-sm">Haga clic en &quot;Agregar Servicio&quot; para comenzar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Productos Utilizados */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos Utilizados
                </CardTitle>
                <CardDescription>
                  Seleccione los productos consumidos durante la consulta
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddProducto}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Agregar Producto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {productoFields.length > 0 ? (
              <div className="space-y-4">
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Producto</TableHead>
                        <TableHead className="w-[20%]">Stock</TableHead>
                        <TableHead className="w-[20%]">Cantidad</TableHead>
                        <TableHead className="w-[10%]">Unidad</TableHead>
                        <TableHead className="w-[10%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productoFields.map((field, index) => {
                        const detalle = watchProductos[index];
                        const productoSeleccionado = productos.find(
                          (p) => p.id === detalle?.productoId
                        );
                        const stockActual = productoSeleccionado?.stock ?? 0;
                        const stockMinimo = productoSeleccionado?.stockMinimo ?? 0;
                        return (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Controller
                                name={`productos.${index}.productoId`}
                                control={form.control}
                                render={({ field: selectField, fieldState }) => (
                                  <Select
                                    onValueChange={(value) => {
                                      selectField.onChange(value);
                                      handleProductoChange(index, value);
                                    }}
                                    value={selectField.value}
                                  >
                                    <SelectTrigger className={fieldState.invalid ? "border-destructive" : ""}>
                                      <SelectValue placeholder="Seleccione un producto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {productos.map((producto) => (
                                        <SelectItem key={producto.id} value={producto.id}>
                                          {producto.nombre} ({producto.stock})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{stockActual}</span>
                                {stockActual <= stockMinimo ? (
                                  <Badge variant="destructive">Bajo</Badge>
                                ) : (
                                  <Badge variant="secondary">Ok</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`productos.${index}.cantidad`}
                                control={form.control}
                                render={({ field: inputField }) => (
                                  <Input
                                    type="number"
                                    min="1"
                                    {...inputField}
                                    onChange={(e) => inputField.onChange(parseInt(e.target.value) || 1)}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>{productoSeleccionado?.unidad || "-"}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeProducto(index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

                <div className="md:hidden space-y-3">
                  {productoFields.map((field, index) => {
                    const detalle = watchProductos[index];
                    const productoSeleccionado = productos.find(
                      (p) => p.id === detalle?.productoId
                    );
                    const stockActual = productoSeleccionado?.stock ?? 0;
                    const stockMinimo = productoSeleccionado?.stockMinimo ?? 0;
                    return (
                      <Card key={field.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium">Producto {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeProducto(index)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <Controller
                            name={`productos.${index}.productoId`}
                            control={form.control}
                            render={({ field: selectField, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Producto</FieldLabel>
                                <FieldContent>
                                  <Select
                                    onValueChange={(value) => {
                                      selectField.onChange(value);
                                      handleProductoChange(index, value);
                                    }}
                                    value={selectField.value}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione un producto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {productos.map((producto) => (
                                        <SelectItem key={producto.id} value={producto.id}>
                                          {producto.nombre} ({producto.stock})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FieldContent>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <Field>
                              <FieldLabel>Stock</FieldLabel>
                              <FieldContent>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{stockActual}</span>
                                  {stockActual <= stockMinimo ? (
                                    <Badge variant="destructive">Bajo</Badge>
                                  ) : (
                                    <Badge variant="secondary">Ok</Badge>
                                  )}
                                </div>
                              </FieldContent>
                            </Field>
                            <Controller
                              name={`productos.${index}.cantidad`}
                              control={form.control}
                              render={({ field: inputField, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel>Cantidad</FieldLabel>
                                  <FieldContent>
                                    <Input
                                      type="number"
                                      min="1"
                                      {...inputField}
                                      onChange={(e) => inputField.onChange(parseInt(e.target.value) || 1)}
                                    />
                                  </FieldContent>
                                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                              )}
                            />
                          </div>

                          <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                            <span>Unidad:</span>
                            <span className="font-medium text-foreground">
                              {productoSeleccionado?.unidad || "-"}
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay productos agregados</p>
                <p className="text-sm">Haga clic en &quot;Agregar Producto&quot; para comenzar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
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
        </div>
      </form>

      {/* Modal para registrar pago de la consulta */}
      <PagoFormModal
        open={showPagoModal}
        onOpenChange={(open) => {
          setShowPagoModal(open);
          if (!open) {
            setSavedConsultaForPago(null);
            router.push("/citas");
            router.refresh();
          }
        }}
        pacienteId={cita.paciente?.id}
        consultaId={savedConsultaForPago?.id ?? consulta?.id ?? undefined}
        monto={calcularTotal()}
        pacientes={
          cita.paciente
            ? [
                {
                  id: cita.paciente.id,
                  nombre: cita.paciente.nombre,
                  apellido: cita.paciente.apellido,
                },
              ]
            : []
        }
        financiamientos={[]}
        onSuccess={() => {
          setShowPagoModal(false);
          setSavedConsultaForPago(null);
          router.push("/citas");
          router.refresh();
        }}
      />
    </div>
  );
}
