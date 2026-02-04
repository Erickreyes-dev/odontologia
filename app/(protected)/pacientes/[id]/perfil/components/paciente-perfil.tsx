"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarPlus,
  Mail,
  MapPin,
  Phone,
  Shield,
  Pencil,
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  Download,
  Plus,
  Eye,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { calcularEdad } from "@/lib/utils";
import { Paciente } from "../../../schema";
import { Cita } from "@/app/(protected)/citas/schema";
import { Cotizacion, ESTADOS_COTIZACION } from "@/app/(protected)/cotizaciones/schema";
import { PlanTratamiento, ESTADOS_PLAN } from "@/app/(protected)/planes-tratamiento/schema";
import { PagoWithRelations } from "@/app/(protected)/pagos/schema";
import { METODOS_PAGO, ESTADOS_PAGO } from "@/app/(protected)/pagos/schema";
import { Progress } from "@/components/ui/progress";
import { generateCotizacionPDF } from "@/lib/pdf/cotizacion-pdf";
import { ClipboardList } from "lucide-react";

interface PacientePerfilProps {
  paciente: Paciente;
  citas: Cita[];
  cotizaciones: Cotizacion[];
  planes: PlanTratamiento[];
  pagos: PagoWithRelations[];
  seguroNombre?: string;
}

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case "programada":
      return (
        <Badge
          variant="outline"
          className=""
        >
          Programada
        </Badge>
      );
    case "atendida":
      return (
        <Badge
          variant="outline"
          className=""
        >
          Atendida
        </Badge>
      );
    case "cancelada":
      return (
        <Badge
          variant="outline"
          className=""
        >
          Cancelada
        </Badge>
      );
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
};

const getEstadoCotizacionBadge = (estado: string) => {
  const estadoInfo = ESTADOS_COTIZACION.find((e) => e.value === estado);
  const label = estadoInfo?.label || estado;

  switch (estado) {
    case "borrador":
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
          {label}
        </Badge>
      );
    case "enviada":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
          {label}
        </Badge>
      );
    case "aceptada":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
          {label}
        </Badge>
      );
    case "rechazada":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
          {label}
        </Badge>
      );
    case "parcial":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          {label}
        </Badge>
      );
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
};

const getEstadoPlanBadge = (estado: string) => {
  const estadoInfo = ESTADOS_PLAN.find((e) => e.value === estado);
  const label = estadoInfo?.label || estado;

  switch (estado) {
    case "ACTIVO":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
          {label}
        </Badge>
      );
    case "PAUSADO":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          {label}
        </Badge>
      );
    case "COMPLETADO":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
          {label}
        </Badge>
      );
    case "CANCELADO":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
          {label}
        </Badge>
      );
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
};

const getMetodoPagoLabel = (metodo: string) =>
  METODOS_PAGO.find((m) => m.value === metodo)?.label ?? metodo;

const getEstadoPagoBadge = (estado: string) => {
  const info = ESTADOS_PAGO.find((e) => e.value === estado);
  switch (estado) {
    case "APLICADO":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
          {info?.label ?? estado}
        </Badge>
      );
    case "REVERTIDO":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
          {info?.label ?? estado}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-slate-100 text-slate-800">
          {info?.label ?? estado}
        </Badge>
      );
  }
};

export function PacientePerfil({
  paciente,
  citas,
  cotizaciones,
  planes,
  pagos,
  seguroNombre,
}: PacientePerfilProps) {
  const initials = `${paciente.nombre?.charAt(0) ?? ""}${paciente.apellido?.charAt(0) ?? ""}`;
  const edad = paciente.fechaNacimiento
    ? calcularEdad(new Date(paciente.fechaNacimiento))
    : null;

  const citasProgramadas = citas.filter((c) => c.estado === "programada");
  const citasAtendidas = citas.filter((c) => c.estado === "atendida");
  const citasCanceladas = citas.filter((c) => c.estado === "cancelada");

  // Calcular totales de cotizaciones


  // Calcular planes activos
  const planesActivos = planes.filter((p) => p.estado === "ACTIVO");

  const handleDownloadPDF = (cotizacion: Cotizacion) => {
    generateCotizacionPDF(cotizacion, paciente);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold">
                    {paciente.nombre ?? ""} {paciente.apellido ?? ""}
                  </h2>
                  <Badge variant={paciente.activo ? "default" : "outline"}>
                    {paciente.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {paciente.identidad || "Sin identidad"}
                </p>
                {paciente.correo && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="mr-1 h-4 w-4" />
                    {paciente.correo}
                  </div>
                )}
                {paciente.telefono && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="mr-1 h-4 w-4" />
                    {paciente.telefono}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Link href={`/pacientes/${paciente.id}/edit`} className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full">
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
              <Link
                href={`/citas/create?pacienteId=${paciente.id}`}
                className="flex-1 sm:flex-none"
              >
                <Button className="w-full">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Nueva Cita
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informacion Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Informacion Personal
              </h3>
              <dl className="grid grid-cols-[1fr_2fr] gap-2 text-sm">
                <dt className="font-medium text-muted-foreground">
                  Identidad:
                </dt>
                <dd>{paciente.identidad || "No especificado"}</dd>

                <dt className="font-medium text-muted-foreground">
                  Fecha de Nacimiento:
                </dt>
                <dd>
                  {paciente.fechaNacimiento
                    ? format(
                        new Date(paciente.fechaNacimiento),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: es }
                      )
                    : "No especificado"}
                </dd>

                <dt className="font-medium text-muted-foreground">Edad:</dt>
                <dd>{edad !== null ? `${edad} años` : "No especificado"}</dd>

                <dt className="font-medium text-muted-foreground">Genero:</dt>
                <dd>{paciente.genero || "No especificado"}</dd>

                {paciente.direccion && (
                  <>
                    <dt className="font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Direccion:
                    </dt>
                    <dd>{paciente.direccion}</dd>
                  </>
                )}
              </dl>
            </div>

            {/* Informacion de Seguro y Contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguro Medico
              </h3>
              <dl className="grid grid-cols-[1fr_2fr] gap-2 text-sm">
                <dt className="font-medium text-muted-foreground">Seguro:</dt>
                <dd>
                  {seguroNombre ? (
                    <Badge variant="secondary">{seguroNombre}</Badge>
                  ) : (
                    "Sin seguro"
                  )}
                </dd>
              </dl>

              <h3 className="text-lg font-semibold flex items-center gap-2 pt-4">
                <Phone className="h-5 w-5" />
                Contacto
              </h3>
              <dl className="grid grid-cols-[1fr_2fr] gap-2 text-sm">
                <dt className="font-medium text-muted-foreground">Telefono:</dt>
                <dd>{paciente.telefono || "No especificado"}</dd>

                <dt className="font-medium text-muted-foreground">Correo:</dt>
                <dd>{paciente.correo || "No especificado"}</dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{citas.length}</p>
                <p className="text-sm text-muted-foreground">Total Citas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{citasProgramadas.length}</p>
                <p className="text-sm text-muted-foreground">Programadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-full">
                <Stethoscope className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{citasAtendidas.length}</p>
                <p className="text-sm text-muted-foreground">Atendidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{citasCanceladas.length}</p>
                <p className="text-sm text-muted-foreground">Canceladas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cotizaciones.length}</p>
                <p className="text-sm text-muted-foreground">Cotizaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-indigo-100 rounded-full">
                <ClipboardList className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{planesActivos.length}</p>
                <p className="text-sm text-muted-foreground">Planes Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-full">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pagos.length}</p>
                <p className="text-sm text-muted-foreground">Pagos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Citas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historial de Citas
            </span>
            <Link href={`/citas/create?pacienteId=${paciente.id}`}>
              <Button size="sm">
                <CalendarPlus className="h-4 w-4 mr-2" />
                Agendar Cita
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {citas.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Medico</TableHead>
                      <TableHead>Consultorio</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {citas.map((cita) => (
                      <TableRow key={cita.id}>
                        <TableCell>
                          {cita.fechaHora
                            ? format(new Date(cita.fechaHora), "PPP p", {
                                locale: es,
                              })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {cita.medico?.empleado
                            ? `${cita.medico.empleado.nombre} ${cita.medico.empleado.apellido}`
                            : "-"}
                        </TableCell>
                        <TableCell>{cita.consultorio?.nombre || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {cita.motivo || "-"}
                        </TableCell>
                        <TableCell>{getEstadoBadge(cita.estado)}</TableCell>
                        <TableCell>
                          <Link href={`/citas/${cita.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {citas.map((cita) => (
                  <Card key={cita.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {cita.fechaHora
                                ? format(new Date(cita.fechaHora), "PPP", {
                                    locale: es,
                                  })
                                : "-"}
                            </p>
                            {getEstadoBadge(cita.estado)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {cita.fechaHora
                              ? format(new Date(cita.fechaHora), "p", {
                                  locale: es,
                                })
                              : "-"}{" "}
                            |{" "}
                            {cita.medico?.empleado
                              ? `Dr. ${cita.medico.empleado.nombre} ${cita.medico.empleado.apellido}`
                              : "-"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {cita.consultorio?.nombre || "Sin consultorio"}
                          </p>
                          {cita.motivo && (
                            <p className="text-sm text-muted-foreground truncate">
                              Motivo: {cita.motivo}
                            </p>
                          )}
                        </div>
                        <Link href={`/citas/${cita.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 bg-muted/30 rounded-lg">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Este paciente no tiene citas registradas.
              </p>
              <Link href={`/citas/create?pacienteId=${paciente.id}`}>
                <Button variant="outline" className="mt-4">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Agendar Primera Cita
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cotizaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cotizaciones
            </span>
            <Link href={`/cotizaciones/create?pacienteId=${paciente.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cotizacion
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cotizaciones.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Servicios</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cotizaciones.map((cotizacion) => (
                      <TableRow key={cotizacion.id}>
                        <TableCell>
                          {cotizacion.fecha
                            ? format(new Date(cotizacion.fecha), "PPP", {
                                locale: es,
                              })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[250px]">
                            {cotizacion.detalles && cotizacion.detalles.length > 0 ? (
                              <span className="text-sm">
                                {cotizacion.detalles.map((d) => d.servicioNombre).join(", ")}
                              </span>
                            ) : (
                              "-"
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          L. {cotizacion.total?.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getEstadoCotizacionBadge(cotizacion.estado)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link href={`/cotizaciones/${cotizacion.id}/edit`}>
                              <Button variant="ghost" size="icon" title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Descargar PDF"
                              onClick={() => handleDownloadPDF(cotizacion)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {cotizaciones.map((cotizacion) => (
                  <Card key={cotizacion.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">
                              {cotizacion.fecha
                                ? format(new Date(cotizacion.fecha), "PPP", {
                                    locale: es,
                                  })
                                : "-"}
                            </p>
                            {getEstadoCotizacionBadge(cotizacion.estado)}
                          </div>
                          <p className="text-lg font-semibold text-primary">
                            L. {cotizacion.total?.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                          </p>
                          {cotizacion.detalles && cotizacion.detalles.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              <p className="font-medium">Servicios:</p>
                              <ul className="list-disc list-inside">
                                {cotizacion.detalles.map((d, idx) => (
                                  <li key={idx}>
                                    {d.servicioNombre} ({d.cantidad}x)
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {cotizacion.observacion && (
                            <p className="text-sm text-muted-foreground truncate">
                              Nota: {cotizacion.observacion}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Link href={`/cotizaciones/${cotizacion.id}/edit`}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(cotizacion)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 bg-muted/30 rounded-lg">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Este paciente no tiene cotizaciones registradas.
              </p>
              <Link href={`/cotizaciones/create?pacienteId=${paciente.id}`}>
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Cotizacion
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Planes de Tratamiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Planes de Tratamiento
            </span>
            <Link href={`/planes-tratamiento/create?pacienteId=${paciente.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {planes.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre del Plan</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Etapas</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planes.map((plan) => {
                      const total = plan.totalSeguimientos || 0;
                      const completados = plan.seguimientosCompletados || 0;
                      const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

                      return (
                        <TableRow key={plan.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{plan.nombre}</p>
                              {plan.medicoNombre && (
                                <p className="text-sm text-muted-foreground">
                                  Dr. {plan.medicoNombre}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {plan.fechaInicio
                              ? format(new Date(plan.fechaInicio), "PPP", {
                                  locale: es,
                                })
                              : "-"}
                          </TableCell>
                          <TableCell>{plan.totalEtapas || 0}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={porcentaje} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-12">
                                {completados}/{total}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getEstadoPlanBadge(plan.estado)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Link href={`/planes-tratamiento/${plan.id}`}>
                                <Button variant="ghost" size="icon" title="Ver detalle">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {plan.estado === "ACTIVO" && (
                                <Link href={`/planes-tratamiento/${plan.id}/edit`}>
                                  <Button variant="ghost" size="icon" title="Editar">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {planes.map((plan) => {
                  const total = plan.totalSeguimientos || 0;
                  const completados = plan.seguimientosCompletados || 0;
                  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

                  return (
                    <Card key={plan.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{plan.nombre}</p>
                              {getEstadoPlanBadge(plan.estado)}
                            </div>
                            {plan.medicoNombre && (
                              <p className="text-sm text-muted-foreground">
                                Dr. {plan.medicoNombre}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Inicio:{" "}
                              {plan.fechaInicio
                                ? format(new Date(plan.fechaInicio), "PPP", {
                                    locale: es,
                                  })
                                : "-"}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">
                                {plan.totalEtapas || 0} etapas
                              </span>
                              <span className="text-muted-foreground">|</span>
                              <span className="text-muted-foreground">
                                {completados}/{total} seguimientos
                              </span>
                            </div>
                            <Progress value={porcentaje} className="h-2" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Link href={`/planes-tratamiento/${plan.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {plan.estado === "ACTIVO" && (
                              <Link href={`/planes-tratamiento/${plan.id}/edit`}>
                                <Button variant="ghost" size="icon">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-10 bg-muted/30 rounded-lg">
              <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Este paciente no tiene planes de tratamiento.
              </p>
              <Link href={`/planes-tratamiento/create?pacienteId=${paciente.id}`}>
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Plan
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Historial de Pagos
            </span>
            <Link href={`/pagos?pacienteId=${paciente.id}`}>
              <Button size="sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pagos.length > 0 ? (
            <>
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Origen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell>
                          {format(new Date(pago.fechaPago), "PPP", { locale: es })}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          L {pago.monto.toLocaleString("es-HN")}
                        </TableCell>
                        <TableCell>{getMetodoPagoLabel(pago.metodo)}</TableCell>
                        <TableCell>{getEstadoPagoBadge(pago.estado)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {pago.ordenRef || pago.financiamientoRef || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {pagos.map((pago) => (
                  <Card key={pago.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            L {pago.monto.toLocaleString("es-HN")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(pago.fechaPago), "PPP", { locale: es })} · {getMetodoPagoLabel(pago.metodo)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pago.ordenRef || pago.financiamientoRef || "-"}
                          </p>
                        </div>
                        {getEstadoPagoBadge(pago.estado)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 bg-muted/30 rounded-lg">
              <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Este paciente no tiene pagos registrados.
              </p>
              <Link href="/pagos">
                <Button variant="outline" className="mt-4">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Registrar Pago
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
