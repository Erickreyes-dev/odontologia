"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Pencil,
  User,
  Stethoscope,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  CalendarPlus,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { toast } from "sonner";
import {
  PlanTratamiento,
  Seguimiento,
  ESTADOS_PLAN,
  ESTADOS_SEGUIMIENTO,
} from "../schema";
import { updateEstadoPlan, updateSeguimiento } from "../actions";
import { PlanEstado, SeguimientoEstado } from "@/lib/generated/prisma";

interface PlanDetailViewProps {
  plan: PlanTratamiento;
}

const getEstadoBadge = (estado: string) => {
  const estadoInfo = ESTADOS_PLAN.find((e) => e.value === estado);
  const label = estadoInfo?.label || estado;

  switch (estado) {
    case "ACTIVO":
      return (
        <Badge className="">
          {label}
        </Badge>
      );
    case "PAUSADO":
      return (
        <Badge className="">
          {label}
        </Badge>
      );
    case "COMPLETADO":
      return (
        <Badge className="">
          {label}
        </Badge>
      );
    case "CANCELADO":
      return (
        <Badge className="">
          {label}
        </Badge>
      );
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
};

const getSeguimientoBadge = (estado: string) => {
  const estadoInfo = ESTADOS_SEGUIMIENTO.find((e) => e.value === estado);
  const label = estadoInfo?.label || estado;

  switch (estado) {
    case "PENDIENTE":
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
        >
          {label}
        </Badge>
      );
    case "REALIZADO":
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-800"
        >
          {label}
        </Badge>
      );
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
};

export function PlanDetailView({ plan }: PlanDetailViewProps) {
  const [selectedSeguimiento, setSelectedSeguimiento] = useState<Seguimiento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [nota, setNota] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const totalSeguimientos = plan.totalSeguimientos || 0;
  const completados = plan.seguimientosCompletados || 0;
  const porcentaje = totalSeguimientos > 0 ? Math.round((completados / totalSeguimientos) * 100) : 0;

  const handleUpdateEstadoPlan = async (nuevoEstado: PlanEstado) => {
    const result = await updateEstadoPlan(plan.id!, nuevoEstado);
    if (result.success) {
      toast.success(`Plan ${nuevoEstado.toLowerCase()} correctamente`);
    } else {
      toast.error(result.error);
    }
  };


  const handleOpenUpdateSeguimiento = (seguimiento: Seguimiento) => {
    setSelectedSeguimiento(seguimiento);
    setNuevoEstado(seguimiento.estado);
    setNota(seguimiento.nota || "");
    setIsDialogOpen(true);
  };

  const handleUpdateSeguimiento = async () => {
    if (!selectedSeguimiento) return;

    setIsUpdating(true);
    const result = await updateSeguimiento(selectedSeguimiento.id!, {
      estado: nuevoEstado as unknown as SeguimientoEstado,
      fechaRealizada: nuevoEstado === "REALIZADO" ? new Date() : null,
      nota: nota || null,
    });

    setIsUpdating(false);
    setIsDialogOpen(false);

    if (result.success) {
      toast.success("Seguimiento actualizado correctamente");
    } else {
      toast.error(result.error);
    }
  };

  const getFechaStatus = (fecha: Date) => {
    const fechaDate = new Date(fecha);
    if (isToday(fechaDate)) {
      return (
        <span className="text-yellow-600 font-medium flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          Hoy
        </span>
      );
    }
    if (isPast(fechaDate)) {
      return (
        <span className="text-red-600 flex items-center gap-1">
          <XCircle className="h-4 w-4" />
          Vencido
        </span>
      );
    }
    return (
      <span className="text-muted-foreground">
        {format(fechaDate, "PPP", { locale: es })}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {plan.nombre}
                {getEstadoBadge(plan.estado)}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Paciente: <span className="font-medium">{plan.pacienteNombre}</span>
              </p>
            </div>
            <div className="flex gap-2">
              {plan.estado === "ACTIVO" && (
                <>
                  <Link href={`/planes-tratamiento/${plan.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateEstadoPlan("PAUSADO")}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pausar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleUpdateEstadoPlan("COMPLETADO")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Completar
                  </Button>
                </>
              )}
              {plan.estado === "PAUSADO" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleUpdateEstadoPlan("ACTIVO")}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Reanudar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Inicio</p>
                <p className="font-medium">
                  {plan.fechaInicio
                    ? format(new Date(plan.fechaInicio), "PPP", { locale: es })
                    : "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Médico</p>
                <p className="font-medium">{plan.medicoNombre || "No asignado"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Etapas</p>
                <p className="font-medium">{plan.totalEtapas || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Progreso</p>
                <p className="font-medium">
                  {completados}/{totalSeguimientos} ({porcentaje}%)
                </p>
              </div>
            </div>
          </div>

          {plan.descripcion && (
            <>
              <Separator className="my-4" />
              <p className="text-muted-foreground">{plan.descripcion}</p>
            </>
          )}

          <Separator className="my-4" />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso del tratamiento</span>
              <span>{porcentaje}%</span>
            </div>
            <Progress value={porcentaje} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="seguimientos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="seguimientos">Seguimientos</TabsTrigger>
          <TabsTrigger value="etapas">Etapas</TabsTrigger>
          <TabsTrigger value="timeline">Linea de Tiempo</TabsTrigger>
        </TabsList>

        {/* Seguimientos Tab */}
        <TabsContent value="seguimientos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seguimientos Programados</CardTitle>
            </CardHeader>
            <CardContent>
              {plan.seguimientos && plan.seguimientos.length > 0 ? (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha Programada</TableHead>
                          <TableHead>Etapa</TableHead>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Nota</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plan.seguimientos
                          ?.sort((a, b) => new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime())
                          .map((seguimiento) => (
                            <TableRow key={seguimiento.id}>
                              <TableCell>
                                {seguimiento.estado === "PENDIENTE"
                                  ? getFechaStatus(seguimiento.fechaProgramada)
                                  : format(new Date(seguimiento.fechaProgramada), "PPP", { locale: es })}
                              </TableCell>
                              <TableCell>{seguimiento.etapaNombre}</TableCell>
                              <TableCell>{seguimiento.servicioNombre}</TableCell>
                              <TableCell>{getSeguimientoBadge(seguimiento.estado)}</TableCell>
                              <TableCell className="max-w-[150px] truncate">{seguimiento.nota || "-"}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {seguimiento.estado === "PENDIENTE" && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenUpdateSeguimiento(seguimiento)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Link href={`/citas/create?pacienteId=${plan.pacienteId}`}>
                                        <Button variant="ghost" size="sm">
                                          <CalendarPlus className="h-4 w-4" />
                                        </Button>
                                      </Link>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}

                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {plan.seguimientos.map((seguimiento) => (
                      <Card key={seguimiento.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">{seguimiento.etapaNombre}</p>
                              <p className="text-sm text-muted-foreground">
                                {seguimiento.servicioNombre}
                              </p>
                              <div className="text-sm">
                                {seguimiento.estado === "PENDIENTE"
                                  ? getFechaStatus(seguimiento.fechaProgramada)
                                  : format(
                                    new Date(seguimiento.fechaProgramada),
                                    "PPP",
                                    { locale: es }
                                  )}
                              </div>
                              {seguimiento.nota && (
                                <p className="text-sm text-muted-foreground">
                                  {seguimiento.nota}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {getSeguimientoBadge(seguimiento.estado)}
                              {seguimiento.estado === "PENDIENTE" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleOpenUpdateSeguimiento(seguimiento)
                                    }
                                  >
                                    Actualizar
                                  </Button>
                                  <Link href={`/citas/create?pacienteId=${plan.pacienteId}`}>
                                    <Button variant="outline" size="sm">
                                      <CalendarPlus className="h-4 w-4 mr-1" />
                                      Cita
                                    </Button>
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay seguimientos pendientes.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Etapas Tab */}
        <TabsContent value="etapas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Etapas del Tratamiento</CardTitle>
            </CardHeader>
            <CardContent>
              {plan.etapas && plan.etapas.length > 0 ? (
                <div className="space-y-4">
                  {plan.etapas.map((etapa, index) => (
                    <Card key={etapa.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{etapa.nombre}</h4>
                            <p className="text-sm text-muted-foreground">
                              Servicio: {etapa.servicioNombre}
                            </p>
                            {etapa.descripcion && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {etapa.descripcion}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                              <span>
                                Intervalo: {etapa.intervaloDias ?? 30} días
                              </span>
                              <span>
                                Repeticiones: {etapa.repeticiones || 1}
                              </span>
                              {etapa.medicoNombre && (
                                <span>Médico: {etapa.medicoNombre}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay etapas definidas.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Linea de Tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              {plan.seguimientos && plan.seguimientos.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-6">
                    {plan.seguimientos.map((seguimiento) => (
                      <div key={seguimiento.id} className="relative pl-10">
                        <div
                          className={`absolute left-2 w-5 h-5 rounded-full border-2 ${
                            seguimiento.estado === "REALIZADO"
                              ? "bg-green-500 border-green-500"
                              : "bg-background border-primary"
                          }`}
                        >
                          {seguimiento.estado === "REALIZADO" && (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                          <span className="text-sm font-medium">
                            {format(
                              new Date(seguimiento.fechaProgramada),
                              "PPP",
                              { locale: es }
                            )}
                          </span>
                          {getSeguimientoBadge(seguimiento.estado)}
                        </div>
                        <p className="font-medium mt-1">
                          {seguimiento.etapaNombre}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {seguimiento.servicioNombre}
                        </p>
                        {seguimiento.nota && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Nota: {seguimiento.nota}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay seguimientos para mostrar.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para actualizar seguimiento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Seguimiento</DialogTitle>
            <DialogDescription>
              Actualiza el estado del seguimiento para{" "}
              {selectedSeguimiento?.etapaNombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_SEGUIMIENTO.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nota</Label>
              <Textarea
                placeholder="Agregar una nota..."
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateSeguimiento} disabled={isUpdating}>
              {isUpdating ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
