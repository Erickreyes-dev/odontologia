import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { MetodoPago, Prisma } from "@/lib/generated/prisma";
import { ensureAccountingCatalogs } from "./catalogs";

function money(value: unknown) {
  return Number(value ?? 0);
}

export async function regenerateHonorariosForIngreso(ingresoId: string, tx: Prisma.TransactionClient = prisma) {
  const ingreso = await tx.ingreso.findUnique({
    where: { id: ingresoId },
    include: {
      consulta: {
        include: {
          cita: true,
          detalles: { include: { servicio: { include: { medicosServicios: true } } } },
          egresos: { where: { servicioId: { not: null } }, select: { servicioId: true, monto: true } },
        },
      },
    },
  });
  if (!ingreso?.tenantId || !ingreso.consulta) return;

  const medicoId = ingreso.medicoId || ingreso.consulta.cita.medicoId;
  const detallesPorServicio = new Map<string, { servicio: typeof ingreso.consulta.detalles[number]["servicio"]; totalBruto: number }>();
  for (const detalle of ingreso.consulta.detalles) {
    const existente = detallesPorServicio.get(detalle.servicioId);
    detallesPorServicio.set(detalle.servicioId, {
      servicio: detalle.servicio,
      // El precio de una consulta puede modificarse, por lo que el honorario
      // siempre debe calcularse desde el detalle y no desde el precio base.
      totalBruto: (existente?.totalBruto ?? 0) + money(detalle.precioAplicado) * detalle.cantidad,
    });
  }

  for (const [servicioId, detalle] of detallesPorServicio) {
    const relacion = detalle.servicio.medicosServicios.find((ms) => ms.medicoId === medicoId);
    const porcentaje = money(relacion?.porcentajeHonorario);
    const costoLaboratorio = ingreso.consulta.egresos
      .filter((egreso) => egreso.servicioId === servicioId)
      .reduce((total, egreso) => total + money(egreso.monto), 0);
    const totalServicio = Math.max(detalle.totalBruto - costoLaboratorio, 0);
    const comision = totalServicio * (porcentaje / 100);

    const honorario = await tx.honorarioMedico.upsert({
      where: { ingresoId_medicoId_servicioId: { ingresoId: ingreso.id, medicoId, servicioId } },
      update: { totalServicio, porcentaje, comision, pacienteId: ingreso.pacienteId, consultaId: ingreso.consultaId },
      create: {
        id: randomUUID(), tenantId: ingreso.tenantId, ingresoId: ingreso.id, medicoId,
        pacienteId: ingreso.pacienteId, consultaId: ingreso.consultaId, servicioId,
        totalServicio, porcentaje, comision, estado: "PENDIENTE",
      },
    });

    await tx.egreso.updateMany({
      where: { tenantId: ingreso.tenantId, referenciaTipo: "HONORARIO", referenciaId: honorario.id },
      data: { monto: comision },
    });
  }
}

export async function regenerateHonorariosForConsulta(consultaId: string, tx: Prisma.TransactionClient = prisma) {
  const ingresos = await tx.ingreso.findMany({
    where: { consultaId },
    select: { id: true },
  });

  for (const ingreso of ingresos) {
    await regenerateHonorariosForIngreso(ingreso.id, tx);
  }
}

export async function syncIngresoFromPago(pagoId: string, tx: Prisma.TransactionClient = prisma) {
  const pago = await tx.pago.findUnique({
    where: { id: pagoId },
    include: { ordenCobro: { include: { consulta: { include: { cita: true, productos: true } }, paciente: true } } },
  });
  if (!pago?.tenantId || pago.esAbono) return null;
  const { tiposIngreso } = await ensureAccountingCatalogs(pago.tenantId, tx);
  const tipoServicio = tiposIngreso.find((t) => t.nombre === "Servicio") ?? tiposIngreso[0];
  const tipoProducto = tiposIngreso.find((t) => t.nombre === "Producto") ?? tipoServicio;
  const consulta = pago.ordenCobro.consulta;
  const tipoIngresoId = consulta?.productos?.length && !consulta.cita ? tipoProducto.id : tipoServicio.id;

  const ingreso = await tx.ingreso.upsert({
    where: { pagoId: pago.id },
    update: {
      tipoIngresoId,
      pacienteId: pago.ordenCobro.pacienteId,
      medicoId: consulta?.cita.medicoId ?? null,
      consultaId: pago.ordenCobro.consultaId,
      fecha: pago.fechaPago,
      concepto: pago.ordenCobro.concepto,
      monto: pago.monto,
      metodoPago: pago.metodo as MetodoPago,
      comentario: pago.comentario,
      origen: "PAGO",
      editable: true,
    },
    create: {
      id: randomUUID(), tenantId: pago.tenantId, tipoIngresoId, pagoId: pago.id,
      pacienteId: pago.ordenCobro.pacienteId, medicoId: consulta?.cita.medicoId ?? null,
      consultaId: pago.ordenCobro.consultaId, fecha: pago.fechaPago, concepto: pago.ordenCobro.concepto,
      monto: pago.monto, metodoPago: pago.metodo as MetodoPago, comentario: pago.comentario, origen: "PAGO", editable: true,
    },
  });
  await regenerateHonorariosForIngreso(ingreso.id, tx);
  return ingreso;
}
