import * as z from "zod";

export const MedicoServicioSchema = z.object({
  idEmpleado: z.string().min(1, "Debe seleccionar un médico"),
});

export const ServicioSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre del servicio es requerido"),
  descripcion: z.string().optional(),
  precioBase: z.number({ invalid_type_error: "El precio debe ser un número" }),
  duracionMin: z.number({ invalid_type_error: "La duración debe ser un número" }),
  activo: z.boolean().optional(),
  medicos: z.array(MedicoServicioSchema), // Array de IDs
});

export type Servicio = z.infer<typeof ServicioSchema>;
export type MedicoServicio = z.infer<typeof MedicoServicioSchema>;
