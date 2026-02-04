import * as z from "zod";

// Estados del plan
export const ESTADOS_PLAN = [
  { value: "ACTIVO", label: "Activo" },
  { value: "PAUSADO", label: "Pausado" },
  { value: "COMPLETADO", label: "Completado" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

// Estados del seguimiento
export const ESTADOS_SEGUIMIENTO = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "REALIZADO", label: "Realizado" },
] as const;

// Schema para etapas del plan
export const PlanEtapaSchema = z.object({
  id: z.string().optional(),
  planId: z.string().optional(),
  servicioId: z.string().min(1, "El servicio es requerido"),
  nombre: z.string().min(1, "El nombre es requerido").max(150),
  descripcion: z.string().max(255).optional().nullable(),
  orden: z.number().min(1),
  intervaloDias: z.number().min(1).optional().nullable(),
  repeticiones: z.number().min(1).optional().nullable(),
  programarCita: z.boolean(),
  responsableMedicoId: z.string().optional().nullable(),
  crearDesdeConsultaId: z.string().optional().nullable(),
  // Para mostrar en UI
  servicioNombre: z.string().optional(),
  medicoNombre: z.string().optional(),
});

// Schema para seguimiento
export const SeguimientoSchema = z.object({
  id: z.string().optional(),
  etapaId: z.string().min(1, "La etapa es requerida"),
  pacienteId: z.string().min(1, "El paciente es requerido"),
  fechaProgramada: z.date({
    required_error: "La fecha programada es requerida",
    invalid_type_error: "La fecha debe ser válida",
  }),
  fechaRealizada: z.date().optional().nullable(),
  estado: z.string().default("PENDIENTE"),
  nota: z.string().max(255).optional().nullable(),
  citaId: z.string().optional().nullable(),
  creadoPorId: z.string().optional().nullable(),
  // Para mostrar en UI
  etapaNombre: z.string().optional(),
  servicioNombre: z.string().optional(),
});

// Schema para plan de tratamiento
export const PlanTratamientoSchema = z.object({
  id: z.string().optional(),
  pacienteId: z.string().min(1, "El paciente es requerido"),
  nombre: z.string().min(1, "El nombre es requerido").max(150),
  descripcion: z.string().max(255).optional().nullable(),
  estado: z.enum(["ACTIVO", "PAUSADO", "COMPLETADO", "CANCELADO"]),
  fechaInicio: z.date({
    required_error: "La fecha de inicio es requerida",
    invalid_type_error: "La fecha debe ser válida",
  }),
  fechaFin: z.date().optional().nullable(),
  medicoResponsableId: z.string().optional().nullable(),
  // Relaciones
  etapas: z.array(PlanEtapaSchema).optional(),
  seguimientos: z.array(SeguimientoSchema).optional(),
  // Para mostrar en UI
  pacienteNombre: z.string().optional(),
  medicoNombre: z.string().optional(),
  totalEtapas: z.number().optional(),
  totalSeguimientos: z.number().optional(),
  seguimientosCompletados: z.number().optional(),
});

export type PlanEtapa = z.infer<typeof PlanEtapaSchema>;
export type Seguimiento = z.infer<typeof SeguimientoSchema>;
export type PlanTratamiento = z.infer<typeof PlanTratamientoSchema>;
