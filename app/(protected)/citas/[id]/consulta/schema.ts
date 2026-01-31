import * as z from "zod";

export const ConsultaServicioSchema = z.object({
  id: z.string().optional(),
  consultaId: z.string().optional(),
  servicioId: z.string().min(1, "El servicio es requerido"),
  precioAplicado: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  cantidad: z.number().min(1, "La cantidad debe ser al menos 1").default(1),
  // Datos del servicio para mostrar
  servicio: z.object({
    id: z.string(),
    nombre: z.string(),
    precioBase: z.number(),
  }).optional(),
});

export const ConsultaSchema = z.object({
  id: z.string().optional(),
  citaId: z.string().min(1, "La cita es requerida"),
  diagnostico: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  detalles: z.array(ConsultaServicioSchema).default([]),
  // Datos de la cita para mostrar
  cita: z.object({
    id: z.string(),
    fechaHora: z.date(),
    motivo: z.string().optional().nullable(),
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
export type ConsultaServicio = z.infer<typeof ConsultaServicioSchema>;
