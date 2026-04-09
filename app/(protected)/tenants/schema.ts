import { z } from "zod";

export const periodosPlan = ["mensual", "trimestral", "semestral", "anual"] as const;

export const tenantCreateSchema = z.object({
  nombre: z.string().min(3, "El nombre es requerido").max(120),
  slug: z
    .string()
    .min(3, "El slug es requerido")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Use minúsculas, números y guiones"),
  paqueteId: z.string().uuid("Seleccione un paquete válido"),
  periodoPlan: z.enum(periodosPlan, { message: "Seleccione un período de plan válido" }),
  adminNombre: z.string().min(3, "El nombre del admin es requerido").max(120),
  adminCorreo: z.string().email("Correo inválido"),
  adminUsuario: z
    .string()
    .min(4, "Usuario mínimo 4 caracteres")
    .max(50)
    .regex(/^[a-z0-9._-]+$/, "Use minúsculas, números, punto, guión o guión bajo"),
  adminPassword: z.string().min(8, "Contraseña mínima de 8 caracteres").optional(),
});

export const tenantPlanUpdateSchema = z.object({
  tenantId: z.string().uuid("Tenant inválido"),
  paqueteId: z.string().uuid("Paquete inválido"),
  periodoPlan: z.enum(periodosPlan, { message: "Seleccione un período de plan válido" }),
  estado: z.enum(["vigente", "expirado", "cancelado"], { message: "Seleccione un estado comercial válido" }),
  fechaExpiracion: z.coerce.date({
    required_error: "La fecha de finalización es requerida",
    invalid_type_error: "La fecha de finalización no es válida",
  }),
});

export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;
export type TenantPlanUpdateInput = z.infer<typeof tenantPlanUpdateSchema>;
