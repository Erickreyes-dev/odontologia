import HeaderComponent from "@/components/HeaderComponent";
import { CreditCard } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTenantBilling } from "./actions";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const data = await getTenantBilling();

  if (!data) return <div className="p-4">No se encontró información de facturación.</div>;

  return (
    <div className="container mx-auto py-2 space-y-6">
      <HeaderComponent Icon={CreditCard} screenName="Facturación" description="Gestiona pagos del tenant por paquetes." />

      <Card>
        <CardHeader>
          <CardTitle>Pagos y período</CardTitle>
        </CardHeader>
        <CardContent>
          <BillingClient />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historial</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {data.tenantInvoices.map((invoice) => (
              <div key={invoice.id} className="rounded border p-2">
                {invoice.periodoPlan} · USD {Number(invoice.monto).toFixed(2)} · {invoice.estado}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
