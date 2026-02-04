/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSessionPermisos } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import NoAcceso from "@/components/noAccess";
import { DollarSign } from "lucide-react";
import {
  getPagos,
  getPacientesActivos,
  getCotizacionesAceptadas,
  getPlanesActivos,
  getFinanciamientosPorPaciente,
  getFinanciamientos,
} from "./actions";
import { PagosPageClient } from "./components/PagosPageClient";
import { getOrdenesCobroPendientes } from "@/app/(protected)/ordenes-cobro/actions";

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ pacienteId?: string }>;
}) {
  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_pagos")) {
    return <NoAcceso />;
  }

  const params = await searchParams;
  const pacienteIdFromUrl = params?.pacienteId;

  // 1. Obtenemos los datos de las acciones
  const [pagos, financiamientos, pacientes, rawCotizaciones, rawPlanes, ordenesCobro] =
    await Promise.all([
      getPagos(),
      pacienteIdFromUrl
        ? getFinanciamientosPorPaciente(pacienteIdFromUrl)
        : getFinanciamientos(),
      getPacientesActivos(),
      getCotizacionesAceptadas(),
      getPlanesActivos(),
      getOrdenesCobroPendientes(),
    ]);

  // 2. Mapeamos para asegurar que pacienteId exista (si la base de datos no lo devuelve con ese nombre exacto)
  // Nota: Ajusta 'c.pacienteId' o 'p.pacienteId' según el nombre real del campo en tu DB (ej. c.idPaciente)
  const cotizaciones = rawCotizaciones.map((c: any) => ({
    ...c,
    pacienteId: c.pacienteId || "", // Asegura que el contrato de TS se cumpla
  }));

  const planes = rawPlanes.map((p: any) => ({
    ...p,
    pacienteId: p.pacienteId || "", // Asegura que el contrato de TS se cumpla
  }));

  return (
    <div className="container mx-auto py-2">
      <HeaderComponent
        Icon={DollarSign}
        description="Gestiona pagos y financiamientos de los pacientes."
        screenName="Pagos y Financiamiento"
      />

      <PagosPageClient
        pagos={pagos}
        financiamientos={financiamientos}
        pacientes={pacientes}
        cotizaciones={cotizaciones} // Ahora tiene pacienteId
        planes={planes}             // Ahora tiene pacienteId
        ordenesCobro={ordenesCobro}
        defaultPacienteId={pacienteIdFromUrl}
      />
    </div>
  );
}
