import * as z from "zod";

export const CitaSchema = z.object({
  id: z.string().optional(),
  pacienteId: z.string().min(1, "El paciente es requerido"),
  medicoId: z.string().min(1, "El medico es requerido"),
  consultorioId: z.string().min(1, "El consultorio es requerido"),
  fechaHora: z.date({ required_error: "La fecha y hora son requeridas" }),
  estado: z.string().min(1, "El estado es requerido"),
  motivo: z.string().optional().nullable(),
  observacion: z.string().optional().nullable(),
  
  // Relaciones opcionales para mostrar datos
  paciente: z.object({
    id: z.string(),
    nombre: z.string(),
    apellido: z.string(),
    identidad: z.string(),
  }).optional(),
  
  medico: z.object({
    idEmpleado: z.string(),
    empleado: z.object({
      nombre: z.string(),
      apellido: z.string(),
    }).optional(),
  }).optional(),
  
  consultorio: z.object({
    id: z.string(),
    nombre: z.string(),
  }).optional(),
});

export type Cita = z.infer<typeof CitaSchema>;

export const ESTADOS_CITA = [
  { value: "programada", label: "Programada" },
  { value: "atendida", label: "Atendida" },
  { value: "cancelada", label: "Cancelada" },
] as const;
