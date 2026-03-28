"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DollarSign, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { FinanciamientoDetalle } from "../schema";
import { useTenantCurrency } from "@/hooks/use-tenant-currency";
import { formatMoneyAmount } from "@/lib/currency-format";
import { ESTADOS_FINANCIAMIENTO } from "../schema";

interface FinanciamientoCardProps {
  financiamiento: FinanciamientoDetalle;
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
    case "VENCIDO":
      return (
        <Badge variant="outline" className="">
          {info?.label ?? estado}
        </Badge>
      );
    case "CANCELADO":
      return (
        <Badge variant="outline" className="">
          {info?.label ?? estado}
        </Badge>
      );
    default:
      return <Badge variant="outline">{info?.label ?? estado}</Badge>;
  }
};

export function FinanciamientoCard({ financiamiento }: FinanciamientoCardProps) {
  const currency = useTenantCurrency();
  const totalPagado = financiamiento.totalPagado ?? financiamiento.anticipo;
  const montoFinanciado = financiamiento.montoTotal - financiamiento.anticipo;
  const porcentaje =
    montoFinanciado > 0
      ? Math.min(
          100,
          Math.round(((totalPagado - financiamiento.anticipo) / montoFinanciado) * 100)
        )
      : 100;

  const cuotasPagadas =
    financiamiento.cuotasLista?.filter((c) => c.pagada).length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{financiamiento.pacienteNombre}</span>
          {getEstadoBadge(financiamiento.estado)}
        </div>
        <p className="text-sm text-muted-foreground">
          Inicio: {format(financiamiento.fechaInicio, "PPP", { locale: es })} ·{" "}
          {financiamiento.cuotas} cuotas
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Monto total</span>
            <p className="font-mono font-medium">
              {formatMoneyAmount(financiamiento.montoTotal, currency)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Saldo pendiente</span>
            <p className="font-mono font-medium text-amber-600">
              {formatMoneyAmount(financiamiento.saldo, currency)}
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progreso</span>
            <span>
              {cuotasPagadas}/{financiamiento.cuotas} cuotas
            </span>
          </div>
          <Progress value={porcentaje} className="h-2" />
        </div>

        <Link href={`/pagos/financiamiento/${financiamiento.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            <DollarSign className="h-4 w-4 mr-2" />
            Ver detalle / Registrar pago
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
