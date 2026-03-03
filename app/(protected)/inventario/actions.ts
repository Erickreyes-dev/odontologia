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
