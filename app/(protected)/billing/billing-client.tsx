"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, CalendarClock, Check, Globe, ReceiptText, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCheckoutForPlan, saveTenantBillingProfile } from "./actions";
import { toast } from "sonner";

type BillingClientProps = {
  tenantSlug: string;
  paqueteNombre: string;
  precioMensual: number;
  precioTrimestral: number;
  precioSemestral: number;
  precioAnual: number;
  facturarNombre: string;
  facturarCorreo: string;
  facturarTelefono: string;
  facturarTaxId: string;
  facturarDireccion: string;
  facturarCiudad: string;
  facturarPais: string;
  facturarPostal: string;
};

const plans = [
  { period: "mensual" as const, label: "Mensual", description: "Flexibilidad total" },
  { period: "trimestral" as const, label: "Trimestral", description: "Ahorro aproximado 8%" },
  { period: "semestral" as const, label: "Semestral", description: "Ahorro aproximado 13%" },
  { period: "anual" as const, label: "Anual", description: "Mejor precio · ahorro aproximado 20%" },
];

export function BillingClient(props: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [billing, setBilling] = useState({
    facturarNombre: props.facturarNombre,
    facturarCorreo: props.facturarCorreo,
    facturarTelefono: props.facturarTelefono,
    facturarTaxId: props.facturarTaxId,
    facturarDireccion: props.facturarDireccion,
    facturarCiudad: props.facturarCiudad,
    facturarPais: props.facturarPais,
    facturarPostal: props.facturarPostal,
  });

  const pricingByPeriod = {
    mensual: props.precioMensual,
    trimestral: props.precioTrimestral,
    semestral: props.precioSemestral,
    anual: props.precioAnual,
  };

  const onPaypalCheckout = (periodo: "mensual" | "trimestral" | "semestral" | "anual") => {
    startTransition(async () => {
      const saved = await saveTenantBillingProfile(billing);
      if (!saved.success) {
        toast.error(saved.error);
        return;
      }

      const result = await createCheckoutForPlan(periodo);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.approveLink) window.location.href = result.approveLink;
    });
  };

  const onBillingSave = () => {
    startTransition(async () => {
      const result = await saveTenantBillingProfile(billing);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Datos de facturación guardados");
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
        <p className="flex items-center gap-2 font-medium"><BadgeCheck className="h-4 w-4 text-cyan-500" /> Paquete actual: {props.paqueteNombre}</p>
        <p className="mt-1 flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /> URL de tu clínica: <strong>{props.tenantSlug}.medisoftcore.com</strong></p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="mb-3 flex items-center gap-2 font-medium"><ReceiptText className="h-4 w-4 text-cyan-500" /> Datos naturales de facturación</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1"><Label>Razón social / Nombre</Label><Input value={billing.facturarNombre} onChange={(e) => setBilling((p) => ({ ...p, facturarNombre: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Correo facturación</Label><Input value={billing.facturarCorreo} onChange={(e) => setBilling((p) => ({ ...p, facturarCorreo: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Teléfono</Label><Input value={billing.facturarTelefono} onChange={(e) => setBilling((p) => ({ ...p, facturarTelefono: e.target.value }))} /></div>
          <div className="space-y-1"><Label>RTN / NIT / Tax ID</Label><Input value={billing.facturarTaxId} onChange={(e) => setBilling((p) => ({ ...p, facturarTaxId: e.target.value }))} /></div>
          <div className="space-y-1 md:col-span-2"><Label>Dirección</Label><Input value={billing.facturarDireccion} onChange={(e) => setBilling((p) => ({ ...p, facturarDireccion: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Ciudad</Label><Input value={billing.facturarCiudad} onChange={(e) => setBilling((p) => ({ ...p, facturarCiudad: e.target.value }))} /></div>
          <div className="space-y-1"><Label>País</Label><Input value={billing.facturarPais} onChange={(e) => setBilling((p) => ({ ...p, facturarPais: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Código postal</Label><Input value={billing.facturarPostal} onChange={(e) => setBilling((p) => ({ ...p, facturarPostal: e.target.value }))} /></div>
        </div>
        <Button type="button" variant="outline" onClick={onBillingSave} className="mt-3" disabled={isPending}>Guardar datos de facturación</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {plans.map((plan) => (
          <button
            key={plan.period}
            type="button"
            className="rounded-xl border bg-card p-4 text-left transition hover:border-cyan-400/60 hover:shadow-sm"
            disabled={isPending}
            onClick={() => onPaypalCheckout(plan.period)}
          >
            <p className="text-sm font-semibold">{plan.label}</p>
            <p className="text-xs text-muted-foreground">{plan.description}</p>
            <p className="mt-2 text-xl font-bold">USD {pricingByPeriod[plan.period].toFixed(2)}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-600"><Check className="h-3.5 w-3.5" /> Pagar con PayPal</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled>
          <WalletCards className="mr-2 h-4 w-4" /> La factura se crea automáticamente al confirmar el pago
        </Button>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> Upgrade prorrateado sin penalización</span>
      </div>
    </div>
  );
}
