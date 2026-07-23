"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { Producto } from "./schema";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere, withTenantData } from "@/lib/tenant-query";
import { getTenantContext } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit-log";

export async function getProductos(): Promise<Producto[]> {
  const productos = await prisma.producto.findMany({
    where: await tenantWhere<Prisma.ProductoWhereInput>(),
    orderBy: { nombre: "asc" },
  });

  return productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion || "",
    tipo: p.tipo,
    precioVenta: p.precioVenta !== null ? Number(p.precioVenta) : null,
    unidad: p.unidad || "",
    stock: p.stock,
    stockMinimo: p.stockMinimo,
    activo: p.activo,
  }));
}

export async function getProductoById(id: string): Promise<Producto | null> {
  const p = await prisma.producto.findFirst({
    where: await tenantWhere<Prisma.ProductoWhereInput>({ id }),
  });

  if (!p) return null;

  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion || "",
    tipo: p.tipo,
    precioVenta: p.precioVenta !== null ? Number(p.precioVenta) : null,
    unidad: p.unidad || "",
    stock: p.stock,
    stockMinimo: p.stockMinimo,
    activo: p.activo,
  };
}

export async function postProducto(data: Producto) {
  const producto = await prisma.producto.create({
    data: await withTenantData({
      id: randomUUID(),
      nombre: data.nombre,
      descripcion: data.descripcion,
      tipo: data.tipo,
      precioVenta: data.tipo === "VENTA" ? data.precioVenta ?? 0 : null,
      unidad: data.unidad,
      stock: data.stock,
      stockMinimo: data.stockMinimo,
      activo: data.activo ?? true,
    }),
  });

  await createAuditLog({
    accion: "CREAR",
    entidad: "Producto",
    entidadId: producto.id,
    resumen: `Producto creado: ${producto.nombre}`,
    detalle: "Registro de inventario creado desde el módulo de inventario.",
    valoresDespues: producto,
  });

  return producto;
}

export async function putProducto(data: Producto) {
  const existing = await prisma.producto.findFirst({ where: await tenantWhere<Prisma.ProductoWhereInput>({ id: data.id! }) });
  if (!existing) throw new Error("Producto no encontrado en la clínica");

  const producto = await prisma.producto.update({
    where: { id: existing.id },
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion,
      tipo: data.tipo,
      precioVenta: data.tipo === "VENTA" ? data.precioVenta ?? 0 : null,
      unidad: data.unidad,
      stock: data.stock,
      stockMinimo: data.stockMinimo,
      activo: data.activo,
    },
  });

  await createAuditLog({
    accion: "MODIFICAR",
    entidad: "Producto",
    entidadId: producto.id,
    resumen: `Producto modificado: ${producto.nombre}`,
    detalle: "Registro de inventario modificado desde el módulo de inventario.",
    valoresAntes: existing,
    valoresDespues: producto,
  });

  return producto;
}


export async function getInventarioHistorial(fechaInicio?: Date, fechaFin?: Date) {
  const start = fechaInicio ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = fechaFin ?? new Date();

  const usos = await prisma.consultaProducto.findMany({
    where: await tenantWhere<Prisma.ConsultaProductoWhereInput>({
      createAt: { gte: start, lte: end },
    }),
    include: {
      producto: { select: { id: true, nombre: true } },
      consulta: {
        select: {
          id: true,
          fechaConsulta: true,
          detalles: {
            select: { servicio: { select: { nombre: true } } },
          },
        },
      },
    },
    orderBy: { createAt: "desc" },
  });

  const byProducto = new Map<string, {
    productoId: string;
    productoNombre: string;
    totalUsado: number;
    servicios: Record<string, number>;
  }>();

  usos.forEach((uso) => {
    const key = uso.productoId;
    if (!byProducto.has(key)) {
      byProducto.set(key, {
        productoId: uso.productoId,
        productoNombre: uso.producto.nombre,
        totalUsado: 0,
        servicios: {},
      });
    }

    const item = byProducto.get(key)!;
    item.totalUsado += uso.cantidad;

    const servicios = uso.consulta.detalles.map((detalle) => detalle.servicio.nombre);
    const unique = servicios.length ? Array.from(new Set(servicios)) : ["Sin servicio asociado"];
    unique.forEach((servicio) => {
      item.servicios[servicio] = (item.servicios[servicio] ?? 0) + uso.cantidad;
    });
  });

  return Array.from(byProducto.values()).sort((a, b) => b.totalUsado - a.totalUsado);
}


export async function sincronizarStockInventario(formData: FormData) {
  const fechaInicioValue = String(formData.get("fechaInicio") ?? "");
  const fechaFinValue = String(formData.get("fechaFin") ?? "");

  if (!fechaInicioValue || !fechaFinValue) {
    return { success: false, error: "Seleccione un rango de fechas para sincronizar." };
  }

  const fechaInicio = new Date(`${fechaInicioValue}T00:00:00`);
  const fechaFin = new Date(`${fechaFinValue}T23:59:59`);

  if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
    return { success: false, error: "El rango de fechas no es válido." };
  }

  if (fechaInicio > fechaFin) {
    return { success: false, error: "La fecha inicial no puede ser mayor que la fecha final." };
  }

  const { tenantId } = await getTenantContext();

  const resumen = await prisma.$transaction(async (tx) => {
    const usos = await tx.consultaProducto.groupBy({
      by: ["productoId"],
      where: {
        tenantId,
        consulta: {
          fechaConsulta: { gte: fechaInicio, lte: fechaFin },
        },
      },
      _sum: { cantidad: true },
    });

    if (!usos.length) {
      return { productosActualizados: 0, totalDescontado: 0, detalle: [] as unknown[] };
    }

    const productos = await tx.producto.findMany({
      where: { tenantId, id: { in: usos.map((uso) => uso.productoId) } },
      select: { id: true, nombre: true, stock: true },
    });
    const productoMap = new Map(productos.map((producto) => [producto.id, producto]));
    const detalle: { productoId: string; nombre: string; stockAntes: number; cantidadUsada: number; stockDespues: number }[] = [];

    for (const uso of usos) {
      const producto = productoMap.get(uso.productoId);
      const cantidadUsada = uso._sum.cantidad ?? 0;
      if (!producto || cantidadUsada <= 0) continue;

      const stockDespues = Math.max(producto.stock - cantidadUsada, 0);
      await tx.producto.update({ where: { id: producto.id }, data: { stock: stockDespues } });
      detalle.push({ productoId: producto.id, nombre: producto.nombre, stockAntes: producto.stock, cantidadUsada, stockDespues });
    }

    return {
      productosActualizados: detalle.length,
      totalDescontado: detalle.reduce((acc, item) => acc + item.cantidadUsada, 0),
      detalle,
    };
  });

  await createAuditLog({
    accion: "MODIFICAR",
    entidad: "Inventario",
    resumen: `Sincronización de stock: ${resumen.productosActualizados} productos`,
    detalle: `Se sincronizó el inventario con los productos usados en consultas del ${fechaInicioValue} al ${fechaFinValue}.`,
    valoresDespues: resumen.detalle,
    metadata: { fechaInicio: fechaInicioValue, fechaFin: fechaFinValue, totalDescontado: resumen.totalDescontado },
  });

  revalidatePath("/inventario");
  revalidatePath("/reporteria");

  return { success: true, productosActualizados: resumen.productosActualizados, totalDescontado: resumen.totalDescontado };
}
