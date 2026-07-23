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
      consulta: { fechaConsulta: { gte: start, lte: end } },
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



export async function sincronizarStockProducto(formData: FormData) {
  const productoId = String(formData.get("productoId") ?? "");
  const fechaInicioValue = String(formData.get("fechaInicio") ?? "");
  const fechaFinValue = String(formData.get("fechaFin") ?? "");
  const inventarioInicialValue = String(formData.get("inventarioInicial") ?? "");

  if (!productoId) {
    return { success: false, error: "Seleccione el producto que desea sincronizar." };
  }
  if (!fechaInicioValue || !fechaFinValue) {
    return { success: false, error: "Seleccione un rango de fechas para sincronizar." };
  }

  const fechaInicio = new Date(`${fechaInicioValue}T00:00:00`);
  const fechaFin = new Date(`${fechaFinValue}T23:59:59`);
  const inventarioInicial = Number(inventarioInicialValue);

  if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
    return { success: false, error: "El rango de fechas no es válido." };
  }
  if (fechaInicio > fechaFin) {
    return { success: false, error: "La fecha inicial no puede ser mayor que la fecha final." };
  }
  if (!Number.isInteger(inventarioInicial) || inventarioInicial < 0) {
    return { success: false, error: "El inventario inicial debe ser un número entero mayor o igual a cero." };
  }

  const { tenantId } = await getTenantContext();

  const resumen = await prisma.$transaction(async (tx) => {
    const producto = await tx.producto.findFirst({
      where: { id: productoId, tenantId },
      select: { id: true, nombre: true, stock: true },
    });

    if (!producto) {
      throw new Error("Producto no encontrado en la clínica.");
    }

    const usos = await tx.consultaProducto.findMany({
      where: {
        tenantId,
        productoId: producto.id,
        consulta: { fechaConsulta: { gte: fechaInicio, lte: fechaFin } },
      },
      include: {
        consulta: {
          select: {
            id: true,
            fechaConsulta: true,
            detalles: { select: { servicio: { select: { nombre: true } } } },
          },
        },
      },
      orderBy: { consulta: { fechaConsulta: "asc" } },
    });

    const cantidadUsada = usos.reduce((acc, uso) => acc + uso.cantidad, 0);
    const stockDespues = Math.max(inventarioInicial - cantidadUsada, 0);
    const servicios = usos.reduce<Record<string, { registros: number; cantidad: number }>>((acc, uso) => {
      const nombres = uso.consulta.detalles.map((detalle) => detalle.servicio.nombre);
      const unicos = nombres.length ? Array.from(new Set(nombres)) : ["Sin servicio asociado"];
      unicos.forEach((servicio) => {
        acc[servicio] = acc[servicio] ?? { registros: 0, cantidad: 0 };
        acc[servicio].registros += 1;
        acc[servicio].cantidad += uso.cantidad;
      });
      return acc;
    }, {});

    await tx.producto.update({ where: { id: producto.id }, data: { stock: stockDespues } });

    return {
      productoId: producto.id,
      nombre: producto.nombre,
      stockAntes: producto.stock,
      inventarioInicial,
      cantidadUsada,
      registros: usos.length,
      stockDespues,
      servicios,
    };
  });

  await createAuditLog({
    accion: "MODIFICAR",
    entidad: "Producto",
    entidadId: resumen.productoId,
    resumen: `Sincronización de stock: ${resumen.nombre}`,
    detalle: `Se sincronizó ${resumen.nombre} del ${fechaInicioValue} al ${fechaFinValue} usando inventario inicial ${resumen.inventarioInicial} y ${resumen.cantidadUsada} unidades registradas en ${resumen.registros} registros de consulta.`,
    valoresAntes: { stock: resumen.stockAntes },
    valoresDespues: resumen,
    metadata: { fechaInicio: fechaInicioValue, fechaFin: fechaFinValue },
  });

  revalidatePath("/inventario");
  revalidatePath("/reporteria");

  return { success: true, ...resumen };
}
