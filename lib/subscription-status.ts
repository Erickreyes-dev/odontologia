export type SubscriptionStatus = "vigente" | "expirado" | "cancelado";

export function resolveSubscriptionStatus(params: {
  tenantActivo?: boolean | null;
  trialEndsAt?: Date | string | null;
  proximoPago?: Date | string | null;
  now?: Date;
}): SubscriptionStatus {
  if (params.tenantActivo === false) return "cancelado";

  const nowMs = (params.now ?? new Date()).getTime();
  const trialMs = params.trialEndsAt ? new Date(params.trialEndsAt).getTime() : NaN;
  const pagoMs = params.proximoPago ? new Date(params.proximoPago).getTime() : NaN;

  const hasTrial = Number.isFinite(trialMs) && trialMs > nowMs;
  const hasPaidPeriod = Number.isFinite(pagoMs) && pagoMs > nowMs;

  return hasTrial || hasPaidPeriod ? "vigente" : "expirado";
}

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === "vigente";
}
