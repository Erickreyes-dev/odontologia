"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { MetodoPago, Prisma } from "@/lib/generated/prisma";
import { tenantWhere, withTenantData } from "@/lib/tenant-query";
import { getTenantContext } from "@/lib/tenant";
import { ensureAccountingCatalogs } from "@/lib/accounting/catalogs";
import { regenerateHonorariosForIngreso, syncIngresoFromPago } from "@/lib/accounting/sync";
import { DescripcionEgresoSchema, EgresoSchema, EquipoInstrumentoSchema, HonorarioEstadoSchema, HonorarioUpdateSchema, IngresoSchema, TipoEgresoSchema, TipoIngresoSchema } from "./schema";

const startOfMonth = (year: number, month: number) => new Date(year, month - 1, 1);
const endOfMonth = (year: number, month: number) => new Date(year, month, 0, 23, 59, 59, 999);
const n = (value: unknown) => Number(value ?? 0);

export async function bootstrapAccountingCatalogs() {
  const { tenantId } = await getTenantContext();
  await ensureAccountingCatalogs(tenantId);
  revalidatePath("/contabilidad");
}

export async function getAccountingCatalogs() {
  const { tenantId } = await getTenantContext();
  await ensureAccountingCatalogs(tenantId);
  const [tiposIngreso, tiposEgreso, pacientes, medicos, productos, serviciosLaboratorio, equipos] = await Promise.all([
    prisma.tipoIngreso.findMany({ where: await tenantWhere<Prisma.TipoIngresoWhereInput>({ activo: true }), orderBy: { nombre: "asc" } }),
    prisma.tipoEgreso.findMany({ where: await tenantWhere<Prisma.TipoEgresoWhereInput>({ activo: true }), include: { descripciones: { where: { activo: true }, orderBy: { nombre: "asc" } } }, orderBy: { nombre: "asc" } }),
    prisma.paciente.findMany({ where: await tenantWhere<Prisma.PacienteWhereInput>({ activo: true }), orderBy: [{ nombre: "asc" }, { apellido: "asc" }] }),
    prisma.medico.findMany({ where: await tenantWhere<Prisma.MedicoWhereInput>({ activo: true }), include: { empleado: true }, orderBy: { empleado: { nombre: "asc" } } }),
    prisma.producto.findMany({ where: await tenantWhere<Prisma.ProductoWhereInput>({ activo: true }), orderBy: { nombre: "asc" } }),
    prisma.servicio.findMany({ where: await tenantWhere<Prisma.ServicioWhereInput>({ activo: true, requiereLaboratorio: true }), orderBy: { nombre: "asc" } }),
    prisma.equipoInstrumento.findMany({ where: await tenantWhere<Prisma.EquipoInstrumentoWhereInput>({ activo: true }), orderBy: { nombre: "asc" } }),
  ]);
  return { tiposIngreso, tiposEgreso, pacientes, medicos, productos, serviciosLaboratorio, equipos };
}

export async function getIngresos() {
  return prisma.ingreso.findMany({
    where: await tenantWhere<Prisma.IngresoWhereInput>(),
    include: { tipoIngreso: true, paciente: true, medico: { include: { empleado: true } }, consulta: true, pago: true, honorarios: true },
    orderBy: { fecha: "desc" },
  });
}

export async function syncIngresosFromPagos() {
  const pagos = await prisma.pago.findMany({ where: await tenantWhere<Prisma.PagoWhereInput>({ estado: { not: "REVERTIDO" } }), select: { id: true } });
  for (const pago of pagos) await syncIngresoFromPago(pago.id);
  revalidatePath("/contabilidad/ingresos");
  revalidatePath("/contabilidad/honorarios");
}

export async function createIngresoManual(input: unknown) {
  const data = IngresoSchema.parse(input);
  const ingreso = await prisma.ingreso.create({ data: await withTenantData({ id: randomUUID(), ...data, metodoPago: data.metodoPago as MetodoPago | null, origen: "MANUAL", editable: true }) });
  await regenerateHonorariosForIngreso(ingreso.id);
  revalidatePath("/contabilidad/ingresos");
  return ingreso;
}

export async function updateIngreso(id: string, input: unknown) {
  const data = IngresoSchema.parse(input);
  const existing = await prisma.ingreso.findFirst({ where: await tenantWhere<Prisma.IngresoWhereInput>({ id }) });
  if (!existing) throw new Error("Ingreso no encontrado");
  const ingreso = await prisma.ingreso.update({ where: { id }, data: { ...data, metodoPago: data.metodoPago as MetodoPago | null } });
  await regenerateHonorariosForIngreso(id);
  revalidatePath("/contabilidad/ingresos");
  revalidatePath("/contabilidad/honorarios");
  return ingreso;
}

export async function createTipoIngreso(input: unknown) {
  const data = TipoIngresoSchema.parse(input);
  const tipo = await prisma.tipoIngreso.create({ data: await withTenantData({ id: randomUUID(), ...data, activo: true }) });
  revalidatePath("/contabilidad/catalogos");
  return tipo;
}

export async function getHonorarios() {
  return prisma.honorarioMedico.findMany({
    where: await tenantWhere<Prisma.HonorarioMedicoWhereInput>(),
    include: { medico: { include: { empleado: true } }, paciente: true, consulta: true, servicio: true, ingreso: true },
    orderBy: { fechaGenerado: "desc" },
  });
}

export async function updateHonorario(id: string, input: unknown) {
  const data = HonorarioUpdateSchema.parse(input);
  const h = await prisma.honorarioMedico.findFirst({ where: await tenantWhere<Prisma.HonorarioMedicoWhereInput>({ id }) });
  if (!h) throw new Error("Honorario no encontrado");
  const comision = n(h.totalServicio) * (data.porcentaje / 100);
  await prisma.honorarioMedico.update({ where: { id }, data: { porcentaje: data.porcentaje, comision, comentario: data.comentario } });
  revalidatePath("/contabilidad/honorarios");
}

export async function updateHonorarioEstado(input: unknown) {
  const data = HonorarioEstadoSchema.parse(input);
  const h = await prisma.honorarioMedico.findFirst({ where: await tenantWhere<Prisma.HonorarioMedicoWhereInput>({ id: data.id }) });
  if (!h) throw new Error("Honorario no encontrado");
  await prisma.honorarioMedico.update({ where: { id: data.id }, data: { estado: data.estado, comentario: data.comentario, fechaLiquidado: data.estado === "LIQUIDADO" ? new Date() : null } });
  if (data.estado === "LIQUIDADO") {
    const { tenantId } = await getTenantContext();
    const { tiposEgreso } = await ensureAccountingCatalogs(tenantId);
    const tipo = tiposEgreso.find((t) => t.nombre === "Nómina") ?? tiposEgreso[0];
    if (tipo) {
      await prisma.egreso.upsert({
        where: { id: `hon-${data.id}` },
        update: { monto: h.comision, comentario: data.comentario, fecha: new Date() },
        create: await withTenantData({ id: `hon-${data.id}`, tipoEgresoId: tipo.id, cantidad: 1, metodoPago: "TRANSFERENCIA" as MetodoPago, monto: h.comision, comentario: data.comentario ?? "Liquidación automática de honorario médico", fecha: new Date(), esAutomatico: true, referenciaTipo: "HONORARIO", referenciaId: data.id }),
      });
    }
  }
  revalidatePath("/contabilidad/honorarios");
  revalidatePath("/contabilidad/egresos");
}

export async function getEgresos() {
  return prisma.egreso.findMany({ where: await tenantWhere<Prisma.EgresoWhereInput>(), include: { tipoEgreso: true, descripcionEgreso: true, producto: true, servicio: true, equipo: true }, orderBy: { fecha: "desc" } });
}

export async function createEgreso(input: unknown) {
  const data = EgresoSchema.parse(input);
  const egreso = await prisma.$transaction(async (tx) => {
    let descripcionEgresoId = data.descripcionEgresoId ?? null;
    const productoId = data.productoId ?? null;
    const servicioId = data.servicioId ?? null;
    let equipoId = data.equipoId ?? null;
    const tipo = await tx.tipoEgreso.findFirst({ where: await tenantWhere<Prisma.TipoEgresoWhereInput>({ id: data.tipoEgresoId }) });
    if (!tipo) throw new Error("Tipo de egreso no válido");
    if (!descripcionEgresoId && data.descripcionManual) {
      let equipo = null;
      if (tipo.nombre === "Equipos e Instrumentos") {
        equipo = await tx.equipoInstrumento.upsert({ where: { tenantId_nombre: { tenantId: tipo.tenantId!, nombre: data.descripcionManual } }, update: { cantidad: { increment: data.cantidad }, costoTotal: { increment: data.monto } }, create: { id: randomUUID(), tenantId: tipo.tenantId, nombre: data.descripcionManual, cantidad: data.cantidad, costoTotal: data.monto, activo: true } });
        equipoId = equipo.id;
      }
      const desc = await tx.descripcionEgreso.create({ data: { id: randomUUID(), tenantId: tipo.tenantId, tipoEgresoId: tipo.id, nombre: data.descripcionManual, equipoId, activo: true } });
      descripcionEgresoId = desc.id;
    }
    if (tipo.nombre === "Materiales Odontológicos" && productoId) await tx.producto.update({ where: { id: productoId }, data: { stock: { increment: Math.trunc(data.cantidad) } } });
    return tx.egreso.create({ data: await withTenantData({ id: randomUUID(), ...data, metodoPago: data.metodoPago as MetodoPago, descripcionEgresoId, productoId, servicioId, equipoId }) });
  });
  revalidatePath("/contabilidad/egresos");
  return egreso;
}

export async function createTipoEgreso(input: unknown) {
  const data = TipoEgresoSchema.parse(input);
  const tipo = await prisma.tipoEgreso.create({ data: await withTenantData({ id: randomUUID(), ...data, activo: true }) });
  revalidatePath("/contabilidad/catalogos");
  return tipo;
}

export async function createDescripcionEgreso(input: unknown) {
  const data = DescripcionEgresoSchema.parse(input);
  const desc = await prisma.descripcionEgreso.create({ data: await withTenantData({ id: randomUUID(), ...data, activo: true }) });
  revalidatePath("/contabilidad/catalogos");
  return desc;
}

export async function getEquiposInstrumentos() {
  return prisma.equipoInstrumento.findMany({ where: await tenantWhere<Prisma.EquipoInstrumentoWhereInput>(), orderBy: { nombre: "asc" } });
}

export async function upsertEquipoInstrumento(input: unknown) {
  const data = EquipoInstrumentoSchema.parse(input);
  if (data.id) {
    await prisma.equipoInstrumento.update({ where: { id: data.id }, data });
  } else {
    await prisma.equipoInstrumento.create({ data: await withTenantData({ id: randomUUID(), ...data, activo: data.activo ?? true }) });
  }
  revalidatePath("/contabilidad/equipos-instrumentos");
}

export async function getEstadoResultados(year: number, month: number) {
  const from = startOfMonth(year, month);
  const to = endOfMonth(year, month);
  const [ingresos, honorarios, egresos, pacientesAtendidos] = await Promise.all([
    prisma.ingreso.findMany({ where: await tenantWhere<Prisma.IngresoWhereInput>({ fecha: { gte: from, lte: to } }), include: { tipoIngreso: true } }),
    prisma.honorarioMedico.findMany({ where: await tenantWhere<Prisma.HonorarioMedicoWhereInput>({ fechaGenerado: { gte: from, lte: to } }) }),
    prisma.egreso.findMany({ where: await tenantWhere<Prisma.EgresoWhereInput>({ fecha: { gte: from, lte: to } }), include: { tipoEgreso: true } }),
    prisma.consulta.count({ where: await tenantWhere<Prisma.ConsultaWhereInput>({ fechaConsulta: { gte: from, lte: to } }) }),
  ]);
  const ingresosServicios = ingresos.filter(i => i.tipoIngreso.nombre === "Servicio").reduce((a, i) => a + n(i.monto), 0);
  const otrosIngresos = ingresos.filter(i => i.tipoIngreso.nombre !== "Servicio").reduce((a, i) => a + n(i.monto), 0);
  const totalIngresos = ingresosServicios + otrosIngresos;
  const honorariosMedicos = honorarios.reduce((a, h) => a + n(h.comision), 0);
  const materiales = egresos.filter(e => e.tipoEgreso.nombre === "Materiales Odontológicos").reduce((a, e) => a + n(e.monto), 0);
  const laboratorio = egresos.filter(e => e.tipoEgreso.nombre === "Laboratorio").reduce((a, e) => a + n(e.monto), 0);
  const costos = honorariosMedicos + materiales + laboratorio;
  const gastosOperacion = egresos.filter(e => e.tipoEgreso.categoriaEstadoResultados === "GASTOS_OPERACION").reduce((a, e) => a + n(e.monto), 0);
  const gastosFinancieros = egresos.filter(e => e.tipoEgreso.categoriaEstadoResultados === "GASTOS_FINANCIEROS").reduce((a, e) => a + n(e.monto), 0);
  const utilidadBruta = totalIngresos - costos;
  const utilidadOperativa = utilidadBruta - gastosOperacion;
  const utilidadAntesImpuestos = utilidadOperativa - gastosFinancieros;
  const impuestos = Math.max(utilidadAntesImpuestos, 0) * 0.15;
  const utilidadNeta = utilidadAntesImpuestos - impuestos;
  const pct = (v: number) => totalIngresos ? (v / totalIngresos) * 100 : 0;
  return { month, year, ingresosServicios, otrosIngresos, totalIngresos, honorariosMedicos, materiales, laboratorio, costos, utilidadBruta, gastosOperacion, utilidadOperativa, gastosFinancieros, utilidadAntesImpuestos, impuestos, utilidadNeta, pacientesAtendidos, ticketPromedio: pacientesAtendidos ? totalIngresos / pacientesAtendidos : 0, indicadores: { margenBruto: pct(utilidadBruta), margenOperativo: pct(utilidadOperativa), margenNeto: pct(utilidadNeta), costoVentas: pct(costos), indiceHonorarios: pct(honorariosMedicos), costoMateriales: pct(materiales), costoLaboratorio: pct(laboratorio), gastosOperativos: pct(gastosOperacion) }, egresosPorTipo: egresos.reduce<Record<string, number>>((acc, e) => { acc[e.tipoEgreso.nombre] = (acc[e.tipoEgreso.nombre] ?? 0) + n(e.monto); return acc; }, {}) };
}
