import { z } from "zod";

export const tenantCreateSchema = z.object({
  nombre: z.string().min(3, "El nombre es requerido").max(120),
  slug: z
    .string()
    .min(3, "El slug es requerido")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Use minúsculas, números y guiones"),
  plan: z.string().min(3).max(30).default("starter"),
  maxUsuarios: z.number().int().min(1).max(10000).default(20),
  adminNombre: z.string().min(3, "El nombre del admin es requerido").max(120),
  adminCorreo: z.string().email("Correo inválido"),
  adminUsuario: z
    .string()
    .min(4, "Usuario mínimo 4 caracteres")
    .max(50)
    .regex(/^[a-z0-9._-]+$/, "Use minúsculas, números, punto, guión o guión bajo"),
  adminPassword: z.string().min(8, "Contraseña mínima de 8 caracteres").optional(),
});

export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;
