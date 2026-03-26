import HeaderComponent from "@/components/HeaderComponent";
import { CreditCard } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTenantBilling } from "./actions";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const data = await getTenantBilling();

  if (!data) return <div className="p-4">No se encontró información de facturación.</div>;
  const latestInvoice = data.tenantInvoices[0];

  return (
    <div className="container mx-auto py-2 space-y-6">
      <HeaderComponent Icon={CreditCard} screenName="Facturación" description="Gestiona pagos del tenant por paquetes." />

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
