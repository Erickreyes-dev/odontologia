"use client";

import { useTransition } from "react";
import { BadgeCheck, CalendarClock, Check, Globe, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCheckoutForLatestInvoice, createNewTenantInvoice } from "./actions";
import { toast } from "sonner";

type BillingClientProps = {
  tenantSlug: string;
  paqueteNombre: string;
  precioMensual: number;
  precioTrimestral: number;
  precioAnual: number;
};

const plans = [
  { period: "mensual" as const, label: "Mensual", description: "Flexibilidad total" },
  { period: "trimestral" as const, label: "Trimestral", description: "Ahorro aproximado 8%" },
  { period: "anual" as const, label: "Anual", description: "Mejor precio · ahorro aproximado 20%" },
];

export function BillingClient({ tenantSlug, paqueteNombre, precioMensual, precioTrimestral, precioAnual }: BillingClientProps) {
  const [isPending, startTransition] = useTransition();

  const pricingByPeriod = {
    mensual: precioMensual,
    trimestral: precioTrimestral,
    anual: precioAnual,
  };

  const onNewInvoice = (periodo: "mensual" | "trimestral" | "anual") => {
    startTransition(async () => {
      const result = await createNewTenantInvoice(periodo);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Factura generada correctamente");
    });
  };

  const onPaypalCheckout = () => {
    startTransition(async () => {
      const result = await createCheckoutForLatestInvoice();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.approveLink) window.location.href = result.approveLink;
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
        <p className="flex items-center gap-2 font-medium"><BadgeCheck className="h-4 w-4 text-cyan-500" /> Paquete actual: {paqueteNombre}</p>
        <p className="mt-1 flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /> URL de tu clínica: <strong>{tenantSlug}.medisoftcore.com</strong></p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((plan) => (
          <button
            key={plan.period}
            type="button"
            className="rounded-xl border bg-card p-4 text-left transition hover:border-cyan-400/60 hover:shadow-sm"
            disabled={isPending}
            onClick={() => onNewInvoice(plan.period)}
          >
            <p className="text-sm font-semibold">{plan.label}</p>
            <p className="text-xs text-muted-foreground">{plan.description}</p>
            <p className="mt-2 text-xl font-bold">USD {pricingByPeriod[plan.period].toFixed(2)}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-600"><Check className="h-3.5 w-3.5" /> Generar factura</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={isPending} onClick={onPaypalCheckout}>
          <WalletCards className="mr-2 h-4 w-4" /> Pagar con PayPal
        </Button>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> Upgrade prorrateado sin penalización</span>
      </div>
    </div>
  );
}
