
import * as z from 'zod';


export const PacienteSchema = z.object({
    id: z.string().optional(),
    identidad: z.string().min(1, "La identidad es requerida"),
    nombre: z.string().min(1, "El nombre es requerido"),
    apellido: z.string().min(1, "El apellido es requerido"),
    fechaNacimiento: z
        .date()
        .nullable()
        .transform((val) => (val ? new Date(val) : null))
        .optional(),
    genero: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    correo: z.string().email("Correo inválido").optional().nullable(),
    direccion: z.string().optional().nullable(),
    seguroId: z.string().optional(),
    activo: z.boolean(),
});

export type Paciente = z.infer<typeof PacienteSchema>;
