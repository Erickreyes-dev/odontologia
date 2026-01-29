// lib/schemas.ts
import { z } from "zod";

export const schemaResetPassword = z
    .object({
        nueva: z.string().min(8, "Mínimo 8 caracteres"),
        confirmar: z.string(),
    })
    .refine((data) => data.nueva === data.confirmar, {
        message: "Las contraseñas no coinciden",
        path: ["confirmar"],
    });

export type TSchemaResetPassword = z.infer<typeof schemaResetPassword>;
