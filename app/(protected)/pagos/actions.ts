"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";
import {
  CreateFinanciamientoSchema,
  CreatePagoSchema,
  type CreateFinanciamientoInput,
  type CreatePagoInput,
  PagoWithRelations,
  FinanciamientoDetalle,
} from "./schema";
import { MetodoPago, PagoEstado, FinanciamientoEstado } from "@/lib/generated/prisma";

const CENTRAL_AMERICA_OFFSET_MS = 6 * 60 * 60 * 1000;

const toCentralAmericaTime = (date?: Date | null) =>
  date ? new Date(date.getTime() - CENTRAL_AMERICA_OFFSET_MS) : date;

async function calcularTotalPlan(planTratamientoId: string): Promise<number> {
  const plan = await prisma.planTratamiento.findUnique({
    where: { id: planTratamientoId },
    include: {
      etapas: {
        include: { servicios: { include: { servicio: true } } },
      },
    },
  });

  if (!plan) return 0;

  return plan.etapas.reduce((acc, etapa) => {
    const subtotal = etapa.servicios.reduce((sum, servicio) => {
      const precio = Number(servicio.precioAplicado ?? servicio.servicio.precioBase);
      return sum + precio * servicio.cantidad;
    }, 0);
    return acc + subtotal;
  }, 0);
}

/**
 * Crea un financiamiento y genera las cuotas automáticamente
 */
export async function createFinanciamiento(
  data: CreateFinanciamientoInput
): Promise<
  | { success: true; data: FinanciamientoDetalle }
  | { success: false; error: string }
> {
  try {
    const montoPlan =
      data.planTratamientoId ? await calcularTotalPlan(data.planTratamientoId) : null;
    const validated = CreateFinanciamientoSchema.parse({
      ...data,
      montoTotal: montoPlan && montoPlan > 0 ? montoPlan : data.montoTotal,
    });
    const anticipo = Number(validated.anticipo);
    const montoTotal = Number(validated.montoTotal);
    const interes = Number(validated.interes);
    const cuotas = validated.cuotas;
    const saldoInicial = montoTotal - anticipo;

    if (saldoInicial <= 0) {
      return { success: false, error: "El monto total debe ser mayor al anticipo" };
    }

    const montoConInteres = saldoInicial * (1 + interes / 100);
    const montoPorCuota = montoConInteres / cuotas;

    const result = await prisma.$transaction(async (tx) => {
      const financiamiento = await tx.financiamiento.create({
        data: {
          id: randomUUID(),
          pacienteId: validated.pacienteId,
          cotizacionId: validated.cotizacionId || null,
          planTratamientoId: validated.planTratamientoId || null,
          montoTotal,
          anticipo,
          saldo: saldoInicial,
          cuotas,
          interes,
          fechaInicio: validated.fechaInicio,
          estado: FinanciamientoEstado.ACTIVO,
        },
        include: { paciente: true },
      });

      const cuotasLista = [];
      for (let i = 1; i <= cuotas; i++) {
        const fechaVenc = addMonths(validated.fechaInicio, i);
        const cuota = await tx.cuotaFinanciamiento.create({
          data: {
            id: randomUUID(),
            financiamientoId: financiamiento.id,
            numero: i,
            monto: montoPorCuota,
            fechaVencimiento: fechaVenc,
            pagada: false,
          },
        });
        cuotasLista.push({
          id: cuota.id,
          financiamientoId: cuota.financiamientoId,
          numero: cuota.numero,
          monto: Number(cuota.monto),
          fechaVencimiento: cuota.fechaVencimiento,
          pagada: cuota.pagada,
          fechaPago: cuota.fechaPago,
          pagoId: cuota.pagoId,
        });
      }

      return {
        ...financiamiento,
        pacienteNombre: `${financiamiento.paciente.nombre} ${financiamiento.paciente.apellido}`,
        cuotasLista,
        totalPagado: anticipo,
      };
    });

    revalidatePath("/pagos");
    revalidatePath(`/pacientes/${validated.pacienteId}/perfil`);

    return {
      success: true,
      data: {
        id: result.id,
        pacienteId: result.pacienteId,
        cotizacionId: result.cotizacionId,
        planTratamientoId: result.planTratamientoId,
        montoTotal: Number(result.montoTotal),
        anticipo: Number(result.anticipo),
        saldo: Number(result.saldo),
        cuotas: result.cuotas,
        interes: Number(result.interes),
        fechaInicio: result.fechaInicio,
        fechaFin: result.fechaFin,
        estado: result.estado,
        pacienteNombre: result.pacienteNombre,
        cuotasLista: result.cuotasLista,
        totalPagado: result.totalPagado,
      },
    };
  } catch (error) {
    console.error("Error al crear financiamiento:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear financiamiento",
    };
  }
}

/**
 * Crea un pago. Si está vinculado a financiamiento/cuota, marca la cuota como pagada y actualiza el saldo.
 */
export async function createPago(
 data: CreatePagoInput
): Promise<{ success: true; data: PagoWithRelations } | { success: false; error: string }> {
  try {
    const validated = CreatePagoSchema.parse(data);
    const monto = validated.monto;

    const pago = await prisma.$transaction(async (tx) => {
      const orden = await tx.ordenDeCobro.findUnique({
        where: { id: validated.ordenCobroId },
        include: { financiamiento: true, paciente: true },
      });

      if (!orden) {
        throw new Error("Orden de cobro no encontrada");
      }

      if (orden.estado !== "PENDIENTE") {
        throw new Error("La orden de cobro no está pendiente de pago");
      }

      const pagoCreado = await tx.pago.create({
        data: {
          id: randomUUID(),
          ordenCobroId: validated.ordenCobroId,
          monto,
          metodo: validated.metodo as MetodoPago,
          referencia: validated.referencia || null,
          comentario: validated.comentario || null,
          estado: PagoEstado.REGISTRADO,
        },
      });

      let estadoFinal = PagoEstado.REGISTRADO;

      if (orden.financiamientoId && validated.cuotaId) {
        const cuota = await tx.cuotaFinanciamiento.findFirst({
          where: {
            id: validated.cuotaId,
            financiamientoId: orden.financiamientoId,
            pagada: false,
          },
          include: { financiamiento: true },
        });

        if (cuota && Number(cuota.monto) <= monto) {
          const montoCuota = Number(cuota.monto);
          await tx.cuotaFinanciamiento.update({
            where: { id: cuota.id },
            data: {
              pagada: true,
              fechaPago: new Date(),
              pagoId: pagoCreado.id,
            },
          });

          const nuevoSaldo = Number(cuota.financiamiento.saldo) - montoCuota;
          await tx.financiamiento.update({
            where: { id: cuota.financiamientoId },
            data: {
              saldo: nuevoSaldo,
              estado:
                nuevoSaldo <= 0 ? FinanciamientoEstado.PAGADO : FinanciamientoEstado.ACTIVO,
            },
          });

          await tx.pago.update({
            where: { id: pagoCreado.id },
            data: { estado: PagoEstado.REGISTRADO },
          });
          estadoFinal = PagoEstado.REGISTRADO;
        }
      } else if (orden.financiamientoId && !validated.cuotaId) {
        const cuotasPendientes = await tx.cuotaFinanciamiento.findMany({
          where: {
            financiamientoId: orden.financiamientoId,
            pagada: false,
          },
          orderBy: { numero: "asc" },
          include: { financiamiento: true },
        });

        let montoRestante = monto;
        for (const cuota of cuotasPendientes) {
          if (montoRestante <= 0) break;
          const montoCuota = Number(cuota.monto);
          if (montoRestante >= montoCuota) {
            await tx.cuotaFinanciamiento.update({
              where: { id: cuota.id },
              data: {
                pagada: true,
                fechaPago: new Date(),
                pagoId: pagoCreado.id,
              },
            });
            montoRestante -= montoCuota;

            const nuevoSaldo = Number(cuota.financiamiento.saldo) - montoCuota;
            await tx.financiamiento.update({
              where: { id: cuota.financiamientoId },
              data: {
                saldo: nuevoSaldo,
                estado:
                  nuevoSaldo <= 0 ? FinanciamientoEstado.PAGADO : FinanciamientoEstado.ACTIVO,
              },
            });
          }
        }
        if (montoRestante < monto) {
          await tx.pago.update({
            where: { id: pagoCreado.id },
            // Ajusta el update para reflejar correctamente el estado "APLICADO" si hubo aplicación parcial del pago
            // Ajusta el update para reflejar correctamente el estado "REGISTRADO" si hubo aplicación parcial del pago
            data: { estado: PagoEstado.REGISTRADO },
          });
          estadoFinal = PagoEstado.REGISTRADO;
        }
      }

      await tx.ordenDeCobro.update({
        where: { id: orden.id },
        data: { estado: "PAGADA", fechaPago: new Date() },
      });

      return { ...pagoCreado, estado: estadoFinal, ordenPacienteId: orden.pacienteId };
    });

    const pagoCompleto = await getPagoById(pago.id);
    if (pagoCompleto) {
      revalidatePath("/pagos");
      revalidatePath("/ordenes-cobro");
      if (pago.ordenPacienteId) {
        revalidatePath(`/pacientes/${pago.ordenPacienteId}/perfil`);
      }
      return { success: true, data: pagoCompleto };
    }

    return {
      success: false,
      error: "Error al obtener el pago creado",
    };
  } catch (error) {
    console.error("Error al crear pago:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear pago",
    };
  }
}

/**
 * Obtiene todos los pagos de un paciente con relaciones
 */
export async function getPagosByPaciente(
  pacienteId: string
): Promise<PagoWithRelations[]> {
  try {
    const records = await prisma.pago.findMany({
      where: { ordenCobro: { pacienteId } },
      include: {
        ordenCobro: {
          include: {
            paciente: true,
            financiamiento: true,
          },
        },
      },
      orderBy: { fechaPago: "desc" },
    });

    return records.map((r) => mapPagoToWithRelations(r));
  } catch (error) {
    console.error("Error al obtener pagos del paciente:", error);
    return [];
  }
}

/**
 * Obtiene todos los pagos
 */
export async function getPagos(): Promise<PagoWithRelations[]> {
  try {
    const records = await prisma.pago.findMany({
      include: {
        ordenCobro: {
          include: {
            paciente: true,
            financiamiento: true,
          },
        },
      },
      orderBy: { fechaPago: "desc" },
    });

    return records.map((r) => mapPagoToWithRelations(r));
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return [];
  }
}

/**
 * Obtiene un pago por ID
 */
export async function getPagoById(id: string): Promise<PagoWithRelations | null> {
  try {
    const r = await prisma.pago.findUnique({
      where: { id },
      include: {
        ordenCobro: {
          include: {
            paciente: true,
            financiamiento: true,
          },
        },
      },
    });
    return r ? mapPagoToWithRelations(r) : null;
  } catch (error) {
    console.error("Error al obtener pago:", error);
    return null;
  }
}

function mapPagoToWithRelations(r: {
  id: string;
  monto: unknown;
  metodo: string;
  referencia: string | null;
  fechaPago: Date;
  estado: string;
  comentario: string | null;
  ordenCobroId: string;
  ordenCobro?: {
    paciente?: { nombre: string; apellido: string } | null;
    financiamiento?: { id: string } | null;
  } | null;
}): PagoWithRelations {
  return {
    id: r.id,
    monto: Number(r.monto),
    metodo: r.metodo,
    referencia: r.referencia,
    fechaPago: toCentralAmericaTime(r.fechaPago) ?? r.fechaPago,
    estado: r.estado,
    comentario: r.comentario,
    ordenCobroId: r.ordenCobroId,
    pacienteNombre: r.ordenCobro?.paciente
      ? `${r.ordenCobro.paciente.nombre} ${r.ordenCobro.paciente.apellido}`
      : undefined,
    financiamientoRef: r.ordenCobro?.financiamiento
      ? `Fin. #${r.ordenCobro.financiamiento.id.slice(0, 8)}`
      : undefined,
    ordenRef: `Orden #${r.ordenCobroId.slice(0, 8)}`,
  };
}

/**
 * Obtiene el detalle de un financiamiento con cuotas y pagos
 */
export async function getFinanciamientoDetalle(
  financiamientoId: string
): Promise<FinanciamientoDetalle | null> {
  try {
    const r = await prisma.financiamiento.findUnique({
      where: { id: financiamientoId },
      include: {
        paciente: true,
        cuotasFinanciamiento: { orderBy: { numero: "asc" } },
      },
    });

    if (!r) return null;

    const cuotasPagadas = r.cuotasFinanciamiento.filter((c) => c.pagada);
    const totalPagado =
      Number(r.anticipo) +
      cuotasPagadas.reduce((acc, c) => acc + Number(c.monto), 0);

    return {
      id: r.id,
      pacienteId: r.pacienteId,
      cotizacionId: r.cotizacionId,
      planTratamientoId: r.planTratamientoId,
      montoTotal: Number(r.montoTotal),
      anticipo: Number(r.anticipo),
      saldo: Number(r.saldo),
      cuotas: r.cuotas,
      interes: Number(r.interes),
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
      estado: r.estado,
      pacienteNombre: `${r.paciente.nombre} ${r.paciente.apellido}`,
      cuotasLista: r.cuotasFinanciamiento.map((c) => ({
        id: c.id,
        financiamientoId: c.financiamientoId,
        numero: c.numero,
        monto: Number(c.monto),
        fechaVencimiento: c.fechaVencimiento,
        pagada: c.pagada,
        fechaPago: toCentralAmericaTime(c.fechaPago),
        pagoId: c.pagoId,
      })),
      totalPagado,
    };
  } catch (error) {
    console.error("Error al obtener detalle de financiamiento:", error);
    return null;
  }
}

/**
 * Obtiene todos los financiamientos (activos)
 */
export async function getFinanciamientos(): Promise<FinanciamientoDetalle[]> {
  try {
    const records = await prisma.financiamiento.findMany({
      include: {
        paciente: true,
        cuotasFinanciamiento: { orderBy: { numero: "asc" } },
      },
      orderBy: { createAt: "desc" },
    });

    return records.map((r) => {
      const cuotasPagadas = r.cuotasFinanciamiento.filter((c) => c.pagada);
      const totalPagado =
        Number(r.anticipo) +
        cuotasPagadas.reduce((acc, c) => acc + Number(c.monto), 0);
      return {
        id: r.id,
        pacienteId: r.pacienteId,
        cotizacionId: r.cotizacionId,
        planTratamientoId: r.planTratamientoId,
        montoTotal: Number(r.montoTotal),
        anticipo: Number(r.anticipo),
        saldo: Number(r.saldo),
        cuotas: r.cuotas,
        interes: Number(r.interes),
        fechaInicio: r.fechaInicio,
        fechaFin: r.fechaFin,
        estado: r.estado,
        pacienteNombre: `${r.paciente.nombre} ${r.paciente.apellido}`,
        cuotasLista: r.cuotasFinanciamiento.map((c) => ({
          id: c.id,
          financiamientoId: c.financiamientoId,
          numero: c.numero,
          monto: Number(c.monto),
          fechaVencimiento: c.fechaVencimiento,
          pagada: c.pagada,
          fechaPago: toCentralAmericaTime(c.fechaPago),
          pagoId: c.pagoId,
        })),
        totalPagado,
      };
    });
  } catch (error) {
    console.error("Error al obtener financiamientos:", error);
    return [];
  }
}
export async function getFinanciamientosPorPaciente( pacienteId: string): Promise<FinanciamientoDetalle[]> {
  try {
    const records = await prisma.financiamiento.findMany({
      where: { pacienteId: pacienteId },
      include: {
        paciente: true,
        cuotasFinanciamiento: { orderBy: { numero: "asc" } },
      },
      orderBy: { createAt: "desc" },
    });

    return records.map((r) => {
      const cuotasPagadas = r.cuotasFinanciamiento.filter((c) => c.pagada);
      const totalPagado =
        Number(r.anticipo) +
        cuotasPagadas.reduce((acc, c) => acc + Number(c.monto), 0);
      return {
        id: r.id,
        pacienteId: r.pacienteId,
        cotizacionId: r.cotizacionId,
        planTratamientoId: r.planTratamientoId,
        montoTotal: Number(r.montoTotal),
        anticipo: Number(r.anticipo),
        saldo: Number(r.saldo),
        cuotas: r.cuotas,
        interes: Number(r.interes),
        fechaInicio: r.fechaInicio,
        fechaFin: r.fechaFin,
        estado: r.estado,
        pacienteNombre: `${r.paciente.nombre} ${r.paciente.apellido}`,
        cuotasLista: r.cuotasFinanciamiento.map((c) => ({
          id: c.id,
          financiamientoId: c.financiamientoId,
          numero: c.numero,
          monto: Number(c.monto),
          fechaVencimiento: c.fechaVencimiento,
          pagada: c.pagada,
          fechaPago: toCentralAmericaTime(c.fechaPago),
          pagoId: c.pagoId,
        })),
        totalPagado,
      };
    });
  } catch (error) {
    console.error("Error al obtener financiamientos:", error);
    return [];
  }
}

/**
 * Revierte un pago (marca REVERTIDO y ajusta cuotas/saldo)
 */
export async function revertPago(
  pagoId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: { cuotas: true, ordenCobro: true },
    });

    if (!pago) return { success: false, error: "Pago no encontrado" };
    if (pago.estado === PagoEstado.REVERTIDO) {
      return { success: false, error: "El pago ya está revertido" };
    }

    await prisma.$transaction(async (tx) => {
      if (pago.cuotas && pago.cuotas.length > 0 && pago.ordenCobro?.financiamientoId) {
        const financiamiento = await tx.financiamiento.findUnique({
          where: { id: pago.ordenCobro.financiamientoId },
        });
        if (financiamiento) {
          let saldoAjustar = 0;
          for (const cuota of pago.cuotas) {
            await tx.cuotaFinanciamiento.update({
              where: { id: cuota.id },
              data: { pagada: false, fechaPago: null, pagoId: null },
            });
            saldoAjustar += Number(cuota.monto);
          }
          const nuevoSaldo = Number(financiamiento.saldo) + saldoAjustar;
          await tx.financiamiento.update({
            where: { id: pago.ordenCobro.financiamientoId },
            data: {
              saldo: nuevoSaldo,
              estado: FinanciamientoEstado.ACTIVO,
            },
          });
        }
      }

      await tx.ordenDeCobro.update({
        where: { id: pago.ordenCobroId },
        data: { estado: "PENDIENTE", fechaPago: null },
      });

      await tx.pago.update({
        where: { id: pagoId },
        data: { estado: PagoEstado.REVERTIDO },
      });
    });

    revalidatePath("/pagos");
    revalidatePath("/ordenes-cobro");
    if (pago.ordenCobro?.pacienteId) {
      revalidatePath(`/pacientes/${pago.ordenCobro.pacienteId}/perfil`);
    }
    return { success: true };
  } catch (error) {
    console.error("Error al revertir pago:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al revertir pago",
    };
  }
}

/**
 * Obtiene pacientes activos para selects
 */
export async function getPacientesActivos(): Promise<
  { id: string; nombre: string; apellido: string }[]
> {
  try {
    const pacientes = await prisma.paciente.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, apellido: true },
      orderBy: { nombre: "asc" },
    });
    return pacientes;
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    return [];
  }
}

/**
 * Obtiene cotizaciones aceptadas para select
 */
export async function getCotizacionesAceptadas(): Promise<
  { id: string; total: number; pacienteNombre: string }[]
> {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      where: { estado: "aceptada" },
      include: { paciente: { select: { nombre: true, apellido: true } } },
    });
    return cotizaciones.map((c) => ({
      id: c.id,
      total: Number(c.total),
      pacienteId: c.pacienteId,
      pacienteNombre: `${c.paciente.nombre} ${c.paciente.apellido}`,
    }));
  } catch (error) {
    console.error("Error al obtener cotizaciones:", error);
    return [];
  }
}

/**
 * Obtiene planes de tratamiento activos para select
 */
export async function getPlanesActivos(): Promise<
  { id: string; nombre: string; pacienteNombre: string; pacienteId: string; montoTotal: number }[]
> {
  try {
    const planes = await prisma.planTratamiento.findMany({
      where: { estado: "ACTIVO" },
      select: {
        id: true,
        nombre: true,
        paciente: { select: { nombre: true, apellido: true, id: true } },
        etapas: {
          select: {
            servicios: {
              select: { precioAplicado: true, cantidad: true, servicio: { select: { precioBase: true } } },
            },
          },
        },
      },
      orderBy: { nombre: "asc" },
    });
    return planes.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      pacienteId: p.paciente.id,
      pacienteNombre: `${p.paciente.nombre} ${p.paciente.apellido}`,
      montoTotal: p.etapas.reduce((acc, etapa) => {
        const subtotal = etapa.servicios.reduce((sum, servicio) => {
          const precio = Number(servicio.precioAplicado ?? servicio.servicio.precioBase);
          return sum + precio * servicio.cantidad;
        }, 0);
        return acc + subtotal;
      }, 0),
    }));
  } catch (error) {
    console.error("Error al obtener planes:", error);
    return [];
  }
}
