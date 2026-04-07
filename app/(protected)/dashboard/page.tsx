import { getSessionPermisos } from "@/auth";
import NoAcceso from "@/components/noAccess";
import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant-query";
import { PagoEstado } from "@/lib/generated/prisma";
import { DashboardClient } from "./components/dashboard-client";

export default async function DashboardPage() {

  const permisos = await getSessionPermisos();

  if (!permisos?.includes("ver_pagos")) {
    return <NoAcceso />;
  }

  const [pacientes, consultas, pagos, financiamientos] = await Promise.all([
    prisma.paciente.findMany({
      where: await tenantWhere({ activo: true }),
      select: {
        nombre: true,
        apellido: true,
        genero: true,
        direccion: true,
        fechaNacimiento: true,
      },
    }),
    prisma.consulta.findMany({
      where: await tenantWhere(),
      select: {
        fechaConsulta: true,
        createAt: true,
        detalles: {
          select: {
            cantidad: true,
            servicio: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    }),
    prisma.pago.findMany({
      where: await tenantWhere({ estado: { not: PagoEstado.REVERTIDO } }),
      select: {
        fechaPago: true,
        monto: true,
      },
    }),
    prisma.financiamiento.findMany({
      where: await tenantWhere(),
      select: {
        paciente: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        cuotasFinanciamiento: {
          where: { pagada: false },
          select: {
            monto: true,
          },
        },
      },
    }),
  ]);

  const cuotasPendientes = financiamientos
    .map((fin) => {
      const cuotasFaltantes = fin.cuotasFinanciamiento.length;
      const montoDebe = fin.cuotasFinanciamiento.reduce(
        (acc, cuota) => acc + Number(cuota.monto),
        0
      );

      return {
        cliente: `${fin.paciente.nombre} ${fin.paciente.apellido}`,
        cuotasFaltantes,
        montoDebe,
      };
    })
    .filter((item) => item.cuotasFaltantes > 0);

  return (
    <DashboardClient
      data={{
        pacientes: pacientes.map((p) => ({
          ...p,
          fechaNacimiento: p.fechaNacimiento ? p.fechaNacimiento.toISOString() : null,
        })),
        consultas: consultas.map((consulta) => ({
          fecha: (consulta.fechaConsulta ?? consulta.createAt).toISOString(),
          servicios: consulta.detalles.reduce((acc, d) => acc + d.cantidad, 0),
          detalleServicios: consulta.detalles.map((d) => ({
            nombre: d.servicio.nombre,
            cantidad: d.cantidad,
          })),
        })),
        pagos: pagos.map((pago) => ({
          fechaPago: pago.fechaPago.toISOString(),
          monto: Number(pago.monto),
        })),
        cuotasPendientes,
      }}
    />
  );
}
