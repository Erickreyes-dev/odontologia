"use server";

import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { tenantWhere, withTenantData } from "@/lib/tenant-query";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { Promocion, PromocionSchema } from "./schema";

async function calcularPrecioReferencial(
  serviciosPromocion: Promocion["servicios"],
): Promise<number> {
  const servicioIds = Array.from(new Set(serviciosPromocion.map((servicio) => servicio.servicioId)));

  if (servicioIds.length === 0) return 0;

  const servicios = await prisma.servicio.findMany({
    where: await tenantWhere<Prisma.ServicioWhereInput>({
      id: { in: servicioIds },
    }),
    select: {
      id: true,
      precioBase: true,
    },
  });

  const precioPorServicio = new Map(servicios.map((servicio) => [servicio.id, Number(servicio.precioBase)]));

  return Number(
    serviciosPromocion
      .reduce((total, servicio) => {
        const precioBase = precioPorServicio.get(servicio.servicioId);
        const precioUnitario = servicio.precioAplicado ?? precioBase ?? 0;
        return total + precioUnitario * servicio.cantidad;
      }, 0)
      .toFixed(2),
  );
}

export async function getPromociones(): Promise<Promocion[]> {
  const promociones = await prisma.promocion.findMany({
    where: await tenantWhere<Prisma.PromocionWhereInput>(),
    include: {
      servicios: true,
    },
    orderBy: { createAt: "desc" },
  });

  return promociones.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precioReferencial: Number(p.precioReferencial),
    precioPromocional: Number(p.precioPromocional),
    fechaInicio: p.fechaInicio,
    fechaFin: p.fechaFin,
    activo: p.activo,
    servicios: p.servicios.map((s) => ({
      servicioId: s.servicioId,
      cantidad: s.cantidad,
      precioAplicado: s.precioAplicado ? Number(s.precioAplicado) : null,
    })),
  }));
}

export async function getPromocionById(id: string): Promise<Promocion | null> {
  const promocion = await prisma.promocion.findFirst({
    where: await tenantWhere<Prisma.PromocionWhereInput>({ id }),
    include: { servicios: true },
  });

  if (!promocion) return null;

  return {
    id: promocion.id,
    nombre: promocion.nombre,
    descripcion: promocion.descripcion,
    precioReferencial: Number(promocion.precioReferencial),
    precioPromocional: Number(promocion.precioPromocional),
    fechaInicio: promocion.fechaInicio,
    fechaFin: promocion.fechaFin,
    activo: promocion.activo,
    servicios: promocion.servicios.map((s) => ({
      servicioId: s.servicioId,
      cantidad: s.cantidad,
      precioAplicado: s.precioAplicado ? Number(s.precioAplicado) : null,
    })),
  };
}

export async function createPromocion(data: Promocion) {
  try {
    const parsed = PromocionSchema.parse({ ...data, activo: data.activo ?? true });
    const precioReferencial = await calcularPrecioReferencial(parsed.servicios);

    await prisma.promocion.create({
      data: await withTenantData({
        id: randomUUID(),
        nombre: parsed.nombre,
        descripcion: parsed.descripcion,
        precioReferencial,
        precioPromocional: parsed.precioPromocional,
        fechaInicio: parsed.fechaInicio ?? null,
        fechaFin: parsed.fechaFin ?? null,
        activo: parsed.activo ?? true,
        servicios: {
          create: parsed.servicios.map((servicio) => ({
            id: randomUUID(),
            servicioId: servicio.servicioId,
            cantidad: servicio.cantidad,
            precioAplicado: servicio.precioAplicado ?? null,
          })),
        },
      }),
    });

    revalidatePath("/promociones");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo crear la promoción" };
  }
}

export async function updatePromocion(id: string, data: Promocion) {
  try {
    const parsed = PromocionSchema.parse(data);
    const precioReferencial = await calcularPrecioReferencial(parsed.servicios);

    const existing = await prisma.promocion.findFirst({
      where: await tenantWhere<Prisma.PromocionWhereInput>({ id }),
      select: { id: true },
    });

    if (!existing) return { success: false, error: "Promoción no encontrada en la clínica" };

    await prisma.promocion.update({
      where: { id: existing.id },
      data: {
        nombre: parsed.nombre,
        descripcion: parsed.descripcion,
        precioReferencial,
        precioPromocional: parsed.precioPromocional,
        fechaInicio: parsed.fechaInicio ?? null,
        fechaFin: parsed.fechaFin ?? null,
        activo: parsed.activo ?? true,
        servicios: {
          deleteMany: {},
          create: parsed.servicios.map((servicio) => ({
            id: randomUUID(),
            servicioId: servicio.servicioId,
            cantidad: servicio.cantidad,
            precioAplicado: servicio.precioAplicado ?? null,
          })),
        },
      },
    });

    revalidatePath("/promociones");
    revalidatePath(`/promociones/${id}/edit`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No se pudo actualizar la promoción" };
  }
}
