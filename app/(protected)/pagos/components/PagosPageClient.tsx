/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarClock, CreditCard, DollarSign } from "lucide-react";
import { DataTable } from "./data-table";
import { FinanciamientoCard } from "./FinanciamientoCard";
import { PagosListMobile } from "./pagos-list-mobile";
import { PagoFormModal } from "./PagoFormModal";
import { FinanciamientoFormModal } from "./FinanciamientoFormModal";
import { getColumns } from "./columns";
import { getReciboByPagoId, revertPago } from "../actions";
import { toast } from "sonner";
import type { PagoWithRelations } from "../schema";
import type { FinanciamientoDetalle } from "../schema";
import type { OrdenCobroWithRelations } from "@/app/(protected)/ordenes-cobro/schema";
import { generateReciboPDF } from "@/lib/pdf/recibo-pdf";
import { useTenantCurrency } from "@/hooks/use-tenant-currency";
import { formatMoneyAmount } from "@/lib/currency-format";

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
    montoTotal: number;
  }[];
  ordenesCobro: OrdenCobroWithRelations[];
  defaultPacienteId?: string;
  clinicInfo: {
    nombre: string;
    correo?: string | null;
    telefono?: string | null;
  };
  cuotasPendientes: {
    pacienteId: string;
    pacienteNombre: string;
    financiamientoId: string;
    cuotasPendientes: { id: string; numero: number; monto: number; fechaVencimiento: Date }[];
    totalPendiente: number;
  }[];
}

export function PagosPageClient({
  pagos,
  financiamientos,
  pacientes,
  cotizaciones,
  planes,
  ordenesCobro,
  defaultPacienteId,
  clinicInfo,
  cuotasPendientes,
}: PagosPageClientProps) {
  const router = useRouter();
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [finModalOpen, setFinModalOpen] = useState(false);
  const currency = useTenantCurrency();

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

  const handleDownloadRecibo = async (pagoId: string) => {
    const recibo = await getReciboByPagoId(pagoId);
    if (!recibo) {
      toast.error("No se encontró recibo para este pago");
      return;
    }

    generateReciboPDF(recibo, clinicInfo);
    toast.success("Recibo generado en PDF");
  };

  const columns = getColumns({ onRevertPago: handleRevert, onDownloadRecibo: handleDownloadRecibo, currency });

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
          <h2 className="text-lg font-semibold mb-3">Cuotas pendientes por cliente</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {cuotasPendientes.map((item) => (
              <div key={item.financiamientoId} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{item.pacienteNombre}</p>
                  <p className="text-sm text-muted-foreground">Fin. #{item.financiamientoId.slice(0, 8)}</p>
                </div>
                <div className="space-y-1">
                  {item.cuotasPendientes.map((cuota) => (
                    <div key={cuota.id} className="text-sm flex justify-between">
                      <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3"/>Cuota {cuota.numero}</span>
                      <span>{formatMoneyAmount(cuota.monto, currency)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm font-semibold">Total pendiente: {formatMoneyAmount(item.totalPendiente, currency)}</p>
              </div>
            ))}
            {cuotasPendientes.length === 0 && (
              <p className="text-muted-foreground col-span-full">No hay cuotas pendientes.</p>
            )}
          </div>
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
          <PagosListMobile pagos={pagos} onDownloadRecibo={handleDownloadRecibo} />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Cuotas pendientes</h2>
          <div className="space-y-3">
            {cuotasPendientes.map((item) => (
              <div key={item.financiamientoId} className="rounded-lg border p-3">
                <p className="font-medium">{item.pacienteNombre}</p>
                <p className="text-xs text-muted-foreground">{item.cuotasPendientes.length} cuotas · {formatMoneyAmount(item.totalPendiente, currency)}</p>
              </div>
            ))}
            {cuotasPendientes.length === 0 && <p className="text-muted-foreground">No hay cuotas pendientes.</p>}
          </div>
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
