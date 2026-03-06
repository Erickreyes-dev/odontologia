import { z } from "zod";

export const paqueteSchema = z.object({
  nombre: z.string().min(3, "El nombre es requerido").max(80),
  descripcion: z.string().max(255).optional(),
  precio: z.number().min(0, "El precio no puede ser negativo"),
  maxUsuarios: z.number().int().min(1, "Debe permitir al menos 1 usuario").max(10000),
});

export type PaqueteInput = z.infer<typeof paqueteSchema>;
