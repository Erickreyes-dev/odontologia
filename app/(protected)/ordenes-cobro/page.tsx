import HeaderComponent from "@/components/HeaderComponent";
import { getSessionPermisos } from "@/auth";
import NoAcceso from "@/components/noAccess";
import { Receipt } from "lucide-react";
import { OrdenesCobroPageClient } from "./components/OrdenesCobroPageClient";
import { getOrdenesCobro } from "./actions";
import { getPacientesActivos, getPlanesActivos, getFinanciamientos } from "@/app/(protected)/pagos/actions";

export default async function OrdenesCobroPage() {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_pagos")) {
    return <NoAcceso />;
  }

  const [ordenes, pacientes, planes, financiamientos] = await Promise.all([
    getOrdenesCobro(),
    getPacientesActivos(),
    getPlanesActivos(),
    getFinanciamientos(),
  ]);

  const financiamientosResumen = financiamientos.map((f) => ({
    id: f.id,
    pacienteId: f.pacienteId,
  }));

  return (
    <div className="container mx-auto py-6">
      <HeaderComponent
        Icon={Receipt}
        screenName="Ordenes de Cobro"
        description="Gestion de ordenes de cobro pendientes y pagadas"
      />

      <OrdenesCobroPageClient
        ordenes={ordenes}
        pacientes={pacientes}
        planes={planes}
        financiamientos={financiamientosResumen}
      />
    </div>
  );
}
