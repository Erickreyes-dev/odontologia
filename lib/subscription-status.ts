export type SubscriptionStatus = "vigente" | "expirado" | "cancelado";
export type PlanPeriod = "mensual" | "trimestral" | "semestral" | "anual";

export function calculateExpirationDateByPlan(periodoPlan: string, baseDate = new Date()): Date {
  const next = new Date(baseDate);

  switch (periodoPlan as PlanPeriod) {
    case "mensual":
      next.setMonth(next.getMonth() + 1);
      break;
    case "trimestral":
      next.setMonth(next.getMonth() + 3);
      break;
    case "semestral":
      next.setMonth(next.getMonth() + 6);
      break;
    case "anual":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next;
}

export function resolveSubscriptionStatus(params: {
  tenantActivo?: boolean | null;
  trialEndsAt?: Date | string | null;
  fechaExpiracion?: Date | string | null;
  proximoPago?: Date | string | null;
  now?: Date;
}): SubscriptionStatus {
  if (params.tenantActivo === false) return "cancelado";

  const nowMs = (params.now ?? new Date()).getTime();
  const trialMs = params.trialEndsAt ? new Date(params.trialEndsAt).getTime() : NaN;
  const expiryInput = params.fechaExpiracion ?? params.proximoPago;
  const expiryMs = expiryInput ? new Date(expiryInput).getTime() : NaN;

  const hasTrial = Number.isFinite(trialMs) && trialMs > nowMs;
  const hasPaidPeriod = Number.isFinite(expiryMs) && expiryMs > nowMs;

  return hasTrial || hasPaidPeriod ? "vigente" : "expirado";
}

export function resolveSubscriptionSnapshot(params: {
  tenantActivo?: boolean | null;
  trialEndsAt?: Date | string | null;
  fechaExpiracion?: Date | string | null;
  proximoPago?: Date | string | null;
  now?: Date;
}) {
  const estado = resolveSubscriptionStatus(params);
  const fechaExpiracion = params.trialEndsAt ?? params.fechaExpiracion ?? params.proximoPago ?? null;
  return { estado, fechaExpiracion };
}

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === "vigente";
}
