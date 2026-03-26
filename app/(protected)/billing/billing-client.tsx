"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, CalendarClock, Check, Globe, ReceiptText, Sparkles, WalletCards } from "lucide-react";
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
  const [selectedPlan, setSelectedPlan] = useState<"mensual" | "trimestral" | "semestral" | "anual">("mensual");
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
  const selectedAmount = pricingByPeriod[selectedPlan];

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
    <div className="space-y-5">
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-indigo-500/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold"><BadgeCheck className="h-4 w-4 text-cyan-500" /> Suscripción activa: {props.paqueteNombre}</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Globe className="h-3.5 w-3.5" /> {props.tenantSlug}.medisoftcore.com</p>
          </div>
          <div className="rounded-xl border bg-background/80 px-3 py-2 text-right">
            <p className="text-xs text-muted-foreground">Plan seleccionado</p>
            <p className="text-lg font-bold">USD {selectedAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {plans.map((plan) => (
          <button
            key={plan.period}
            type="button"
            className={`rounded-2xl border bg-card p-4 text-left transition hover:border-cyan-400/60 hover:shadow-sm ${selectedPlan === plan.period ? "border-cyan-500 ring-1 ring-cyan-500/40" : ""}`}
            disabled={isPending}
            onClick={() => setSelectedPlan(plan.period)}
          >
            <p className="text-sm font-semibold">{plan.label}</p>
            <p className="text-xs text-muted-foreground">{plan.description}</p>
            <p className="mt-2 text-xl font-bold">USD {pricingByPeriod[plan.period].toFixed(2)}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-600"><Check className="h-3.5 w-3.5" /> Seleccionar plan</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium"><ReceiptText className="h-4 w-4 text-cyan-500" /> Datos de facturación</p>
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
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onBillingSave} disabled={isPending}>Guardar datos</Button>
          <Button type="button" onClick={() => onPaypalCheckout(selectedPlan)} disabled={isPending}>
            <Sparkles className="mr-2 h-4 w-4" /> Continuar pago con PayPal
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><WalletCards className="h-3.5 w-3.5" /> Factura automática al confirmar pago</span>
        <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Cambio de plan sin penalización</span>
      </div>
    </div>
  );
}
