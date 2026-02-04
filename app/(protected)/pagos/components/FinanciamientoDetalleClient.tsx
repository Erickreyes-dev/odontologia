"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, DollarSign, Receipt } from "lucide-react";
import Link from "next/link";
import { PagoFormModal } from "./PagoFormModal";
import type { FinanciamientoDetalle } from "../schema";
import { ESTADOS_FINANCIAMIENTO } from "../schema";
import type { OrdenCobroWithRelations } from "@/app/(protected)/ordenes-cobro/schema";
import { OrdenCobroFormModal } from "@/app/(protected)/ordenes-cobro/components/OrdenCobroFormModal";

interface FinanciamientoDetalleClientProps {
  financiamiento: FinanciamientoDetalle;
  financiamientosParaPago: {
    pacienteId: string;
    id: string;
    pacienteNombre: string;
    cuotasLista: { id: string; numero: number; monto: number; pagada: boolean }[];
  }[];
  ordenesCobro: OrdenCobroWithRelations[];
}

const getEstadoBadge = (estado: string) => {
  const info = ESTADOS_FINANCIAMIENTO.find((e) => e.value === estado);
  switch (estado) {
    case "ACTIVO":
      return (
        <Badge variant="outline" className="">
          {info?.label ?? estado}
        </Badge>
      );
    case "PAGADO":
      return (
        <Badge variant="outline" className="">
          {info?.label ?? estado}
        </Badge>
      );
    default:
      return <Badge variant="outline">{info?.label ?? estado}</Badge>;
  }
};

export function FinanciamientoDetalleClient({
  financiamiento,
  financiamientosParaPago,
  ordenesCobro,
}: FinanciamientoDetalleClientProps) {
  const router = useRouter();
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [ordenModalOpen, setOrdenModalOpen] = useState(false);

  const cuotas = financiamiento.cuotasLista ?? [];
  const totalPagado = financiamiento.totalPagado ?? financiamiento.anticipo;
  const montoFinanciado = financiamiento.montoTotal - financiamiento.anticipo;
  const interesMonto = montoFinanciado * (financiamiento.interes / 100);
  const totalConInteres = montoFinanciado + interesMonto;

  const ordenesPendientes = ordenesCobro.filter(
    (orden) => orden.financiamientoId === financiamiento.id
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pagos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {financiamiento.pacienteNombre}
              </h2>
              <p className="text-sm text-muted-foreground">
                Inicio: {format(financiamiento.fechaInicio, "PPP", { locale: es })}
              </p>
              {getEstadoBadge(financiamiento.estado)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setOrdenModalOpen(true)}>
                <Receipt className="h-4 w-4 mr-2" />
                Generar Orden de Cobro
              </Button>
              <Button onClick={() => setPagoModalOpen(true)} disabled={ordenesPendientes.length === 0}>
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Monto total</p>
              <p className="font-mono font-medium">
                L {financiamiento.montoTotal.toLocaleString("es-HN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Anticipo</p>
              <p className="font-mono font-medium">
                L {financiamiento.anticipo.toLocaleString("es-HN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo pendiente</p>
              <p className="font-mono font-medium text-amber-600">
                L {financiamiento.saldo.toLocaleString("es-HN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total pagado</p>
              <p className="font-mono font-medium text-green-600">
                L {totalPagado.toLocaleString("es-HN")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Monto financiado</p>
              <p className="font-mono font-medium">
                L {montoFinanciado.toLocaleString("es-HN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plazo</p>
              <p className="font-mono font-medium">{financiamiento.cuotas} cuotas</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Interés</p>
              <p className="font-mono font-medium">
                {financiamiento.interes}% · L {interesMonto.toLocaleString("es-HN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total con intereses</p>
              <p className="font-mono font-medium">
                L {totalConInteres.toLocaleString("es-HN")}
              </p>
            </div>
          </div>

          <h3 className="font-medium mb-2">Cuotas</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.numero}</TableCell>
                    <TableCell className="font-mono">
                      L {c.monto.toLocaleString("es-HN")}
                    </TableCell>
                    <TableCell>
                      {format(c.fechaVencimiento, "PP", { locale: es })}
                    </TableCell>
                    <TableCell>
                      {c.pagada ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Pagada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-100">
                          Pendiente
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <OrdenCobroFormModal
        open={ordenModalOpen}
        onOpenChange={setOrdenModalOpen}
        pacientes={[
          {
            id: financiamiento.pacienteId,
            nombre: financiamiento.pacienteNombre ?? "",
            apellido: "",
          },
        ]}
        onSuccess={() => router.refresh()}
      />

      <PagoFormModal
        open={pagoModalOpen}
        onOpenChange={setPagoModalOpen}
        ordenesCobro={ordenesPendientes.map((orden) => ({
          id: orden.id,
          pacienteNombre: orden.pacienteNombre ?? "",
          monto: orden.monto,
          financiamientoId: orden.financiamientoId,
          pacienteId: orden.pacienteId,
        }))}
        financiamientos={financiamientosParaPago.map(fin => ({
          ...fin,
          pacienteId: fin.pacienteId ?? financiamiento.pacienteId,
        }))}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
