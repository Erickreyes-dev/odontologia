"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { MoreHorizontal, Eye, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { PlanTratamiento, ESTADOS_PLAN } from "../schema";
import { Progress } from "@/components/ui/progress";
import { sendPlanTratamientoEmail, sendPlanTratamientoWhatsapp } from "../actions";

const getEstadoBadge = (estado: string) => {
  const estadoInfo = ESTADOS_PLAN.find((e) => e.value === estado);
  const label = estadoInfo?.label || estado;

  switch (estado) {
    case "ACTIVO":
      return (
        <Badge variant="outline" className="">
          {label}
        </Badge>
      );
    case "PAUSADO":
      return (
        <Badge variant="outline" className="">
          {label}
        </Badge>
      );
    case "COMPLETADO":
      return (
        <Badge variant="outline" className="">
          {label}
        </Badge>
      );
    case "CANCELADO":
      return (
        <Badge variant="outline" className="">
          {label}
        </Badge>
      );
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
};

export const columns: ColumnDef<PlanTratamiento>[] = [
  {
    accessorKey: "pacienteNombre",
    header: "Paciente",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("pacienteNombre")}</div>
    ),
  },
  {
    accessorKey: "nombre",
    header: "Plan de Tratamiento",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("nombre")}</div>
        {row.original.descripcion && (
          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
            {row.original.descripcion}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => getEstadoBadge(row.getValue("estado")),
  },
  {
    accessorKey: "fechaInicio",
    header: "Fecha Inicio",
    cell: ({ row }) => {
      const fecha = row.getValue("fechaInicio") as Date;
      return fecha
        ? format(new Date(fecha), "PPP", { locale: es })
        : "-";
    },
  },
  {
    accessorKey: "totalEtapas",
    header: "Etapas",
    cell: ({ row }) => (
      <div className="text-center">{row.original.totalEtapas || 0}</div>
    ),
  },
  {
    id: "progreso",
    header: "Progreso",
    cell: ({ row }) => {
      const total = row.original.totalSeguimientos || 0;
      const completados = row.original.seguimientosCompletados || 0;
      const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          <Progress value={porcentaje} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground w-12">
            {completados}/{total}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const plan = row.original;
      return <ActionsCell plan={plan} />;
    },
  },
];

function ActionsCell({ plan }: { plan: PlanTratamiento }) {
  const router = useRouter();

  const handleSendEmail = async () => {
    if (!plan.id) return;

    const result = await sendPlanTratamientoEmail(plan.id);
    if (result.success) {
      toast.success("Plan enviado", {
        description: "El plan fue enviado por correo al paciente.",
      });
      router.refresh();
      return;
    }

    toast.error("No se pudo enviar el correo", {
      description: result.error,
    });
  };

  const handleSendWhatsapp = async () => {
    if (!plan.id) return;

    const result = await sendPlanTratamientoWhatsapp(plan.id);
    if (result.success) {
      toast.success("Plan enviado", {
        description: "El documento del plan fue enviado por WhatsApp.",
      });
      router.refresh();
      return;
    }

    toast.error("No se pudo enviar por WhatsApp", {
      description: result.error,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleSendEmail}>Enviar por email</DropdownMenuItem>
        <DropdownMenuItem onClick={handleSendWhatsapp}>Enviar por WhatsApp</DropdownMenuItem>
        <DropdownMenuSeparator />
        <Link href={`/planes-tratamiento/${plan.id}`}>
          <DropdownMenuItem className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalle
          </DropdownMenuItem>
        </Link>
        {plan.estado === "ACTIVO" && (
          <Link href={`/planes-tratamiento/${plan.id}/edit`}>
            <DropdownMenuItem className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          </Link>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
