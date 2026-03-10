import * as z from "zod";

export const PromocionServicioSchema = z.object({
  servicioId: z.string().min(1, "El servicio es requerido"),
  cantidad: z.number().int().min(1, "La cantidad debe ser mayor o igual a 1"),
  precioAplicado: z.number().min(0, "El precio debe ser mayor o igual a 0").optional().nullable(),
});

export const PromocionSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional().nullable(),
  precioReferencial: z.number().min(0, "El precio referencial debe ser mayor o igual a 0"),
  precioPromocional: z.number().min(0, "El precio promocional debe ser mayor o igual a 0"),
  fechaInicio: z.date().optional().nullable(),
  fechaFin: z.date().optional().nullable(),
  activo: z.boolean().optional(),
  mostrarEnLanding: z.boolean().optional(),
  servicios: z.array(PromocionServicioSchema).min(1, "Debe agregar al menos un servicio"),
});

export type Promocion = z.infer<typeof PromocionSchema>;
