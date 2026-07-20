import * as z from "zod";

export const MedicoServicioSchema = z.object({
  idEmpleado: z.string().min(1, "Debe seleccionar un médico"),
  porcentajeHonorario: z.number().min(0, "El porcentaje no puede ser negativo").max(100, "El porcentaje no puede ser mayor a 100").optional(),
  nombre: z.string().optional(),
  apellido: z.string().optional(),
});

export const ServicioSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre del servicio es requerido"),
  descripcion: z.string().optional(),
  precioBase: z.number({ invalid_type_error: "El precio debe ser un número" }),
  duracionMin: z.number({ invalid_type_error: "La duración debe ser un número" }),
  activo: z.boolean().optional(),
  mostrarEnLanding: z.boolean().optional(),
  mostrarPrecio: z.boolean().optional(),
  requiereLaboratorio: z.boolean().optional(),
  medicos: z.array(MedicoServicioSchema), // Array de IDs
});

export type Servicio = z.infer<typeof ServicioSchema>;
export type MedicoServicio = z.infer<typeof MedicoServicioSchema>;
