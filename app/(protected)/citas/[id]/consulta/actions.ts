"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { Consulta, ConsultaSchema } from "./schema";

/**
 * Obtiene la consulta de una cita por ID de cita
 */
export async function getConsultaByCitaId(citaId: string): Promise<Consulta | null> {
  try {
    const r = await prisma.consulta.findUnique({
      where: { citaId },
      include: {
        detalles: { include: { servicio: true } },
        productos: { include: { producto: true } },
        cita: {
          include: {
            paciente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                identidad: true,
              },
            },
            medico: {
              select: {
                idEmpleado: true,
                empleado: {
                  select: {
                    nombre: true,
                    apellido: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      citaId: r.citaId,
      fechaConsulta: r.fechaConsulta ? new Date(r.fechaConsulta) : null,
      diagnostico: r.diagnostico,
      notas: r.notas,
      observacionesClinicas: r.observacionesClinicas,
      total: Number(r.total),
      seguimientoId: r.seguimientoId ?? null,
      financiamientoId: r.financiamientoId ?? null,
      servicios: r.detalles.map((detalle) => ({
        id: detalle.id,
        servicioId: detalle.servicioId,
        precioAplicado: Number(detalle.precioAplicado),
        cantidad: detalle.cantidad,
        servicioNombre: detalle.servicio.nombre,
      })),
      productos: r.productos.map((producto) => ({
        id: producto.id,
        productoId: producto.productoId,
        cantidad: producto.cantidad,
        productoNombre: producto.producto.nombre,
      })),
      cita: {
        id: r.cita.id,
        fechaHora: new Date(r.cita.fechaHora),
        motivo: r.cita.motivo,
        paciente: r.cita.paciente,
        medico: r.cita.medico,
      },
    };
  } catch (error) {
    console.error(`Error al obtener consulta de cita ${citaId}:`, error);
    return null;
  }
}

/**
 * Obtiene una consulta por ID
 */
export async function getConsultaById(id: string): Promise<Consulta | null> {
  try {
    const r = await prisma.consulta.findUnique({
      where: { id },
      include: {
        detalles: { include: { servicio: true } },
        productos: { include: { producto: true } },
        cita: {
          include: {
            paciente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                identidad: true,
              },
            },
            medico: {
              select: {
                idEmpleado: true,
                empleado: {
                  select: {
                    nombre: true,
                    apellido: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      citaId: r.citaId,
      fechaConsulta: r.fechaConsulta ? new Date(r.fechaConsulta) : null,
      diagnostico: r.diagnostico,
      notas: r.notas,
      observacionesClinicas: r.observacionesClinicas,
      total: Number(r.total),
      seguimientoId: r.seguimientoId ?? null,
      financiamientoId: r.financiamientoId ?? null,
      servicios: r.detalles.map((detalle) => ({
        id: detalle.id,
        servicioId: detalle.servicioId,
        precioAplicado: Number(detalle.precioAplicado),
        cantidad: detalle.cantidad,
        servicioNombre: detalle.servicio.nombre,
      })),
      productos: r.productos.map((producto) => ({
        id: producto.id,
        productoId: producto.productoId,
        cantidad: producto.cantidad,
        productoNombre: producto.producto.nombre,
      })),
      cita: {
        id: r.cita.id,
        fechaHora: new Date(r.cita.fechaHora),
        motivo: r.cita.motivo,
        paciente: r.cita.paciente,
        medico: r.cita.medico,
      },
    };
  } catch (error) {
    console.error(`Error al obtener consulta con ID ${id}:`, error);
    return null;
  }
}

/**
 * Crea o actualiza una consulta
 */
export async function upsertConsulta(
  data: Consulta
): Promise<{ success: true; data: Consulta } | { success: false; error: string }> {
  try {
    const validatedData = ConsultaSchema.parse(data);
    const totalServicios =
      validatedData.servicios?.reduce(
        (acc, servicio) => acc + servicio.precioAplicado * servicio.cantidad,
        0
      ) ?? 0;

    // Verificar si ya existe una consulta para esta cita
    const existingConsulta = await prisma.consulta.findUnique({
      where: { citaId: validatedData.citaId },
    });

    let consultaId: string;

    if (existingConsulta) {
      // Actualizar consulta existente
      await prisma.$transaction(async (tx) => {
        await tx.consulta.update({
          where: { id: existingConsulta.id },
          data: {
            fechaConsulta: validatedData.fechaConsulta ?? null,
            diagnostico: validatedData.diagnostico,
            notas: validatedData.notas,
            observacionesClinicas: validatedData.observacionesClinicas,
            seguimientoId: validatedData.seguimientoId ?? null,
            financiamientoId: validatedData.financiamientoId ?? null,
            total: totalServicios,
          },
        });
        await tx.consultaServicio.deleteMany({ where: { consultaId: existingConsulta.id } });
        await tx.consultaProducto.deleteMany({ where: { consultaId: existingConsulta.id } });
        if (validatedData.servicios?.length) {
          await tx.consultaServicio.createMany({
            data: validatedData.servicios.map((servicio) => ({
              id: randomUUID(),
              consultaId: existingConsulta.id,
              servicioId: servicio.servicioId,
              precioAplicado: servicio.precioAplicado,
              cantidad: servicio.cantidad,
            })),
          });
        }
        if (validatedData.productos?.length) {
          await tx.consultaProducto.createMany({
            data: validatedData.productos.map((producto) => ({
              id: randomUUID(),
              consultaId: existingConsulta.id,
              productoId: producto.productoId,
              cantidad: producto.cantidad,
            })),
          });
        }
      });
      consultaId = existingConsulta.id;
    } else {
      // Crear nueva consulta
      consultaId = randomUUID();
      await prisma.$transaction(async (tx) => {
        await tx.consulta.create({
          data: {
            id: consultaId,
            citaId: validatedData.citaId,
            fechaConsulta: validatedData.fechaConsulta ?? null,
            diagnostico: validatedData.diagnostico,
            notas: validatedData.notas,
            observacionesClinicas: validatedData.observacionesClinicas,
            seguimientoId: validatedData.seguimientoId ?? null,
            financiamientoId: validatedData.financiamientoId ?? null,
            total: totalServicios,
            detalles: validatedData.servicios?.length
              ? {
                  create: validatedData.servicios.map((servicio) => ({
                    id: randomUUID(),
                    servicioId: servicio.servicioId,
                    precioAplicado: servicio.precioAplicado,
                    cantidad: servicio.cantidad,
                  })),
                }
              : undefined,
            productos: validatedData.productos?.length
              ? {
                  create: validatedData.productos.map((producto) => ({
                    id: randomUUID(),
                    productoId: producto.productoId,
                    cantidad: producto.cantidad,
                  })),
                }
              : undefined,
          },
        });

        // Actualizar el estado de la cita a "atendida"
        await tx.cita.update({
          where: { id: validatedData.citaId },
          data: { estado: "atendida" },
        });
      });
    }

    // Obtener la consulta actualizada
    const consulta = await getConsultaById(consultaId);

    revalidatePath("/citas");
    revalidatePath(`/citas/${validatedData.citaId}/consulta`);

    return { success: true, data: consulta! };
  } catch (error) {
    console.error("Error al guardar consulta:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error desconocido al guardar consulta" };
  }
}

export async function finalizarConsulta(
  data: Consulta
): Promise<
  | { success: true; data: { consultaId: string; ordenId: string } }
  | { success: false; error: string }
> {
  try {
    const validatedData = ConsultaSchema.parse(data);
    const cita = await prisma.cita.findUnique({
      where: { id: validatedData.citaId },
      select: { id: true, pacienteId: true },
    });

    if (!cita) {
      return { success: false, error: "La cita no existe" };
    }

    let consultaId = validatedData.id;

    const serviciosTotal =
      validatedData.servicios?.reduce(
        (acc, servicio) => acc + servicio.precioAplicado * servicio.cantidad,
        0
      ) ?? 0;

    const result = await prisma.$transaction(async (tx) => {
      let productosExistentes: { productoId: string; cantidad: number }[] = [];
      if (consultaId) {
        productosExistentes = await tx.consultaProducto.findMany({
          where: { consultaId },
          select: { productoId: true, cantidad: true },
        });
        await tx.consulta.update({
          where: { id: consultaId },
          data: {
            fechaConsulta: validatedData.fechaConsulta ?? null,
            diagnostico: validatedData.diagnostico,
            notas: validatedData.notas,
            observacionesClinicas: validatedData.observacionesClinicas,
            seguimientoId: validatedData.seguimientoId ?? null,
            financiamientoId: validatedData.financiamientoId ?? null,
            total: serviciosTotal,
          },
        });
        await tx.consultaServicio.deleteMany({ where: { consultaId } });
        await tx.consultaProducto.deleteMany({ where: { consultaId } });
      } else {
        consultaId = randomUUID();
        await tx.consulta.create({
          data: {
            id: consultaId,
            citaId: validatedData.citaId,
            fechaConsulta: validatedData.fechaConsulta ?? null,
            diagnostico: validatedData.diagnostico,
            notas: validatedData.notas,
            observacionesClinicas: validatedData.observacionesClinicas,
            seguimientoId: validatedData.seguimientoId ?? null,
            financiamientoId: validatedData.financiamientoId ?? null,
            total: serviciosTotal,
          },
        });
      }

      if (validatedData.servicios?.length) {
        await tx.consultaServicio.createMany({
          data: validatedData.servicios.map((servicio) => ({
            id: randomUUID(),
            consultaId: consultaId!,
            servicioId: servicio.servicioId,
            precioAplicado: servicio.precioAplicado,
            cantidad: servicio.cantidad,
          })),
        });
      }
      if (validatedData.productos?.length) {
        await tx.consultaProducto.createMany({
          data: validatedData.productos.map((producto) => ({
            id: randomUUID(),
            consultaId: consultaId!,
            productoId: producto.productoId,
            cantidad: producto.cantidad,
          })),
        });
      }

      const productosActuales = validatedData.productos ?? [];
      const stockAjustes = new Map<string, number>();
      for (const producto of productosExistentes) {
        stockAjustes.set(
          producto.productoId,
          (stockAjustes.get(producto.productoId) ?? 0) - producto.cantidad
        );
      }
      for (const producto of productosActuales) {
        stockAjustes.set(
          producto.productoId,
          (stockAjustes.get(producto.productoId) ?? 0) + producto.cantidad
        );
      }

      if (stockAjustes.size > 0) {
        const productosIds = Array.from(stockAjustes.keys());
        const productosDB = await tx.producto.findMany({
          where: { id: { in: productosIds } },
          select: { id: true, stock: true, nombre: true },
        });
        const stockMap = new Map(
          productosDB.map((producto) => [producto.id, producto])
        );

        for (const [productoId, delta] of stockAjustes.entries()) {
          if (delta === 0) continue;
          const productoDB = stockMap.get(productoId);
          if (!productoDB) continue;
          if (delta > 0 && productoDB.stock < delta) {
            throw new Error(
              `Stock insuficiente para ${productoDB.nombre}. Disponible: ${productoDB.stock}`
            );
          }
          await tx.producto.update({
            where: { id: productoId },
            data: {
              stock:
                delta > 0
                  ? { decrement: delta }
                  : { increment: Math.abs(delta) },
            },
          });
        }
      }

      await tx.cita.update({
        where: { id: validatedData.citaId },
        data: { estado: "atendida" },
      });

      let planTratamientoId: string | null = null;
      if (validatedData.seguimientoId) {
        const seguimiento = await tx.seguimiento.findUnique({
          where: { id: validatedData.seguimientoId },
          include: { etapa: true },
        });
        if (!seguimiento || seguimiento.pacienteId !== cita.pacienteId) {
          throw new Error("El seguimiento seleccionado no pertenece al paciente");
        }
        await tx.seguimiento.update({
          where: { id: validatedData.seguimientoId },
          data: {
            estado: "REALIZADO",
            fechaRealizada: new Date(),
            citaId: validatedData.citaId,
          },
        });
        planTratamientoId = seguimiento.etapa.planId;
      }

      let financiamientoId: string | null = validatedData.financiamientoId ?? null;
      let cuotaSeleccionada: { id: string; numero: number; monto: number } | null = null;
      if (financiamientoId) {
        const financiamiento = await tx.financiamiento.findUnique({
          where: { id: financiamientoId },
          select: { pacienteId: true },
        });
        if (!financiamiento || financiamiento.pacienteId !== cita.pacienteId) {
          throw new Error("El financiamiento seleccionado no pertenece al paciente");
        }
        const cuota = await tx.cuotaFinanciamiento.findFirst({
          where: { financiamientoId, pagada: false },
          orderBy: { numero: "asc" },
        });
        if (!cuota) {
          throw new Error("El financiamiento no tiene cuotas pendientes");
        }
        cuotaSeleccionada = { id: cuota.id, numero: cuota.numero, monto: Number(cuota.monto) };
      } else if (serviciosTotal <= 0) {
        throw new Error("Debe registrar servicios con monto válido");
      }

      const montoTotal = financiamientoId
        ? cuotaSeleccionada?.monto ?? 0
        : serviciosTotal;

      const orden = await tx.ordenDeCobro.create({
        data: {
          id: randomUUID(),
          pacienteId: cita.pacienteId,
          planTratamientoId,
          financiamientoId,
          consultaId: consultaId!,
          monto: montoTotal,
          concepto: financiamientoId
            ? `Consulta #${consultaId!.slice(0, 8)} - Cuota ${cuotaSeleccionada?.numero ?? "pendiente"}`
            : `Consulta #${consultaId!.slice(0, 8)} - Servicios`,
          estado: "PENDIENTE",
        },
      });

      return { consultaId: consultaId!, ordenId: orden.id, planTratamientoId };
    });

    revalidatePath("/citas");
    revalidatePath(`/citas/${validatedData.citaId}/consulta`);
    revalidatePath("/ordenes-cobro");
    revalidatePath(`/pacientes/${cita.pacienteId}/perfil`);
    if (result.planTratamientoId) {
      revalidatePath("/planes-tratamiento");
      revalidatePath(`/planes-tratamiento/${result.planTratamientoId}`);
    }

    return { success: true, data: { consultaId: result.consultaId, ordenId: result.ordenId } };
  } catch (error) {
    console.error("Error al finalizar consulta:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al finalizar consulta",
    };
  }
}

export async function getServiciosActivos(): Promise<
  { id: string; nombre: string; precioBase: number; duracionMin: number }[]
> {
  try {
    const servicios = await prisma.servicio.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, precioBase: true, duracionMin: true },
      orderBy: { nombre: "asc" },
    });

    return servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      precioBase: Number(s.precioBase),
      duracionMin: s.duracionMin,
    }));
  } catch (error) {
    console.error("Error al obtener servicios activos:", error);
    return [];
  }
}

export async function getProductosActivos(): Promise<
  { id: string; nombre: string; unidad: string | null; stock: number }[]
> {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, unidad: true, stock: true },
      orderBy: { nombre: "asc" },
    });

    return productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      unidad: p.unidad ?? null,
      stock: p.stock,
    }));
  } catch (error) {
    console.error("Error al obtener productos activos:", error);
    return [];
  }
}

/**
 * Obtiene los datos de la cita para mostrar en la consulta
 */
export async function getCitaParaConsulta(citaId: string) {
  try {
    const cita = await prisma.cita.findUnique({
      where: { id: citaId },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            identidad: true,
            telefono: true,
            correo: true,
            fechaNacimiento: true,
            genero: true,
          },
        },
        medico: {
          select: {
            idEmpleado: true,
            empleado: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        consultorio: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!cita) return null;

    return {
      id: cita.id,
      fechaHora: new Date(cita.fechaHora),
      estado: cita.estado,
      motivo: cita.motivo,
      observacion: cita.observacion,
      paciente: cita.paciente,
      medico: cita.medico,
      consultorio: cita.consultorio,
    };
  } catch (error) {
    console.error(`Error al obtener cita ${citaId}:`, error);
    return null;
  }
}
