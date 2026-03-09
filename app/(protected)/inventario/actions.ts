"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { Producto } from "./schema";
import { Prisma } from "@/lib/generated/prisma";
import { tenantWhere, withTenantData } from "@/lib/tenant-query";

export async function getProductos(): Promise<Producto[]> {
  const productos = await prisma.producto.findMany({
    where: await tenantWhere<Prisma.ProductoWhereInput>(),
    orderBy: { nombre: "asc" },
  });

  return productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion || "",
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
    unidad: p.unidad || "",
    stock: p.stock,
    stockMinimo: p.stockMinimo,
    activo: p.activo,
  };
}

export async function postProducto(data: Producto) {
  return prisma.producto.create({
    data: await withTenantData({
      id: randomUUID(),
      nombre: data.nombre,
      descripcion: data.descripcion,
      unidad: data.unidad,
      stock: data.stock,
      stockMinimo: data.stockMinimo,
      activo: data.activo ?? true,
    }),
  });
}

export async function putProducto(data: Producto) {
  const existing = await prisma.producto.findFirst({ where: await tenantWhere<Prisma.ProductoWhereInput>({ id: data.id! }) });
  if (!existing) throw new Error("Producto no encontrado en la clínica");

  return prisma.producto.update({
    where: { id: existing.id },
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion,
      unidad: data.unidad,
      stock: data.stock,
      stockMinimo: data.stockMinimo,
      activo: data.activo,
    },
  });
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
