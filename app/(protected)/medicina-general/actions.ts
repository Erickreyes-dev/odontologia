"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import {
  alergiaPacienteSchema,
  diagnosticoSchema,
  historiaClinicaSchema,
  interconsultaSchema,
  medicamentoSchema,
  ordenEstudioSchema,
  prescripcionSchema,
  programaCronicoSchema,
  signoVitalSchema,
} from "./schema";

function toStringOrUndefined(value: FormDataEntryValue | null) {
  const parsed = typeof value === "string" ? value.trim() : "";
  return parsed.length ? parsed : undefined;
}

export async function createHistoriaClinicaAction(formData: FormData) {
  const { tenantId } = await getTenantContext();
  const parsed = historiaClinicaSchema.parse({
    pacienteId: formData.get("pacienteId"),
    hpi: toStringOrUndefined(formData.get("hpi")),
    antecedentesPersonales: toStringOrUndefined(formData.get("antecedentesPersonales")),
    antecedentesFamiliares: toStringOrUndefined(formData.get("antecedentesFamiliares")),
    habitos: toStringOrUndefined(formData.get("habitos")),
  });

  await prisma.historiaClinica.upsert({
    where: { pacienteId: parsed.pacienteId },
    update: {
      hpi: parsed.hpi,
      antecedentesPersonales: parsed.antecedentesPersonales,
      antecedentesFamiliares: parsed.antecedentesFamiliares,
      habitos: parsed.habitos,
    },
    create: {
      id: randomUUID(),
      tenantId,
      pacienteId: parsed.pacienteId,
      hpi: parsed.hpi,
      antecedentesPersonales: parsed.antecedentesPersonales,
      antecedentesFamiliares: parsed.antecedentesFamiliares,
      habitos: parsed.habitos,
    },
  });

  revalidatePath("/medicina-general");
}

export async function createAlergiaPacienteAction(formData: FormData) {
  const { tenantId } = await getTenantContext();
  const parsed = alergiaPacienteSchema.parse({
    pacienteId: formData.get("pacienteId"),
    alergeno: formData.get("alergeno"),
    reaccion: toStringOrUndefined(formData.get("reaccion")),
    severidad: formData.get("severidad"),
  });

  await prisma.alergiaPaciente.create({
    data: {
      id: randomUUID(),
      tenantId,
      pacienteId: parsed.pacienteId,
      alergeno: parsed.alergeno,
      reaccion: parsed.reaccion,
      severidad: parsed.severidad,
    },
  });

  revalidatePath("/medicina-general");
}

export async function createSignoVitalAction(formData: FormData) {
  const { tenantId } = await getTenantContext();
  const parsed = signoVitalSchema.parse({
    consultaId: formData.get("consultaId"),
    tensionSistolica: toStringOrUndefined(formData.get("tensionSistolica")),
    tensionDiastolica: toStringOrUndefined(formData.get("tensionDiastolica")),
    frecuenciaCardiaca: toStringOrUndefined(formData.get("frecuenciaCardiaca")),
    temperatura: toStringOrUndefined(formData.get("temperatura")),
    saturacionOxigeno: toStringOrUndefined(formData.get("saturacionOxigeno")),
    pesoKg: toStringOrUndefined(formData.get("pesoKg")),
    tallaM: toStringOrUndefined(formData.get("tallaM")),
    examenFisico: toStringOrUndefined(formData.get("examenFisico")),
  });

  const imc = parsed.pesoKg && parsed.tallaM ? parsed.pesoKg / (parsed.tallaM * parsed.tallaM) : undefined;
  const alertaCritica =
    (parsed.tensionSistolica ?? 0) >= 180 ||
    (parsed.tensionDiastolica ?? 0) >= 120 ||
    (parsed.saturacionOxigeno ?? 100) < 90;

  await prisma.signoVital.create({
    data: {
      id: randomUUID(),
      tenantId,
      consultaId: parsed.consultaId,
      tensionSistolica: parsed.tensionSistolica,
      tensionDiastolica: parsed.tensionDiastolica,
      frecuenciaCardiaca: parsed.frecuenciaCardiaca,
      temperatura: parsed.temperatura,
      saturacionOxigeno: parsed.saturacionOxigeno,
      pesoKg: parsed.pesoKg,
      tallaM: parsed.tallaM,
      imc,
      examenFisico: parsed.examenFisico,
      alertaCritica,
    },
  });

  revalidatePath("/medicina-general");
}

export async function createDiagnosticoAction(formData: FormData) {
  const { tenantId } = await getTenantContext();
  const parsed = diagnosticoSchema.parse({
    consultaId: formData.get("consultaId"),
    codigo: toStringOrUndefined(formData.get("codigo")),
    descripcion: formData.get("descripcion"),
    principal: formData.get("principal") === "on",
    estado: formData.get("estado"),
  });

  await prisma.diagnosticoConsulta.create({
    data: {
      id: randomUUID(),
      tenantId,
      consultaId: parsed.consultaId,
      codigo: parsed.codigo,
      descripcion: parsed.descripcion,
      principal: parsed.principal ?? false,
      estado: parsed.estado,
    },
  });

  revalidatePath("/medicina-general");
}

export async function createMedicamentoAction(formData: FormData) {
  const { tenantId } = await getTenantContext();
  const parsed = medicamentoSchema.parse({
    principioActivo: formData.get("principioActivo"),
    nombreComercial: toStringOrUndefined(formData.get("nombreComercial")),
    presentacion: toStringOrUndefined(formData.get("presentacion")),
    concentracion: toStringOrUndefined(formData.get("concentracion")),
    viaPreferida: toStringOrUndefined(formData.get("viaPreferida")),
  });

  await prisma.medicamentoCatalogo.create({
    data: {
      id: randomUUID(),
      tenantId,
      ...parsed,
    },
  });

  revalidatePath("/medicina-general");
}

export async function createPrescripcionAction(formData: FormData) {
  const { tenantId } = await getTenantContext();
  const parsed = prescripcionSchema.parse({
    consultaId: formData.get("consultaId"),
    indicacionesGenerales: toStringOrUndefined(formData.get("indicacionesGenerales")),
    medicamentoId: toStringOrUndefined(formData.get("medicamentoId")),
    descripcionLibre: toStringOrUndefined(formData.get("descripcionLibre")),
    dosis: formData.get("dosis"),
    via: formData.get("via"),
    frecuencia: formData.get("frecuencia"),
    duracion: formData.get("duracion"),
    indicacion: toStringOrUndefined(formData.get("indicacion")),
  });

  const prescripcionId = randomUUID();
  await prisma.prescripcion.create({
    data: {
      id: prescripcionId,
      tenantId,
      consultaId: parsed.consultaId,
      indicacionesGenerales: parsed.indicacionesGenerales,
      items: {
        create: {
          id: randomUUID(),
          tenantId,
          medicamentoId: parsed.medicamentoId,
          descripcionLibre: parsed.descripcionLibre,
          dosis: parsed.dosis,
          via: parsed.via,
          frecuencia: parsed.frecuencia,
          duracion: parsed.duracion,
          indicacion: parsed.indicacion,
        },
      },
    },
  });

  revalidatePath("/medicina-general");
}

export async function createOrdenEstudioAction(formData: FormData) {
  const { tenantId } = await getTenantContext();
  const parsed = ordenEstudioSchema.parse({
    consultaId: formData.get("consultaId"),
    tipo: formData.get("tipo"),
    estudioNombre: formData.get("estudioNombre"),
    indicacion: toStringOrUndefined(formData.get("indicacion")),
  });

  await prisma.ordenEstudio.create({
    data: {
      id: randomUUID(),
      tenantId,
      ...parsed,
    },
  });

  revalidatePath("/medicina-general");
}

export async function createInterconsultaAction(formData: FormData) {
  const { tenantId } = await getTenantContext();
  const parsed = interconsultaSchema.parse({
    consultaId: formData.get("consultaId"),
    especialidadDestino: formData.get("especialidadDestino"),
    centroDestino: toStringOrUndefined(formData.get("centroDestino")),
    motivo: formData.get("motivo"),
    urgencia: toStringOrUndefined(formData.get("urgencia")),
  });

  await prisma.interconsulta.create({
    data: {
      id: randomUUID(),
      tenantId,
      ...parsed,
    },
  });

  revalidatePath("/medicina-general");
}

export async function createProgramaCronicoAction(formData: FormData) {
  const { tenantId } = await getTenantContext();
  const parsed = programaCronicoSchema.parse({
    pacienteId: formData.get("pacienteId"),
    tipo: formData.get("tipo"),
    nombrePersonalizado: toStringOrUndefined(formData.get("nombrePersonalizado")),
    metaClinica: toStringOrUndefined(formData.get("metaClinica")),
    observaciones: toStringOrUndefined(formData.get("observaciones")),
  });

  await prisma.programaCronicoPaciente.create({
    data: {
      id: randomUUID(),
      tenantId,
      ...parsed,
    },
  });

  revalidatePath("/medicina-general");
}
