import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

export const TIPOS_INGRESO_INICIALES = ["Servicio", "Producto", "Alquiler", "Otro"];

export const TIPOS_EGRESO_INICIALES = [
  { nombre: "Materiales Odontológicos", categoriaEstadoResultados: "COSTOS" },
  { nombre: "Laboratorio", categoriaEstadoResultados: "COSTOS" },
  { nombre: "Equipos e Instrumentos", categoriaEstadoResultados: "GASTOS_OPERACION" },
  { nombre: "Mantenimiento y Reparaciones", categoriaEstadoResultados: "GASTOS_OPERACION" },
  { nombre: "Nómina", categoriaEstadoResultados: "GASTOS_OPERACION" },
  { nombre: "Servicios Públicos", categoriaEstadoResultados: "GASTOS_OPERACION" },
  { nombre: "Arrendamiento", categoriaEstadoResultados: "GASTOS_OPERACION" },
  { nombre: "Publicidad y Marketing", categoriaEstadoResultados: "GASTOS_OPERACION" },
  { nombre: "Software y Tecnología", categoriaEstadoResultados: "GASTOS_OPERACION" },
  { nombre: "Papelería y Oficina", categoriaEstadoResultados: "GASTOS_OPERACION" },
  { nombre: "Limpieza", categoriaEstadoResultados: "GASTOS_OPERACION" },
  { nombre: "Transporte", categoriaEstadoResultados: "GASTOS_OPERACION" },
  { nombre: "Capacitación", categoriaEstadoResultados: "GASTOS_OPERACION" },
  { nombre: "Impuestos", categoriaEstadoResultados: "IMPUESTOS" },
  { nombre: "Gastos Bancarios", categoriaEstadoResultados: "GASTOS_FINANCIEROS" },
];

export async function ensureAccountingCatalogs(tenantId: string, tx: Prisma.TransactionClient = prisma) {
  const tiposIngreso = await Promise.all(
    TIPOS_INGRESO_INICIALES.map((nombre) =>
      tx.tipoIngreso.upsert({
        where: { tenantId_nombre: { tenantId, nombre } },
        update: { activo: true },
        create: { tenantId, nombre, sistema: true, activo: true },
      })
    )
  );

  const tiposEgreso = await Promise.all(
    TIPOS_EGRESO_INICIALES.map((tipo) =>
      tx.tipoEgreso.upsert({
        where: { tenantId_nombre: { tenantId, nombre: tipo.nombre } },
        update: { activo: true, categoriaEstadoResultados: tipo.categoriaEstadoResultados },
        create: { tenantId, nombre: tipo.nombre, categoriaEstadoResultados: tipo.categoriaEstadoResultados, sistema: true, activo: true },
      })
    )
  );

  return { tiposIngreso, tiposEgreso };
}
