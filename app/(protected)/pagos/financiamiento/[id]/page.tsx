import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { DollarSign } from "lucide-react";
import { getFinanciamientoDetalle } from "../../actions";
import { notFound } from "next/navigation";
import { FinanciamientoDetalleClient } from "../../components/FinanciamientoDetalleClient";
import { getOrdenesCobroPendientes } from "@/app/(protected)/ordenes-cobro/actions";

export default async function FinanciamientoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_pagos")) {
    return <NoAcceso />;
  }

  const { id } = await params;
  const [financiamiento, ordenesCobro] = await Promise.all([
    getFinanciamientoDetalle(id),
    getOrdenesCobroPendientes(),
  ]);

  if (!financiamiento) {
    notFound();
  }

  const financiamientosConEste = [
    {
      ...financiamiento,
      pacienteNombre: financiamiento.pacienteNombre ?? "",
      cuotasLista: financiamiento.cuotasLista ?? [],
    },
  ];

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={DollarSign}
        description="Detalle del financiamiento y registro de pagos."
        screenName="Detalle Financiamiento"
      />

      <FinanciamientoDetalleClient
        financiamiento={financiamiento}
        financiamientosParaPago={financiamientosConEste}
        ordenesCobro={ordenesCobro}
      />
    </div>
  );
}
