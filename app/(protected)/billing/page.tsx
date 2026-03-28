import HeaderComponent from "@/components/HeaderComponent";
import { CreditCard } from "lucide-react";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveSubscriptionStatus } from "@/lib/subscription-status";
import { capturePaypalAndCreateInvoice, getTenantBilling } from "./actions";
import { BillingClient } from "./billing-client";

export default async function BillingPage({
  searchParams,
}: {
  searchParams?:
    | { [key: string]: string | string[] | undefined }
    | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = searchParams ? await Promise.resolve(searchParams) : undefined;
  const paypalState = typeof params?.paypal === "string" ? params.paypal : undefined;
  const paypalToken = typeof params?.token === "string" ? params.token : undefined;
  const subscriptionRequired = params?.subscription === "required";
  const paymentState = typeof params?.payment === "string" ? params.payment : undefined;
  let paymentStatusMessage: { type: "ok" | "error"; message: string } | null = null;

  if (paypalState === "success" && paypalToken) {
    const result = await capturePaypalAndCreateInvoice(paypalToken);
    if (result.success) {
      redirect("/billing?payment=success");
    }
    redirect(`/billing?payment=error&reason=${encodeURIComponent(result.error)}`);
  }

  if (paypalState === "cancelled") {
    redirect("/billing?payment=cancelled");
  }

  if (paymentState === "success") {
    paymentStatusMessage = { type: "ok", message: "Pago confirmado con PayPal. La factura fue generada exitosamente." };
  }

  if (paymentState === "cancelled") {
    paymentStatusMessage = { type: "error", message: "Pago cancelado en PayPal. No se generó factura." };
  }

  if (paymentState === "error") {
    const reason = typeof params?.reason === "string" ? params.reason : "";
    paymentStatusMessage = { type: "error", message: reason || "No se pudo confirmar el pago en PayPal. Intenta nuevamente." };
  }

  if (subscriptionRequired) {
    paymentStatusMessage = {
      type: "error",
      message: "Se requiere una suscripción activa para usar los módulos. Completa el pago para reactivar el acceso.",
    };
  }

  const data = await getTenantBilling();

  if (!data) return <div className="p-4">No se encontró información de facturación.</div>;
  const latestInvoice = data.tenantInvoices[0];
  const periodoPlanActual = ["mensual", "trimestral", "semestral", "anual"].includes(data.periodoPlan)
    ? (data.periodoPlan as "mensual" | "trimestral" | "semestral" | "anual")
    : "mensual";

  const subscriptionStatus = resolveSubscriptionStatus({
    tenantActivo: data.activo,
    trialEndsAt: data.trialEndsAt,
    fechaExpiracion: data.fechaExpiracion,
    proximoPago: data.proximoPago,
  });

  return (
    <div className="container mx-auto py-2 space-y-6">
      <HeaderComponent Icon={CreditCard} screenName="Facturación" description="Gestiona pagos del tenant por paquetes." />

      {paymentStatusMessage ? (
        <div className={`rounded-md border p-3 text-sm ${paymentStatusMessage.type === "ok" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700" : "border-rose-500/50 bg-rose-500/10 text-rose-700"}`}>
          {paymentStatusMessage.message}
        </div>
      ) : null}

      <BillingClient
        tenantSlug={data.slug}
        paqueteNombre={data.paquete?.nombre ?? "Sin paquete"}
        paqueteActualId={data.paqueteId ?? null}
        periodoPlanActual={periodoPlanActual}
        subscriptionStatus={subscriptionStatus}
        trialEndsAt={data.trialEndsAt ? data.trialEndsAt.toISOString() : null}
        proximoPago={data.proximoPago ? data.proximoPago.toISOString() : null}
        paquetesDisponibles={data.paquetesDisponibles.map((pkg) => ({
          id: pkg.id,
          nombre: pkg.nombre,
          descripcion: pkg.descripcion,
          maxUsuarios: pkg.maxUsuarios,
          precioMensual: Number(pkg.precio ?? 0),
          precioTrimestral: Number(pkg.precioTrimestral ?? Number(pkg.precio ?? 0) * 3),
          precioSemestral: Number(pkg.precioSemestral ?? Number(pkg.precio ?? 0) * 6),
          precioAnual: Number(pkg.precioAnual ?? Number(pkg.precio ?? 0) * 12),
        }))}
        facturarNombre={latestInvoice?.facturarNombre ?? data.contactoNombre ?? ""}
        facturarCorreo={latestInvoice?.facturarCorreo ?? data.contactoCorreo ?? ""}
        facturarTelefono={latestInvoice?.facturarTelefono ?? data.telefono ?? ""}
        facturarTaxId={latestInvoice?.facturarTaxId ?? ""}
        facturarDireccion={latestInvoice?.facturarDireccion ?? ""}
        facturarCiudad={latestInvoice?.facturarCiudad ?? ""}
        facturarPais={latestInvoice?.facturarPais ?? data.paisCodigo ?? ""}
        facturarPostal={latestInvoice?.facturarPostal ?? ""}
      />

      <Card>
        <CardHeader><CardTitle>Historial</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {data.tenantInvoices.map((invoice) => (
              <div key={invoice.id} className="rounded border p-2">
                <p>{invoice.periodoPlan} · USD {Number(invoice.total ?? invoice.monto).toFixed(2)} · {invoice.estado}</p>
                <p className="text-xs text-muted-foreground">
                  {invoice.numeroFactura ?? "Sin número"} · {invoice.facturarNombre ?? "Sin nombre"} · {invoice.facturarCorreo ?? "Sin correo"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
