import HeaderComponent from "@/components/HeaderComponent";
import { CreditCard } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capturePaypalAndCreateInvoice, getTenantBilling } from "./actions";
import { BillingClient } from "./billing-client";

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const paypalState = typeof searchParams?.paypal === "string" ? searchParams.paypal : undefined;
  const paypalToken = typeof searchParams?.token === "string" ? searchParams.token : undefined;
  const subscriptionRequired = searchParams?.subscription === "required";
  let paymentStatusMessage: { type: "ok" | "error"; message: string } | null = null;

  if (paypalState === "success" && paypalToken) {
    const result = await capturePaypalAndCreateInvoice(paypalToken);
    paymentStatusMessage = result.success
      ? { type: "ok", message: "Pago confirmado con PayPal. La factura fue generada exitosamente." }
      : { type: "error", message: result.error };
  }

  if (paypalState === "cancelled") {
    paymentStatusMessage = { type: "error", message: "Pago cancelado en PayPal. No se generó factura." };
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

  return (
    <div className="container mx-auto py-2 space-y-6">
      <HeaderComponent Icon={CreditCard} screenName="Facturación" description="Gestiona pagos del tenant por paquetes." />

      {paymentStatusMessage ? (
        <div className={`rounded-md border p-3 text-sm ${paymentStatusMessage.type === "ok" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700" : "border-rose-500/50 bg-rose-500/10 text-rose-700"}`}>
          {paymentStatusMessage.message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Pagos y período</CardTitle>
        </CardHeader>
        <CardContent>
          <BillingClient
            tenantSlug={data.slug}
            paqueteNombre={data.paquete?.nombre ?? "Sin paquete"}
            precioMensual={Number(data.paquete?.precio ?? 0)}
            precioTrimestral={Number(data.paquete?.precioTrimestral ?? Number(data.paquete?.precio ?? 0) * 3)}
            precioSemestral={Number(data.paquete?.precioSemestral ?? Number(data.paquete?.precio ?? 0) * 6)}
            precioAnual={Number(data.paquete?.precioAnual ?? Number(data.paquete?.precio ?? 0) * 12)}
            facturarNombre={latestInvoice?.facturarNombre ?? data.contactoNombre ?? ""}
            facturarCorreo={latestInvoice?.facturarCorreo ?? data.contactoCorreo ?? ""}
            facturarTelefono={latestInvoice?.facturarTelefono ?? data.telefono ?? ""}
            facturarTaxId={latestInvoice?.facturarTaxId ?? ""}
            facturarDireccion={latestInvoice?.facturarDireccion ?? ""}
            facturarCiudad={latestInvoice?.facturarCiudad ?? ""}
            facturarPais={latestInvoice?.facturarPais ?? data.paisCodigo ?? ""}
            facturarPostal={latestInvoice?.facturarPostal ?? ""}
          />
        </CardContent>
      </Card>

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
