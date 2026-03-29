"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { BadgeCheck, CalendarClock, Check, Globe, ReceiptText, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { capturePaypalAndCreateInvoice, createCheckoutForPlan, createPaypalSdkOrderForPlan, saveTenantBillingProfile } from "./actions";
import { toast } from "sonner";
import type { SubscriptionStatus } from "@/lib/subscription-status";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        fundingSource?: string;
        style?: Record<string, unknown>;
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID?: string }) => Promise<void>;
        onError: (error: unknown) => void;
      }) => { render: (container: HTMLElement) => Promise<void>; close?: () => void };
    };
  }
}

type BillingPackage = {
  id: string;
  nombre: string;
  descripcion: string | null;
  maxUsuarios: number;
  precioMensual: number;
  precioTrimestral: number;
  precioSemestral: number;
  precioAnual: number;
};

type BillingClientProps = {
  paypalClientId: string;
  tenantSlug: string;
  paqueteNombre: string;
  paqueteActualId: string | null;
  periodoPlanActual: "mensual" | "trimestral" | "semestral" | "anual";
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  proximoPago: string | null;
  paquetesDisponibles: BillingPackage[];
  facturarNombre: string;
  facturarCorreo: string;
  facturarTelefono: string;
  facturarTaxId: string;
  facturarDireccion: string;
  facturarCiudad: string;
  facturarPais: string;
  facturarPostal: string;
};

const periods = [
  { period: "mensual" as const, label: "Mensual", description: "Flexibilidad total" },
  { period: "trimestral" as const, label: "Trimestral", description: "Ahorro aproximado 8%" },
  { period: "semestral" as const, label: "Semestral", description: "Ahorro aproximado 13%" },
  { period: "anual" as const, label: "Anual", description: "Mejor precio · ahorro aproximado 20%" },
];

export function BillingClient(props: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState<"mensual" | "trimestral" | "semestral" | "anual">(props.periodoPlanActual);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(props.paqueteActualId ?? props.paquetesDisponibles[0]?.id ?? null);
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
  const [sdkReady, setSdkReady] = useState(false);
  const [isCardProcessing, setIsCardProcessing] = useState(false);
  const paypalCardContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedPackage = useMemo(
    () => props.paquetesDisponibles.find((item) => item.id === selectedPackageId) ?? props.paquetesDisponibles[0],
    [props.paquetesDisponibles, selectedPackageId],
  );

  const pricingByPeriod = selectedPackage
    ? {
      mensual: selectedPackage.precioMensual,
      trimestral: selectedPackage.precioTrimestral,
      semestral: selectedPackage.precioSemestral,
      anual: selectedPackage.precioAnual,
    }
    : { mensual: 0, trimestral: 0, semestral: 0, anual: 0 };

  const selectedAmount = pricingByPeriod[selectedPlan];
  const trialDaysLeft = props.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(props.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const statusTone = props.subscriptionStatus === "vigente"
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/40"
    : props.subscriptionStatus === "cancelado"
      ? "bg-rose-500/10 text-rose-700 border-rose-500/40"
      : "bg-amber-500/10 text-amber-700 border-amber-500/40";

  const onPaypalCheckout = (periodo: "mensual" | "trimestral" | "semestral" | "anual") => {
    startTransition(() => {
      void (async () => {
        try {
          if (!selectedPackage?.id) {
            toast.error("No hay paquete seleccionado para procesar el pago");
            return;
          }

          const saved = await saveTenantBillingProfile(billing);
          if (!saved.success) {
            toast.error(saved.error);
            return;
          }

          const result = await createCheckoutForPlan(periodo, selectedPackage.id);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          if (result.approveLink) {
            window.location.assign(result.approveLink);
            return;
          }
          toast.error("No se recibió URL de PayPal para continuar el pago");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Error inesperado al iniciar pago con PayPal");
        }
      })();
    });
  };

  const onBillingSave = () => {
    startTransition(() => {
      void (async () => {
        try {
          const result = await saveTenantBillingProfile(billing);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Datos de facturación guardados");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "No se pudo guardar la información de facturación");
        }
      })();
    });
  };

  useEffect(() => {
    if (!props.paypalClientId) {
      setSdkReady(false);
      return;
    }
    if (window.paypal?.Buttons) {
      setSdkReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-paypal-sdk='true']");
    if (existingScript) {
      const onLoad = () => setSdkReady(true);
      existingScript.addEventListener("load", onLoad);
      return () => existingScript.removeEventListener("load", onLoad);
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(props.paypalClientId)}&currency=USD&intent=capture&components=buttons&enable-funding=card&disable-funding=venmo,paylater&commit=true`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = () => setSdkReady(true);
    script.onerror = () => {
      setSdkReady(false);
      toast.error("No se pudo cargar el SDK de PayPal. Verifica NEXT_PUBLIC_PAYPAL_CLIENT_ID y que paypal.com no esté bloqueado.");
    };
    document.body.appendChild(script);
  }, [props.paypalClientId]);

  useEffect(() => {
    if (!sdkReady || !paypalCardContainerRef.current || !window.paypal?.Buttons) return;
    if (!selectedPackage?.id) return;

    paypalCardContainerRef.current.innerHTML = "";
    const buttons = window.paypal.Buttons({
      fundingSource: "card",
      style: { layout: "vertical", label: "pay", shape: "rect", tagline: false },
      createOrder: async () => {
        const saved = await saveTenantBillingProfile(billing);
        if (!saved.success) throw new Error(saved.error);

        const result = await createPaypalSdkOrderForPlan(selectedPlan, selectedPackage.id);
        if (!result.success) throw new Error(result.error);
        return result.orderId;
      },
      onApprove: async (data) => {
        const orderId = data.orderID;
        if (!orderId) throw new Error("PayPal no devolvió orderID");

        setIsCardProcessing(true);
        const capture = await capturePaypalAndCreateInvoice(orderId);
        setIsCardProcessing(false);
        if (!capture.success) throw new Error(capture.error);

        toast.success("Pago confirmado con PayPal.");
        window.location.assign("/billing?payment=success");
      },
      onError: (error) => {
        setIsCardProcessing(false);
        toast.error(error instanceof Error ? error.message : "No se pudo completar el pago con tarjeta");
      },
    });

    void buttons.render(paypalCardContainerRef.current);
    return () => {
      if (buttons.close) buttons.close();
    };
  }, [billing, sdkReady, selectedPackage?.id, selectedPlan, selectedPackage]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-indigo-500/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold"><BadgeCheck className="h-4 w-4 text-cyan-500" /> Suscripción: {props.paqueteNombre}</p>
            <p className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusTone}`}>
              Estado: {props.subscriptionStatus}
            </p>
            {props.trialEndsAt ? (
              <p className="mt-1 text-xs text-muted-foreground">Prueba gratuita: {trialDaysLeft} día(s) restantes</p>
            ) : null}
            {props.proximoPago ? (
              <p className="mt-1 text-xs text-muted-foreground">Próximo pago: {new Date(props.proximoPago).toLocaleDateString()}</p>
            ) : null}
            <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Globe className="h-3.5 w-3.5" /> {props.tenantSlug}.medisoftcore.com</p>
          </div>
          <div className="rounded-xl border bg-background/80 px-3 py-2 text-right">
            <p className="text-xs text-muted-foreground">Selección actual</p>
            <p className="text-sm font-semibold">{selectedPackage?.nombre ?? "Sin paquete"} · {selectedPlan}</p>
            <p className="text-lg font-bold">USD {selectedAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="mb-3 text-sm font-medium">1) Elige tu paquete</p>
        <div className="grid gap-3 md:grid-cols-3">
          {props.paquetesDisponibles.map((pkg) => {
            const isSelected = selectedPackage?.id === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                disabled={isPending}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`rounded-xl border p-3 text-left transition ${isSelected ? "border-cyan-500 ring-1 ring-cyan-500/40" : "hover:border-cyan-400/60"}`}
              >
                <p className="text-sm font-semibold">{pkg.nombre}</p>
                <p className="text-xs text-muted-foreground">{pkg.descripcion ?? "Sin descripción"}</p>
                <p className="mt-2 text-xs text-muted-foreground">Incluye hasta {pkg.maxUsuarios} usuarios</p>
                <p className="mt-2 text-sm font-semibold">Desde USD {pkg.precioMensual.toFixed(2)}/mes</p>
                {isSelected ? <p className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-600"><Check className="h-3.5 w-3.5" /> Paquete seleccionado</p> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="mb-3 text-sm font-medium">2) Elige el período de facturación</p>
        <div className="grid gap-4 md:grid-cols-4">
          {periods.map((plan) => (
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
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-600"><Check className="h-3.5 w-3.5" /> Seleccionar período</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium"><ReceiptText className="h-4 w-4 text-cyan-500" /> 3) Datos de facturación</p>
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
          <Button type="button" onClick={() => onPaypalCheckout(selectedPlan)} disabled={isPending || isCardProcessing || !selectedPackage}>
            Pagar con PayPal (redirección)
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground">Pago con tarjeta como invitado (sin cuenta PayPal, sujeto a elegibilidad de PayPal por país/riesgo):</p>
          <div ref={paypalCardContainerRef} className="max-w-sm" />
          {!props.paypalClientId ? <p className="text-xs text-amber-600">Configura NEXT_PUBLIC_PAYPAL_CLIENT_ID para habilitar este botón.</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><WalletCards className="h-3.5 w-3.5" /> Factura automática al confirmar pago</span>
        <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Cambio de plan/período sin penalización</span>
      </div>
    </div>
  );
}
