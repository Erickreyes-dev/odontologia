import * as z from "zod";

// Enums para UI
export const METODOS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "SEGURO", label: "Seguro" },
  { value: "OTRO", label: "Otro" },
] as const;

export const ESTADOS_PAGO = [
  { value: "REGISTRADO", label: "Registrado" },
  { value: "APLICADO", label: "Aplicado" },
  { value: "REVERTIDO", label: "Revertido" },
] as const;

export const ESTADOS_FINANCIAMIENTO = [
  { value: "ACTIVO", label: "Activo" },
  { value: "PAGADO", label: "Pagado" },
  { value: "VENCIDO", label: "Vencido" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

// Schema para crear Pago
export const CreatePagoSchema = z.object({
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  metodo: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA", "SEGURO", "OTRO"]),
  referencia: z.string().max(100).optional().nullable(),
  comentario: z.string().max(255).optional().nullable(),
  ordenCobroId: z.string().min(1, "La orden de cobro es requerida"),
  cuotaId: z.string().optional().nullable(),
});

// Schema para crear Financiamiento
export const CreateFinanciamientoSchema = z.object({
  pacienteId: z.string().min(1, "El paciente es requerido"),
  cotizacionId: z.string().optional().nullable(),
  planTratamientoId: z.string().optional().nullable(),
  montoTotal: z.number().min(0.01, "El monto total debe ser mayor a 0"),
  anticipo: z.number().min(0, "El anticipo debe ser mayor o igual a 0"),
  cuotas: z.number().int().min(1, "Debe haber al menos 1 cuota"),
  interes: z.number(),
  fechaInicio: z.date({
    required_error: "La fecha de inicio es requerida",
    invalid_type_error: "La fecha debe ser válida",
  }),
}).refine(
  (data) => data.anticipo <= data.montoTotal,
  { message: "El anticipo no puede ser mayor al monto total", path: ["anticipo"] }
);

// Cuota de financiamiento (para mostrar)
export const CuotaFinanciamientoSchema = z.object({
  id: z.string(),
  financiamientoId: z.string(),
  numero: z.number(),
  monto: z.number(),
  fechaVencimiento: z.date(),
  pagada: z.boolean(),
  fechaPago: z.date().optional().nullable(),
  pagoId: z.string().optional().nullable(),
});

// Pago con relaciones (para listar)
export const PagoWithRelationsSchema = z.object({
  id: z.string(),
  monto: z.number(),
  metodo: z.string(),
  referencia: z.string().optional().nullable(),
  fechaPago: z.date(),
  estado: z.string(),
  comentario: z.string().optional().nullable(),
  ordenCobroId: z.string(),
  // UI
  pacienteNombre: z.string().optional(),
  financiamientoRef: z.string().optional(),
  ordenRef: z.string().optional(),
});

// Financiamiento con cuotas (para detalle)
export const FinanciamientoDetalleSchema = z.object({
  id: z.string(),
  pacienteId: z.string(),
  cotizacionId: z.string().optional().nullable(),
  planTratamientoId: z.string().optional().nullable(),
  montoTotal: z.number(),
  anticipo: z.number(),
  saldo: z.number(),
  cuotas: z.number(),
  interes: z.number(),
  fechaInicio: z.date(),
  fechaFin: z.date().optional().nullable(),
  estado: z.string(),
  pacienteNombre: z.string().optional(),
  cuotasLista: z.array(CuotaFinanciamientoSchema).optional(),
  totalPagado: z.number().optional(),
});

export type CreatePagoInput = z.infer<typeof CreatePagoSchema>;
export type CreateFinanciamientoInput = z.infer<typeof CreateFinanciamientoSchema>;
export type PagoWithRelations = z.infer<typeof PagoWithRelationsSchema>;
export type CuotaFinanciamiento = z.infer<typeof CuotaFinanciamientoSchema>;
export type FinanciamientoDetalle = z.infer<typeof FinanciamientoDetalleSchema>;
