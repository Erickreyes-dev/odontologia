import * as z from "zod";

export const metodoPagoValues = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "SEGURO", "OTRO"] as const;
export const honorarioEstadoValues = ["PENDIENTE", "LIQUIDADO"] as const;

export const TipoIngresoSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(255).optional().nullable(),
});

export const IngresoSchema = z.object({
  id: z.string().optional(),
  tipoIngresoId: z.string().min(1, "El tipo de ingreso es requerido"),
  pacienteId: z.string().optional().nullable(),
  medicoId: z.string().optional().nullable(),
  consultaId: z.string().optional().nullable(),
  fecha: z.coerce.date(),
  concepto: z.string().min(1).max(255),
  monto: z.number().min(0.01),
  metodoPago: z.enum(metodoPagoValues).optional().nullable(),
  comentario: z.string().max(255).optional().nullable(),
});

export const HonorarioUpdateSchema = z.object({
  porcentaje: z.number().min(0).max(100),
  comentario: z.string().max(255).optional().nullable(),
});

export const HonorarioEstadoSchema = z.object({
  id: z.string().min(1),
  estado: z.enum(honorarioEstadoValues),
  comentario: z.string().max(255).optional().nullable(),
});

export const TipoEgresoSchema = z.object({
  nombre: z.string().min(1).max(120),
  categoriaEstadoResultados: z.string().min(1).max(50).default("GASTOS_OPERACION"),
});

export const DescripcionEgresoSchema = z.object({
  tipoEgresoId: z.string().min(1),
  nombre: z.string().min(1).max(150),
});

export const EgresoSchema = z.object({
  id: z.string().optional(),
  tipoEgresoId: z.string().min(1, "El tipo es requerido"),
  descripcionEgresoId: z.string().optional().nullable(),
  descripcionManual: z.string().max(150).optional().nullable(),
  cantidad: z.number().min(0.01),
  metodoPago: z.enum(metodoPagoValues),
  monto: z.number().min(0.01),
  comentario: z.string().max(255).optional().nullable(),
  fecha: z.coerce.date(),
  productoId: z.string().optional().nullable(),
  servicioId: z.string().optional().nullable(),
  equipoId: z.string().optional().nullable(),
  consultaId: z.string().optional().nullable(),
}).refine((data) => data.descripcionEgresoId || data.descripcionManual || data.productoId || data.servicioId || data.equipoId, {
  message: "Debe seleccionar o escribir una descripción",
  path: ["descripcionManual"],
});

export const EquipoInstrumentoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1).max(150),
  descripcion: z.string().max(255).optional().nullable(),
  cantidad: z.number().min(0),
  costoTotal: z.number().min(0).optional().nullable(),
  activo: z.boolean().optional(),
});

export type IngresoInput = z.infer<typeof IngresoSchema>;
export type EgresoInput = z.infer<typeof EgresoSchema>;
export type EquipoInstrumentoInput = z.infer<typeof EquipoInstrumentoSchema>;
