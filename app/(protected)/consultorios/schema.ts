import * as z from 'zod';

export const ConsultorioSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre es requerido"),
  ubicacion: z.string(),
  activo: z.boolean(), 
  });

export type Consultorio = z.infer<typeof ConsultorioSchema>;
