"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "./data-table";
import { getColumns } from "./columns";
import { OrdenCobroFormModal } from "./OrdenCobroFormModal";
import type { OrdenCobroWithRelations } from "../schema";
import { anularOrdenCobro } from "../actions";
import OrdenesCobroListMobile from "./ordenes-cobro-list-mobile";
import { PagoFormModal } from "@/app/(protected)/pagos/components/PagoFormModal";

interface OrdenesCobroPageClientProps {
  ordenes: OrdenCobroWithRelations[];
  pacientes: { id: string; nombre: string; apellido: string }[];
  planes: { id: string; nombre: string; pacienteId: string }[];
  financiamientos: { id: string; pacienteId: string }[];
}

export function OrdenesCobroPageClient({
  ordenes,
  pacientes,
  financiamientos,
}: OrdenesCobroPageClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [selectedOrdenId, setSelectedOrdenId] = useState<string | undefined>(undefined);

  const handleAnular = async (id: string) => {
    const result = await anularOrdenCobro(id);
    if (result.success) {
      toast.success("Orden anulada");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handlePagar = (ordenId: string) => {
    setSelectedOrdenId(ordenId);
    setPagoModalOpen(true);
  };

  const columns = getColumns({ onAnular: handleAnular, onPagar: handlePagar });
  const pacientesById = useMemo(() => new Map(pacientes.map((paciente) => [paciente.id, paciente])), [pacientes]);
  const ordenesPendientes = useMemo(
    () =>
      ordenes
        .filter((orden) => orden.estado === "PENDIENTE")
        .map((orden) => ({
          id: orden.id,
          pacienteNombre: orden.pacienteNombre ?? "Paciente",
          monto: orden.monto,
          financiamientoId: orden.financiamientoId ?? null,
        })),
    [ordenes],
  );
  const ordenSeleccionada = ordenesPendientes.find((orden) => orden.id === selectedOrdenId);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={() => setModalOpen(true)}>
          <Receipt className="h-4 w-4 mr-2" />
          Nueva Orden de Cobro
        </Button>
      </div>

      <div className="hidden md:block">
        <DataTable columns={columns} data={ordenes} />
      </div>
      <div className="block md:hidden">
        <OrdenesCobroListMobile ordenes={ordenes} onAnular={handleAnular} onPagar={handlePagar} />
      </div>

      <OrdenCobroFormModal
        open={modalOpen}
        onOpenChange={(open) => setModalOpen(open)}
        pacientes={pacientes}
        onSuccess={() => {
          setModalOpen(false);
          router.refresh();
        }}
      />

      <PagoFormModal
        open={pagoModalOpen}
        onOpenChange={(open) => {
          setPagoModalOpen(open);
          if (!open) {
            setSelectedOrdenId(undefined);
          }
        }}
        ordenesCobro={ordenesPendientes}
        ordenCobroId={ordenSeleccionada?.id}
        monto={ordenSeleccionada?.monto}
        financiamientos={financiamientos.map((financiamiento) => {
          const paciente = pacientesById.get(financiamiento.pacienteId);
          return {
            id: financiamiento.id,
            pacienteId: financiamiento.pacienteId,
            pacienteNombre: paciente ? `${paciente.nombre} ${paciente.apellido}`.trim() : "Paciente",
          };
        })}
        onSuccess={() => {
          setPagoModalOpen(false);
          setSelectedOrdenId(undefined);
          router.refresh();
        }}
      />
    </>
  );
}
