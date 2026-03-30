"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { disconnectWhatsApp } from "../actions";
import { toast } from "sonner";

type Props = {
  connection: {
    id: string;
    status: string;
    displayPhoneNumber: string | null;
    verifiedName: string | null;
    billingOwner: string;
    lastSyncAt: Date | null;
  } | null;
  sentCount: number;
  receivedCount: number;
  recentErrors: Array<{ id: string; errorMessage: string | null; createdAt: Date }>;
};

export function WhatsAppDashboard({ connection, sentCount, receivedCount, recentErrors }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleStart = async () => {
    const response = await fetch("/api/whatsapp/connect/start", { method: "POST" });
    const data = await response.json();
    if (!response.ok || !data.success) {
      toast.error(data.error ?? "No se pudo iniciar la conexión");
      return;
    }
    window.location.href = data.url;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Conexión WhatsApp Business</CardTitle>
          <CardDescription>Facturación directa con Meta. La plataforma no revende ni factura tráfico WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span>Estado:</span>
            <Badge variant="outline">{connection?.status ?? "disconnected"}</Badge>
          </div>
          {connection ? (
            <>
              <p>Número: {connection.displayPhoneNumber ?? "No disponible"}</p>
              <p>Nombre verificado: {connection.verifiedName ?? "No disponible"}</p>
              <p>Billing mode: {connection.billingOwner}</p>
              <p>Última sincronización: {connection.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString() : "Sin sincronización"}</p>
            </>
          ) : null}

          {!connection || connection.status !== "connected" ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button>Conectar WhatsApp</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Estás seguro de conectar tu WhatsApp Business?</DialogTitle>
                  <DialogDescription>
                    Conectarás tu propio número de clínica. El consumo de mensajes se paga directamente a Meta con tu cuenta.
                    Nuestra plataforma no te cobrará el tráfico de WhatsApp, solo tu plan del sistema. Tú mantienes el control de tu línea y facturación.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-start gap-2 py-2">
                  <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(Boolean(v))} id="terms-meta" />
                  <label htmlFor="terms-meta" className="text-sm">Acepto los términos de conexión y cobro directo con Meta.</label>
                </div>
                <DialogFooter>
                  <Button onClick={handleStart} disabled={!accepted}>Iniciar conexión segura</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleStart}>Reconectar</Button>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await disconnectWhatsApp(connection.id);
                    toast.success("Conexión desconectada");
                    window.location.reload();
                  })
                }
              >
                Desconectar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observabilidad</CardTitle>
          <CardDescription>Facturación directa con Meta (informativo).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Mensajes enviados: {sentCount}</p>
          <p>Mensajes recibidos: {receivedCount}</p>
          <div>
            <p className="font-medium">Errores recientes:</p>
            {recentErrors.length === 0 ? <p className="text-sm text-muted-foreground">Sin errores recientes</p> : null}
            {recentErrors.map((err) => (
              <p key={err.id} className="text-sm">{new Date(err.createdAt).toLocaleString()} - {err.errorMessage ?? "Sin detalle"}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
