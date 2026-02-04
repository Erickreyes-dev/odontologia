"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { Producto } from "./schema";

export async function getProductos(): Promise<Producto[]> {
  const productos = await prisma.producto.findMany({
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
  const p = await prisma.producto.findUnique({
    where: { id },
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
    data: {
      id: randomUUID(),
      nombre: data.nombre,
      descripcion: data.descripcion,
      unidad: data.unidad,
      stock: data.stock,
      stockMinimo: data.stockMinimo,
      activo: data.activo ?? true,
    },
  });
}

export async function putProducto(data: Producto) {
  return prisma.producto.update({
    where: { id: data.id! },
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
