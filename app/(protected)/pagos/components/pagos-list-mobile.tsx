"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PagoWithRelations } from "../schema";
import { METODOS_PAGO, ESTADOS_PAGO } from "../schema";
import { Download } from "lucide-react";

interface PagosListMobileProps {
  pagos: PagoWithRelations[];
  onDownloadRecibo?: (pagoId: string) => void;
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

export function PagosListMobile({ pagos, onDownloadRecibo }: PagosListMobileProps) {
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
                <p className="font-mono font-medium">
                  L {pago.monto.toLocaleString("es-HN")}
                </p>
                {getEstadoBadge(pago.estado)}
              </div>
            </div>
            {onDownloadRecibo && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onDownloadRecibo(pago.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar recibo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
