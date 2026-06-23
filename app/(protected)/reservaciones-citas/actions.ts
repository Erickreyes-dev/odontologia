"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere } from "@/lib/tenant-query";

export type ReservacionCita = {
  id: string;
  fechaSolicitada: Date;
  nombrePaciente: string;
  correoPaciente: string;
  telefonoPaciente: string;
  motivo: string;
  createAt: Date;
};

export async function getReservacionesCitas(): Promise<ReservacionCita[]> {
  const solicitudes = await prisma.solicitudCitaPublica.findMany({
    where: await tenantWhere<Prisma.SolicitudCitaPublicaWhereInput>(),
    orderBy: [{ createAt: "desc" }, { fechaSolicitada: "asc" }],
  });

  return solicitudes.map((solicitud) => ({
    id: solicitud.id,
    fechaSolicitada: solicitud.fechaSolicitada,
    nombrePaciente: solicitud.nombrePaciente,
    correoPaciente: solicitud.correoPaciente,
    telefonoPaciente: solicitud.telefonoPaciente,
    motivo: solicitud.motivo,
    createAt: solicitud.createAt,
  }));
}
