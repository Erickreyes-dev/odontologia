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
        detalles: {
          include: {
            servicio: {
              select: {
                id: true,
                nombre: true,
                precioBase: true,
              },
            },
          },
        },
        productos: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                unidad: true,
                stock: true,
                stockMinimo: true,
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
      diagnostico: r.diagnostico,
      notas: r.notas,
      cita: {
        id: r.cita.id,
        fechaHora: new Date(r.cita.fechaHora),
        motivo: r.cita.motivo,
        paciente: r.cita.paciente,
        medico: r.cita.medico,
      },
      detalles: r.detalles.map((d) => ({
        id: d.id,
        consultaId: d.consultaId,
        servicioId: d.servicioId,
        precioAplicado: Number(d.precioAplicado),
        cantidad: d.cantidad,
        servicio: {
          id: d.servicio.id,
          nombre: d.servicio.nombre,
          precioBase: Number(d.servicio.precioBase),
        },
      })),
      productos: r.productos.map((p) => ({
        id: p.id,
        consultaId: p.consultaId,
        productoId: p.productoId,
        cantidad: p.cantidad,
        producto: {
          id: p.producto.id,
          nombre: p.producto.nombre,
          unidad: p.producto.unidad || "",
          stock: p.producto.stock,
          stockMinimo: p.producto.stockMinimo,
        },
      })),
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
        detalles: {
          include: {
            servicio: {
              select: {
                id: true,
                nombre: true,
                precioBase: true,
              },
            },
          },
        },
        productos: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                unidad: true,
                stock: true,
                stockMinimo: true,
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
      diagnostico: r.diagnostico,
      notas: r.notas,
      cita: {
        id: r.cita.id,
        fechaHora: new Date(r.cita.fechaHora),
        motivo: r.cita.motivo,
        paciente: r.cita.paciente,
        medico: r.cita.medico,
      },
      detalles: r.detalles.map((d) => ({
        id: d.id,
        consultaId: d.consultaId,
        servicioId: d.servicioId,
        precioAplicado: Number(d.precioAplicado),
        cantidad: d.cantidad,
        servicio: {
          id: d.servicio.id,
          nombre: d.servicio.nombre,
          precioBase: Number(d.servicio.precioBase),
        },
      })),
      productos: r.productos.map((p) => ({
        id: p.id,
        consultaId: p.consultaId,
        productoId: p.productoId,
        cantidad: p.cantidad,
        producto: {
          id: p.producto.id,
          nombre: p.producto.nombre,
          unidad: p.producto.unidad || "",
          stock: p.producto.stock,
          stockMinimo: p.producto.stockMinimo,
        },
      })),
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

    // Verificar si ya existe una consulta para esta cita
    const existingConsulta = await prisma.consulta.findUnique({
      where: { citaId: validatedData.citaId },
      include: { productos: true },
    });

    let consultaId: string;

    if (existingConsulta) {
      // Actualizar consulta existente
      await prisma.consulta.update({
        where: { id: existingConsulta.id },
        data: {
          diagnostico: validatedData.diagnostico,
          notas: validatedData.notas,
        },
      });
      consultaId = existingConsulta.id;

      // Revertir productos existentes al inventario y recrearlos
      if (existingConsulta.productos.length > 0) {
        const productoUpdates = existingConsulta.productos.map((detalle) =>
          prisma.producto.update({
            where: { id: detalle.productoId },
            data: { stock: { increment: detalle.cantidad } },
          })
        );
        await prisma.$transaction(productoUpdates);
      }

      // Eliminar detalles existentes y recrearlos
      await prisma.consultaServicio.deleteMany({
        where: { consultaId: existingConsulta.id },
      });

      await prisma.consultaProducto.deleteMany({
        where: { consultaId: existingConsulta.id },
      });
    } else {
      // Crear nueva consulta
      consultaId = randomUUID();
      await prisma.consulta.create({
        data: {
          id: consultaId,
          citaId: validatedData.citaId,
          diagnostico: validatedData.diagnostico,
          notas: validatedData.notas,
        },
      });

      // Actualizar el estado de la cita a "atendida"
      await prisma.cita.update({
        where: { id: validatedData.citaId },
        data: { estado: "atendida" },
      });
    }

    // Crear los detalles de servicios
    if (validatedData.detalles && validatedData.detalles.length > 0) {
      await prisma.consultaServicio.createMany({
        data: validatedData.detalles.map((d) => ({
          id: randomUUID(),
          consultaId: consultaId,
          servicioId: d.servicioId,
          precioAplicado: d.precioAplicado,
          cantidad: d.cantidad,
        })),
      });
    }

    // Crear los detalles de productos y descontar inventario
    if (validatedData.productos && validatedData.productos.length > 0) {
      const productosIds = validatedData.productos.map((p) => p.productoId);
      const productosDb = await prisma.producto.findMany({
        where: { id: { in: productosIds } },
        select: { id: true, nombre: true, stock: true },
      });

      const stockPorProducto = new Map(productosDb.map((p) => [p.id, p]));
      const productoSinStock = validatedData.productos.find((p) => {
        const producto = stockPorProducto.get(p.productoId);
        return !producto || producto.stock < p.cantidad;
      });

      if (productoSinStock) {
        const producto = stockPorProducto.get(productoSinStock.productoId);
        throw new Error(
          `Stock insuficiente para ${producto?.nombre ?? "el producto seleccionado"}`
        );
      }

      await prisma.consultaProducto.createMany({
        data: validatedData.productos.map((p) => ({
          id: randomUUID(),
          consultaId: consultaId,
          productoId: p.productoId,
          cantidad: p.cantidad,
        })),
      });

      const inventarioUpdates = validatedData.productos.map((p) =>
        prisma.producto.update({
          where: { id: p.productoId },
          data: { stock: { decrement: p.cantidad } },
        })
      );
      await prisma.$transaction(inventarioUpdates);
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

/**
 * Obtiene los servicios disponibles para una consulta
 */
export async function getServiciosDisponibles() {
  try {
    const servicios = await prisma.servicio.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        precioBase: true,
        duracionMin: true,
      },
      orderBy: { nombre: "asc" },
    });

    return servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      precioBase: Number(s.precioBase),
      duracionMin: s.duracionMin,
    }));
  } catch (error) {
    console.error("Error al obtener servicios disponibles:", error);
    return [];
  }
}

/**
 * Obtiene los productos disponibles para una consulta
 */
export async function getProductosDisponibles() {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        unidad: true,
        stock: true,
        stockMinimo: true,
      },
      orderBy: { nombre: "asc" },
    });

    return productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      unidad: p.unidad || "",
      stock: p.stock,
      stockMinimo: p.stockMinimo,
    }));
  } catch (error) {
    console.error("Error al obtener productos disponibles:", error);
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
