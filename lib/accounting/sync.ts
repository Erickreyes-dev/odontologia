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
        },
      },
    },
  });
  if (!ingreso?.tenantId || !ingreso.consulta) return;

  const medicoId = ingreso.medicoId || ingreso.consulta.cita.medicoId;
  for (const detalle of ingreso.consulta.detalles) {
    const relacion = detalle.servicio.medicosServicios.find((ms) => ms.medicoId === medicoId);
    const porcentaje = money(relacion?.porcentajeHonorario);
    const totalServicio = money(detalle.precioAplicado) * detalle.cantidad;
    const comision = totalServicio * (porcentaje / 100);

    await tx.honorarioMedico.upsert({
      where: { ingresoId_medicoId_servicioId: { ingresoId: ingreso.id, medicoId, servicioId: detalle.servicioId } },
      update: { totalServicio, porcentaje, comision, pacienteId: ingreso.pacienteId, consultaId: ingreso.consultaId },
      create: {
        id: randomUUID(), tenantId: ingreso.tenantId, ingresoId: ingreso.id, medicoId,
        pacienteId: ingreso.pacienteId, consultaId: ingreso.consultaId, servicioId: detalle.servicioId,
        totalServicio, porcentaje, comision, estado: "PENDIENTE",
      },
    });
  }
}

export async function syncIngresoFromPago(pagoId: string, tx: Prisma.TransactionClient = prisma) {
  const pago = await tx.pago.findUnique({
    where: { id: pagoId },
    include: { ordenCobro: { include: { consulta: { include: { cita: true, productos: true } }, paciente: true } } },
  });
  if (!pago?.tenantId) return null;
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
