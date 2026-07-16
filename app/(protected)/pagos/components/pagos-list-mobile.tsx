"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PagoWithRelations } from "../schema";
import { METODOS_PAGO, ESTADOS_PAGO } from "../schema";
import { Calendar, Download } from "lucide-react";
import { useTenantCurrency } from "@/hooks/use-tenant-currency";
import { formatMoneyAmount } from "@/lib/currency-format";

interface PagosListMobileProps {
  pagos: PagoWithRelations[];
  onDownloadRecibo?: (pagoId: string) => void;
  onEditFecha?: (pago: PagoWithRelations) => void;
}

const getMetodoLabel = (metodo: string) =>
  METODOS_PAGO.find((m) => m.value === metodo)?.label ?? metodo;

const getEstadoBadge = (estado: string) => {
  const info = ESTADOS_PAGO.find((e) => e.value === estado);
  switch (estado) {
    case "APLICADO":
      return (
        <Badge variant="outline" className="">
          {info?.label ?? estado}
        </Badge>
      );
    case "REVERTIDO":
      return (
        <Badge variant="outline" className="">
          {info?.label ?? estado}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">{info?.label ?? estado}</Badge>
      );
  }
};

export function PagosListMobile({ pagos, onDownloadRecibo, onEditFecha }: PagosListMobileProps) {
  const currency = useTenantCurrency();
  if (pagos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay pagos registrados.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pagos.map((pago) => (
        <Card key={pago.id}>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{pago.pacienteNombre ?? "-"}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(pago.fechaPago), "PP", { locale: es })} ·{" "}
                  {getMetodoLabel(pago.metodo)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-medium">{formatMoneyAmount(pago.monto, currency)}</p>
                {getEstadoBadge(pago.estado)}
              </div>
            </div>
            {(onDownloadRecibo || onEditFecha) && (
              <div className="mt-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {onEditFecha && (
                    <Button type="button" variant="outline" size="sm" onClick={() => onEditFecha(pago)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Editar fecha
                    </Button>
                  )}
                  {onDownloadRecibo && (
                    <Button type="button" variant="outline" size="sm" onClick={() => onDownloadRecibo(pago.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar recibo
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
