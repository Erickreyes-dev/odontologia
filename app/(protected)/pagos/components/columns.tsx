"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, MoreHorizontal, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PagoWithRelations } from "../schema";
import { METODOS_PAGO, ESTADOS_PAGO } from "../schema";
import { sendPagoEmail } from "../actions";
import { formatMoneyAmount, type TenantCurrencyDisplay } from "@/lib/currency-format";

type GetColumnsOptions = {
  onRevertPago?: (id: string) => void;
  onDownloadRecibo?: (id: string) => void;
  currency?: TenantCurrencyDisplay;
};

export function getColumns(options?: GetColumnsOptions): ColumnDef<PagoWithRelations>[] {
  const { onRevertPago, onDownloadRecibo, currency = { symbol: "L", currency: "HNL", locale: "es-HN" } } = options ?? {};

const getMetodoLabel = (metodo: string) =>
  METODOS_PAGO.find((m) => m.value === metodo)?.label ?? metodo;

const getEstadoBadge = (estado: string) => {
  const info = ESTADOS_PAGO.find((e) => e.value === estado);

  switch (estado) {
    case "REGISTRADO":
      return (
        <Badge variant="outline" className="">
          {info?.label ?? estado}
        </Badge>
      );
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
      return <Badge variant="outline">{info?.label ?? estado}</Badge>;
  }
};

  return [
  {
    accessorKey: "pacienteNombre",
    header: "Paciente",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.pacienteNombre ?? "-"}</div>
    ),
  },
  {
    accessorKey: "monto",
    header: "Monto",
    cell: ({ row }) => (
      <div className="font-mono">{formatMoneyAmount(Number(row.getValue("monto")), currency)}</div>
    ),
  },
  {
    accessorKey: "metodo",
    header: "Método",
    cell: ({ row }) => getMetodoLabel(row.getValue("metodo")),
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => getEstadoBadge(row.getValue("estado")),
  },
  {
    accessorKey: "fechaPago",
    header: "Fecha",
    cell: ({ row }) => {
      const fecha = row.getValue("fechaPago") as Date;
      return fecha
        ? format(new Date(fecha), "PP", { locale: es })
        : "-";
    },
  },
  {
    id: "origen",
    header: "Origen",
    cell: ({ row }) => {
      const p = row.original;
      const ref = p.ordenRef || p.financiamientoRef || "-";
      return <span className="text-sm text-muted-foreground">{ref}</span>;
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const pago = row.original;

      return (
        <ActionsCell
          pago={pago}
          onDownloadRecibo={onDownloadRecibo}
          onRevertPago={onRevertPago}
        />
      );
    },
  },
];
}

function ActionsCell({
  pago,
  onRevertPago,
  onDownloadRecibo,
}: {
  pago: PagoWithRelations;
  onRevertPago?: (id: string) => void;
  onDownloadRecibo?: (id: string) => void;
}) {
  const router = useRouter();

  const handleSendEmail = async () => {
    const result = await sendPagoEmail(pago.id);
    if (result.success) {
      toast.success("Pago enviado", {
        description: "El comprobante de pago fue enviado por correo al paciente.",
      });
      router.refresh();
      return;
    }

    toast.error("No se pudo enviar el correo", {
      description: result.error,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleSendEmail}>Enviar por email</DropdownMenuItem>
        <DropdownMenuSeparator />
        {onDownloadRecibo && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => onDownloadRecibo(pago.id)}
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar recibo PDF
          </DropdownMenuItem>
        )}
        {pago.estado === "REGISTRADO" && onRevertPago && (
          <DropdownMenuItem
            className="cursor-pointer text-amber-600"
            onClick={() => onRevertPago(pago.id)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Revertir pago
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns = getColumns();
