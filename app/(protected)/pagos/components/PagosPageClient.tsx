/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign } from "lucide-react";
import { DataTable } from "./data-table";
import { FinanciamientoCard } from "./FinanciamientoCard";
import { PagosListMobile } from "./pagos-list-mobile";
import { PagoFormModal } from "./PagoFormModal";
import { FinanciamientoFormModal } from "./FinanciamientoFormModal";
import { getColumns } from "./columns";
import { revertPago } from "../actions";
import { toast } from "sonner";
import type { PagoWithRelations } from "../schema";
import type { FinanciamientoDetalle } from "../schema";
import type { OrdenCobroWithRelations } from "@/app/(protected)/ordenes-cobro/schema";

interface PagosPageClientProps {
  pagos: PagoWithRelations[];
  financiamientos: FinanciamientoDetalle[];
  pacientes: { id: string; nombre: string; apellido: string }[];
  cotizaciones: {
    id: string;
    total: number;
    pacienteNombre: string;
    pacienteId: string;
    numero?: string;
  }[];
  planes: {
    id: string;
    nombre: string;
    pacienteNombre: string;
    pacienteId: string;
  }[];
  ordenesCobro: OrdenCobroWithRelations[];
  defaultPacienteId?: string;
}

export function PagosPageClient({
  pagos,
  financiamientos,
  pacientes,
  cotizaciones,
  planes,
  ordenesCobro,
  defaultPacienteId,
}: PagosPageClientProps) {
  const router = useRouter();
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [finModalOpen, setFinModalOpen] = useState(false);

  useEffect(() => {
    if (defaultPacienteId) {
      setPagoModalOpen(true);
    }
  }, [defaultPacienteId]);

  const handleRevert = async (id: string) => {
    const result = await revertPago(id);
    if (result.success) {
      toast.success("Pago revertido");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const columns = getColumns({ onRevertPago: handleRevert });

  const refresh = () => router.refresh();

  const financiamientosParaModal = financiamientos.map((f) => ({
    ...f,
    pacienteId: f.pacienteId,
    cuotasLista: f.cuotasLista ?? [],
  }));

  const ordenesPendientes = useMemo(() => {
    return defaultPacienteId
      ? ordenesCobro.filter((o) => o.pacienteId === defaultPacienteId)
      : ordenesCobro;
  }, [ordenesCobro, defaultPacienteId]);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          onClick={() => setPagoModalOpen(true)}
          disabled={ordenesPendientes.length === 0}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Nuevo Pago
        </Button>
        <Button variant="outline" onClick={() => setFinModalOpen(true)}>
          <CreditCard className="h-4 w-4 mr-2" />
          Nuevo Financiamiento
        </Button>
      </div>

      <div className="hidden md:block space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">Historial de Pagos</h2>
          <DataTable columns={columns} data={pagos} />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Financiamientos Activos</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {financiamientos
              .filter((f) => f.estado === "ACTIVO")
              .map((f) => (
                <FinanciamientoCard key={f.id} financiamiento={f} />
              ))}
            {financiamientos.filter((f) => f.estado === "ACTIVO").length === 0 && (
              <p className="text-muted-foreground col-span-full">
                No hay financiamientos activos.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="md:hidden space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">Pagos Recientes</h2>
          <PagosListMobile pagos={pagos} />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Financiamientos</h2>
          <div className="space-y-3">
            {financiamientos
              .filter((f) => f.estado === "ACTIVO")
              .map((f) => (
                <FinanciamientoCard key={f.id} financiamiento={f} />
              ))}
            {financiamientos.filter((f) => f.estado === "ACTIVO").length === 0 && (
              <p className="text-muted-foreground">
                No hay financiamientos activos.
              </p>
            )}
          </div>
        </section>
      </div>

      <PagoFormModal
        open={pagoModalOpen}
        onOpenChange={setPagoModalOpen}
        ordenesCobro={ordenesPendientes.map((orden) => ({
          id: orden.id,
          pacienteNombre: orden.pacienteNombre ?? "",
          monto: orden.monto,
          financiamientoId: orden.financiamientoId,
        }))}
        financiamientos={financiamientosParaModal as any}
        onSuccess={refresh}
      />

      <FinanciamientoFormModal
        open={finModalOpen}
        onOpenChange={setFinModalOpen}
        pacienteId={defaultPacienteId}
        pacientes={pacientes}
        cotizaciones={cotizaciones}
        planes={planes}
        onSuccess={refresh}
      />
    </>
  );
}
