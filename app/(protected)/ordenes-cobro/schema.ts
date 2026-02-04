import * as z from "zod";

export const ESTADOS_ORDEN_COBRO = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "PAGADA", label: "Pagada" },
  { value: "ANULADA", label: "Anulada" },
] as const;

export const CreateOrdenCobroSchema = z.object({
  pacienteId: z.string().min(1, "El paciente es requerido"),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  concepto: z.string().min(3, "El concepto es requerido"),
  planTratamientoId: z.string().optional().nullable(),
  financiamientoId: z.string().optional().nullable(),
  consultaId: z.string().optional().nullable(),
  seguimientoId: z.string().optional().nullable(),
});

export const OrdenCobroWithRelationsSchema = z.object({
  id: z.string(),
  pacienteId: z.string(),
  planTratamientoId: z.string().optional().nullable(),
  financiamientoId: z.string().optional().nullable(),
  consultaId: z.string().optional().nullable(),
  seguimientoId: z.string().optional().nullable(),
  monto: z.number(),
  concepto: z.string(),
  estado: z.string(),
  fechaEmision: z.date(),
  fechaPago: z.date().optional().nullable(),
  pacienteNombre: z.string().optional(),
  planRef: z.string().optional(),
  financiamientoRef: z.string().optional(),
  consultaRef: z.string().optional(),
  seguimientoRef: z.string().optional(),
});

export type CreateOrdenCobroInput = z.infer<typeof CreateOrdenCobroSchema>;
export type OrdenCobroWithRelations = z.infer<typeof OrdenCobroWithRelationsSchema>;
