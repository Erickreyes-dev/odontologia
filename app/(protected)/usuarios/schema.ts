import { z } from "zod";

// Esquema para validación de usuario
export const UsuarioSchema = z.object({
  id: z.string().optional(),
  usuario: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  empleado_id: z.string().uuid("Empleado ID debe ser un UUID válido").nullable().optional(),
  password: z.string().optional(),
  debeCambiarPassword: z.boolean().optional(),
  rol: z.string().optional(),
  empleado: z.string().optional(),
  rol_id: z.string().uuid("Role ID debe ser un UUID válido"),
  activo: z.boolean().optional(),
});

export type Usuario = z.infer<typeof UsuarioSchema>;