import { z } from "zod";

export const historiaClinicaSchema = z.object({
  pacienteId: z.string().min(1),
  hpi: z.string().optional(),
  antecedentesPersonales: z.string().optional(),
  antecedentesFamiliares: z.string().optional(),
  habitos: z.string().optional(),
});

export const alergiaPacienteSchema = z.object({
  pacienteId: z.string().min(1),
  alergeno: z.string().min(2),
  reaccion: z.string().optional(),
  severidad: z.enum(["LEVE", "MODERADA", "SEVERA"]),
});

export const signoVitalSchema = z.object({
  consultaId: z.string().min(1),
  tensionSistolica: z.coerce.number().int().optional(),
  tensionDiastolica: z.coerce.number().int().optional(),
  frecuenciaCardiaca: z.coerce.number().int().optional(),
  temperatura: z.coerce.number().optional(),
  saturacionOxigeno: z.coerce.number().int().optional(),
  pesoKg: z.coerce.number().optional(),
  tallaM: z.coerce.number().optional(),
  examenFisico: z.string().optional(),
});

export const diagnosticoSchema = z.object({
  consultaId: z.string().min(1),
  codigo: z.string().optional(),
  descripcion: z.string().min(3),
  principal: z.boolean().optional(),
  estado: z.enum(["SOSPECHA", "CONFIRMADO", "DESCARTADO"]),
});

export const medicamentoSchema = z.object({
  principioActivo: z.string().min(2),
  nombreComercial: z.string().optional(),
  presentacion: z.string().optional(),
  concentracion: z.string().optional(),
  viaPreferida: z.string().optional(),
});

export const prescripcionSchema = z.object({
  consultaId: z.string().min(1),
  indicacionesGenerales: z.string().optional(),
  medicamentoId: z.string().optional(),
  descripcionLibre: z.string().optional(),
  dosis: z.string().min(1),
  via: z.string().min(1),
  frecuencia: z.string().min(1),
  duracion: z.string().min(1),
  indicacion: z.string().optional(),
});

export const ordenEstudioSchema = z.object({
  consultaId: z.string().min(1),
  tipo: z.enum(["LABORATORIO", "IMAGEN", "OTRO"]),
  estudioNombre: z.string().min(2),
  indicacion: z.string().optional(),
});

export const interconsultaSchema = z.object({
  consultaId: z.string().min(1),
  especialidadDestino: z.string().min(2),
  centroDestino: z.string().optional(),
  motivo: z.string().min(3),
  urgencia: z.string().optional(),
});

export const programaCronicoSchema = z.object({
  pacienteId: z.string().min(1),
  tipo: z.enum(["HTA", "DM2", "DISLIPIDEMIA", "OBESIDAD", "ASMA_EPOC", "OTRO"]),
  nombrePersonalizado: z.string().optional(),
  metaClinica: z.string().optional(),
  observaciones: z.string().optional(),
});
