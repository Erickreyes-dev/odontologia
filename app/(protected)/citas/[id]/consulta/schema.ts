import * as z from "zod";

export const ConsultaSchema = z.object({
  id: z.string().optional(),
  citaId: z.string().min(1, "La cita es requerida"),
  fechaConsulta: z.date().optional().nullable(),
  diagnostico: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  observacionesClinicas: z.string().nullable().optional(),
  servicios: z.array(
    z.object({
      id: z.string().optional(),
      servicioId: z.string().min(1, "El servicio es requerido"),
      precioAplicado: z.number().min(0, "El precio debe ser mayor o igual a 0"),
      cantidad: z.number().min(1, "La cantidad debe ser mayor a 0"),
      servicioNombre: z.string().optional(),
    })
  ).optional(),
  productos: z.array(
    z.object({
      id: z.string().optional(),
      productoId: z.string().min(1, "El producto es requerido"),
      precioAplicado: z.number().min(0, "El precio debe ser mayor o igual a 0"),
      cantidad: z.number().min(1, "La cantidad debe ser mayor a 0"),
      productoNombre: z.string().optional(),
    })
  ).optional(),
  seguimientoId: z.string().optional().nullable(),
  financiamientoId: z.string().optional().nullable(),
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
