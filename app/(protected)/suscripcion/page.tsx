import { getSession } from "@/auth";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { resolveSubscriptionStatus } from "@/lib/subscription-status";
import { AlertTriangle, CreditCard } from "lucide-react";
import Link from "next/link";

export default async function SuscripcionPage({

  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();

  const tenant = session?.TenantId
    ? await prisma.tenant.findUnique({
      where: { id: session.TenantId },
      select: {
        estado: true,
        activo: true,
        trialEndsAt: true,
        fechaExpiracion: true,
        proximoPago: true,
      },
    })
    : null;

  const calculatedStatus = resolveSubscriptionStatus({
    tenantActivo: tenant?.activo,
    trialEndsAt: tenant?.trialEndsAt,
    fechaExpiracion: tenant?.fechaExpiracion,
    proximoPago: tenant?.proximoPago,
  });

  const rawStatus = Array.isArray(searchParams?.status) ? searchParams?.status[0] : searchParams?.status;
  const status = rawStatus ?? tenant?.estado ?? calculatedStatus;

  const reason =
    status === "cancelado"
      ? "Tu paquete fue cancelado y el acceso a los módulos está bloqueado."
      : "Tu paquete está expirado o inactivo. Necesitas renovar o activar un paquete para continuar.";

  return (
    <div className="mx-auto mt-12 max-w-2xl rounded-2xl border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Suscripción requerida</h1>
      <p className="mt-3 text-sm text-muted-foreground">{reason}</p>
      <p className="mt-2 text-sm font-medium text-foreground">Estado actual: {status}</p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/billing">
            <CreditCard className="mr-2 h-4 w-4" />
            Ir a facturación
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
