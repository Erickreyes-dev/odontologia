"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { BadgeCheck, CalendarClock, Check, Globe, ReceiptText, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { capturePaypalAndCreateInvoice, createPaypalSdkOrderForPlan, saveTenantBillingProfile } from "./actions";
import { toast } from "sonner";
import type { SubscriptionStatus } from "@/lib/subscription-status";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID?: string }) => Promise<void>;
        onError?: (error: unknown) => void;
        onClick?: () => void;
      }) => { render: (selector: string) => Promise<void> };
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
  const [cardForm, setCardForm] = useState({
    titular: "",
    numeroTarjeta: "",
    fechaExpiracion: "",
    cvv: "",
  });
  const [isPaypalSdkReady, setIsPaypalSdkReady] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const paypalButtonsRenderedRef = useRef(false);
  const cardFormRef = useRef(cardForm);

  useEffect(() => {
    cardFormRef.current = cardForm;
  }, [cardForm]);

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

  const onPaypalCheckout = useCallback(async (
    periodo: "mensual" | "trimestral" | "semestral" | "anual",
    cardHolderName?: string,
  ) => {
    if (!selectedPackage?.id) {
      toast.error("No hay paquete seleccionado para procesar el pago");
      throw new Error("missing_selected_package");
    }

    const saved = await saveTenantBillingProfile(billing);
    if (!saved.success) {
      toast.error(saved.error);
      throw new Error(saved.error);
    }

    const result = await createPaypalSdkOrderForPlan(periodo, selectedPackage.id, cardHolderName);
    if (!result.success) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    return result.orderId;
  }, [billing, selectedPackage?.id]);

  useEffect(() => {
    if (currentStep !== 3) return;
    if (!props.paypalClientId) return;
    if (typeof window === "undefined") return;
    if (window.paypal) {
      setIsPaypalSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(props.paypalClientId)}&currency=USD&intent=capture&components=buttons`;
    script.async = true;
    script.onload = () => setIsPaypalSdkReady(true);
    script.onerror = () => toast.error("No se pudo cargar el SDK de PayPal");
    document.body.appendChild(script);
  }, [currentStep, props.paypalClientId]);

  useEffect(() => {
    if (currentStep !== 3 || !isPaypalSdkReady || paypalButtonsRenderedRef.current) return;
    if (!window.paypal) return;

    const render = async () => {
      try {
        await window.paypal?.Buttons({
          onClick: () => {
            const holder = cardFormRef.current.titular.trim();
            const number = cardFormRef.current.numeroTarjeta.replace(/\s+/g, "");
            const expiry = cardFormRef.current.fechaExpiracion.trim();
            const cvv = cardFormRef.current.cvv.trim();

            if (!holder || !number || !expiry || !cvv) {
              toast.error("Completa los datos de la tarjeta para continuar");
              throw new Error("missing_card_data");
            }
            if (!/^\d{13,19}$/.test(number)) {
              toast.error("Número de tarjeta inválido");
              throw new Error("invalid_card_number");
            }
            if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
              toast.error("La fecha de expiración debe tener formato MM/AA");
              throw new Error("invalid_expiry");
            }
            if (!/^\d{3,4}$/.test(cvv)) {
              toast.error("CVV inválido");
              throw new Error("invalid_cvv");
            }
          },
          createOrder: () => onPaypalCheckout(selectedPlan, cardFormRef.current.titular.trim()),
          onApprove: async (data) => {
            if (!data.orderID) {
              toast.error("No se recibió la orden de PayPal");
              return;
            }
            const capture = await capturePaypalAndCreateInvoice(data.orderID);
            if (!capture.success) {
              toast.error(capture.error);
              return;
            }
            toast.success("Pago confirmado correctamente");
          },
          onError: (error) => {
            console.error("[Billing][PayPal][buttons][error]", error);
            toast.error("No se pudo procesar el pago con PayPal");
          },
        }).render("#paypal-buttons-container");
        paypalButtonsRenderedRef.current = true;
      } catch (error) {
        console.error("[Billing][PayPal][buttons][render_error]", error);
      }
    };
    void render();
  }, [currentStep, isPaypalSdkReady, onPaypalCheckout, selectedPlan]);

  useEffect(() => {
    if (currentStep === 3) return;
    paypalButtonsRenderedRef.current = false;
  }, [currentStep]);

  const onBillingSave = () => {
    startTransition(() => {
      void (async () => {
        try {
          console.info("[Billing][saveBillingProfile][start]", {
            timestamp: new Date().toISOString(),
            selectedPlan,
            selectedPackageId: selectedPackage?.id ?? null,
          });
          const result = await saveTenantBillingProfile(billing);
          console.info("[Billing][saveBillingProfile][response]", {
            timestamp: new Date().toISOString(),
            success: result.success,
            error: result.success ? null : result.error,
          });
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          setCurrentStep(3);
          toast.success("Datos de facturación guardados. Continúa con tu tarjeta en el paso 3.");
        } catch (error) {
          console.error("[Billing][saveBillingProfile][exception]", error);
          toast.error(error instanceof Error ? error.message : "No se pudo guardar la información de facturación");
        }
      })();
    });
  };

  const onCardExpiryChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    const masked = digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setCardForm((prev) => ({ ...prev, fechaExpiracion: masked }));
  };

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
        <p className="mb-3 text-sm font-semibold">Checkout en pasos</p>
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <button type="button" onClick={() => setCurrentStep(1)} className={`rounded-full border px-3 py-1 ${currentStep === 1 ? "border-cyan-500 text-cyan-600" : ""}`}>Paso 1: Plan</button>
          <button type="button" onClick={() => setCurrentStep(2)} className={`rounded-full border px-3 py-1 ${currentStep === 2 ? "border-cyan-500 text-cyan-600" : ""}`}>Paso 2: Facturación</button>
          <button type="button" onClick={() => setCurrentStep(3)} className={`rounded-full border px-3 py-1 ${currentStep === 3 ? "border-cyan-500 text-cyan-600" : ""}`}>Paso 3: Pago</button>
        </div>
      </div>

      {currentStep === 1 ? <div className="rounded-2xl border bg-card p-4">
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
        <div className="mt-4">
          <Button type="button" onClick={() => setCurrentStep(2)}>Continuar a facturación</Button>
        </div>
      </div> : null}

      {currentStep === 1 ? <div className="rounded-2xl border bg-card p-4">
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
      </div> : null}

      {currentStep === 2 ? <div className="rounded-2xl border bg-card p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium"><ReceiptText className="h-4 w-4 text-cyan-500" /> 2) Datos de facturación</p>
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
          <Button type="button" variant="outline" onClick={onBillingSave} disabled={isPending}>Guardar datos y continuar al pago</Button>
          <Button type="button" onClick={() => setCurrentStep(3)} disabled={isPending}>Continuar al pago</Button>
        </div>
      </div> : null}

      {currentStep === 3 ? <div className="rounded-2xl border bg-card p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium"><WalletCards className="h-4 w-4 text-cyan-500" /> 3) Confirma y paga</p>
        <p className="text-sm text-muted-foreground">
          Se cobrará <span className="font-semibold text-foreground">USD {selectedAmount.toFixed(2)}</span> por el plan <span className="font-semibold text-foreground">{selectedPlan}</span> del paquete <span className="font-semibold text-foreground">{selectedPackage?.nombre ?? "seleccionado"}</span>.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <Label>Nombre del titular</Label>
            <Input
              value={cardForm.titular}
              onChange={(e) => setCardForm((prev) => ({ ...prev, titular: e.target.value }))}
              placeholder="Como aparece en la tarjeta"
              autoComplete="cc-name"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Número de tarjeta</Label>
            <Input
              value={cardForm.numeroTarjeta}
              onChange={(e) => setCardForm((prev) => ({ ...prev, numeroTarjeta: e.target.value }))}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              autoComplete="cc-number"
            />
          </div>
          <div className="space-y-1">
            <Label>Fecha de expiración</Label>
            <Input
              value={cardForm.fechaExpiracion}
              onChange={(e) => onCardExpiryChange(e.target.value)}
              placeholder="MM/AA"
              inputMode="numeric"
              maxLength={5}
              autoComplete="cc-exp"
            />
          </div>
          <div className="space-y-1">
            <Label>CVV</Label>
            <Input
              value={cardForm.cvv}
              onChange={(e) => setCardForm((prev) => ({ ...prev, cvv: e.target.value }))}
              placeholder="123"
              inputMode="numeric"
              autoComplete="cc-csc"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} disabled={isPending}>Volver a facturación</Button>
        </div>
        <div id="paypal-buttons-container" className="mt-4" />
        <p className="mt-2 text-xs text-muted-foreground">El pago se procesa desde este sitio con el SDK oficial de PayPal (sin redirección completa).</p>
      </div> : null}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><WalletCards className="h-3.5 w-3.5" /> Factura automática al confirmar pago</span>
        <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Cambio de plan/período sin penalización</span>
      </div>
    </div>
  );
}
