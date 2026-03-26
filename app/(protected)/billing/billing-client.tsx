"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createCheckoutForLatestInvoice, createNewTenantInvoice } from "./actions";
import { toast } from "sonner";

export function BillingClient() {
  const [isPending, startTransition] = useTransition();

  const onNewInvoice = (periodo: "trimestral" | "semestral" | "anual") => {
    startTransition(async () => {
      const result = await createNewTenantInvoice(periodo);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Factura generada");
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
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={isPending} onClick={() => onNewInvoice("trimestral")}>Trimestral</Button>
      <Button variant="outline" disabled={isPending} onClick={() => onNewInvoice("semestral")}>Semestral</Button>
      <Button variant="outline" disabled={isPending} onClick={() => onNewInvoice("anual")}>Anual</Button>
      <Button disabled={isPending} onClick={onPaypalCheckout}>Pagar con PayPal</Button>
    </div>
  );
}
