import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import {
  CalendarDays,
  DollarSign,
  FileText,
  HandCoins,
  Receipt,
  Users,
} from "lucide-react";
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";

const formatMoney = (value: number) => `L ${value.toLocaleString("es-HN")}`;

const getOrdenEstadoBadge = (estado: string) => {
  switch (estado) {
    case "PENDIENTE":
      return (
        <Badge
          variant="outline"
          className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800"
        >
          Pendiente
        </Badge>
      );
    case "PAGADA":
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800"
        >
          Pagada
        </Badge>
      );
    case "ANULADA":
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800"
        >
          Anulada
        </Badge>
      );
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
};

export default async function DashboardPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_pagos")) {
    return <NoAcceso />;
  }

  const today = new Date();
  const [
    gananciasDia,
    gananciasMes,
    citasHoy,
    pagosRecientes,
    financiamientosRecientes,
    ordenesRecientes,
    ordenesPendientes,
    financiamientosActivos,
    pacientesActivos,
  ] = await Promise.all([
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: {
        fechaPago: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
        estado: { not: "REVERTIDO" },
      },
    }),
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: {
        fechaPago: {
          gte: startOfMonth(today),
          lte: endOfMonth(today),
        },
        estado: { not: "REVERTIDO" },
      },
    }),
    prisma.cita.count({
      where: {
        fechaHora: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
    }),
    prisma.pago.findMany({
      take: 5,
      orderBy: { fechaPago: "desc" },
      include: {
        ordenCobro: {
          include: {
            paciente: true,
            financiamiento: true,
          },
        },
      },
    }),
    prisma.financiamiento.findMany({
      take: 5,
      orderBy: { createAt: "desc" },
      include: { paciente: true },
    }),
    prisma.ordenDeCobro.findMany({
      take: 5,
      orderBy: { fechaEmision: "desc" },
      include: {
        paciente: true,
        financiamiento: true,
      },
    }),
    prisma.ordenDeCobro.count({
      where: { estado: "PENDIENTE" },
    }),
    prisma.financiamiento.count({
      where: { estado: "ACTIVO" },
    }),
    prisma.paciente.count({
      where: { activo: true },
    }),
  ]);

  const totalDia = Number(gananciasDia._sum.monto ?? 0);
  const totalMes = Number(gananciasMes._sum.monto ?? 0);

  return (
    <div className="container mx-auto py-2 space-y-6">
      <HeaderComponent
        Icon={HandCoins}
        description="Resumen de ingresos, citas, pagos y financiamientos recientes."
        screenName="Dashboard"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ganancias de hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalDia)}</div>
            <p className="text-xs text-muted-foreground">
              {format(today, "PPP", { locale: es })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ganancias del mes</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalMes)}</div>
            <p className="text-xs text-muted-foreground">
              {format(today, "MMMM yyyy", { locale: es })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Citas para hoy</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{citasHoy}</div>
            <p className="text-xs text-muted-foreground">Programadas para el día</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Órdenes pendientes</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordenesPendientes}</div>
            <p className="text-xs text-muted-foreground">Cobros por completar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Financiamientos activos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financiamientosActivos}</div>
            <p className="text-xs text-muted-foreground">Con cuotas vigentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pacientes activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pacientesActivos}</div>
            <p className="text-xs text-muted-foreground">Base de pacientes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos 5 pagos</CardTitle>
          </CardHeader>
          <CardContent>
            {pagosRecientes.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Concepto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagosRecientes.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell>
                          {pago.ordenCobro.paciente.nombre} {pago.ordenCobro.paciente.apellido}
                        </TableCell>
                        <TableCell>
                          {format(new Date(pago.fechaPago), "PP", { locale: es })}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {formatMoney(Number(pago.monto))}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {pago.ordenCobro.concepto}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay pagos recientes.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos 5 financiamientos</CardTitle>
          </CardHeader>
          <CardContent>
            {financiamientosRecientes.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Fecha inicio</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Plazo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financiamientosRecientes.map((fin) => (
                      <TableRow key={fin.id}>
                        <TableCell>
                          {fin.paciente.nombre} {fin.paciente.apellido}
                        </TableCell>
                        <TableCell>
                          {format(new Date(fin.fechaInicio), "PP", { locale: es })}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {formatMoney(Number(fin.montoTotal))}
                        </TableCell>
                        <TableCell>{fin.cuotas} cuotas</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay financiamientos recientes.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Últimas órdenes de cobro</CardTitle>
          </CardHeader>
          <CardContent>
            {ordenesRecientes.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordenesRecientes.map((orden) => (
                      <TableRow key={orden.id}>
                        <TableCell>
                          {orden.paciente.nombre} {orden.paciente.apellido}
                        </TableCell>
                        <TableCell>
                          {format(new Date(orden.fechaEmision), "PP", { locale: es })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {orden.concepto}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {formatMoney(Number(orden.monto))}
                        </TableCell>
                        <TableCell>{getOrdenEstadoBadge(orden.estado)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay órdenes de cobro recientes.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
