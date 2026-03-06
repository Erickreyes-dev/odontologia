import { z } from "zod";

export const schemaSignIn = z.object({
    tenantSlug: z
        .string({ message: "La clínica es requerida" })
        .max(50, { message: "La clínica no puede exceder 50 caracteres" })
        .transform((value) => value.trim().toLowerCase()),
    usuario: z
        .string({ message: "El nombre de usuario es requerido" })
        .min(1, { message: "El nombre de usuario es requerido" })
        .max(50, { message: "El nombre de usuario no puede exceder 50 caracteres" }),
    contrasena: z
        .string({ message: "La contraseña es requerida" })
        .min(1, { message: "La contraseña es requerida" }),
});
export type TSchemaSignIn = z.infer<typeof schemaSignIn>;
