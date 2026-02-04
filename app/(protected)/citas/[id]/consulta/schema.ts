import * as z from "zod";

export const ConsultaSchema = z.object({
  id: z.string().optional(),
  citaId: z.string().min(1, "La cita es requerida"),
  fechaConsulta: z.date().optional().nullable(),
  diagnostico: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  observacionesClinicas: z.string().nullable().optional(),
  // Datos de la cita para mostrar
  cita: z.object({
    id: z.string(),
    fechaHora: z.date(),
    motivo: z.string().nullable().optional(),
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
  }).optional(),
});

export type Consulta = z.infer<typeof ConsultaSchema>;
