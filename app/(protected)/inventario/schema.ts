import * as z from "zod";

export const ProductoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre del producto es requerido"),
  descripcion: z.string().optional(),
  unidad: z.string().optional(),
  stock: z.number({ invalid_type_error: "El stock debe ser un número" }).min(0, "El stock no puede ser negativo"),
  stockMinimo: z
    .number({ invalid_type_error: "El stock mínimo debe ser un número" })
    .min(0, "El stock mínimo no puede ser negativo"),
  activo: z.boolean().optional(),
});

export type Producto = z.infer<typeof ProductoSchema>;
