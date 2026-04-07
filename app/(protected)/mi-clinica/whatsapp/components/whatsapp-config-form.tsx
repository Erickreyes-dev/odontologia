"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { sendWhatsappTestMessage, type TenantWhatsappConfigView, upsertTenantWhatsappConfig } from "../actions";

interface Props {
  config: TenantWhatsappConfigView;
}

export function WhatsappConfigForm({ config }: Props) {
  const [twilioAccountSid, setTwilioAccountSid] = useState(config.twilioAccountSid);
  const [twilioAuthToken, setTwilioAuthToken] = useState(config.twilioAuthToken);
  const [twilioWhatsappNumber, setTwilioWhatsappNumber] = useState(config.twilioWhatsappNumber);
  const [webhookSecret, setWebhookSecret] = useState(config.webhookSecret);
  const [mensajeAutoRespuesta, setMensajeAutoRespuesta] = useState(config.mensajeAutoRespuesta);
  const [aceptaAgendamientoChat, setAceptaAgendamientoChat] = useState(config.aceptaAgendamientoChat);
  const [activo, setActivo] = useState(config.activo);

  const [testPhone, setTestPhone] = useState("");
  const [testBody, setTestBody] = useState("Hola 👋 este es un mensaje de prueba desde tu SaaS.");

  const [isSaving, startSaving] = useTransition();
  const [isSending, startSending] = useTransition();

  const webhookUrl = useMemo(() => {
    if (typeof window === "undefined") return "/api/whatsapp/twilio/webhook";
    return `${window.location.origin}/api/whatsapp/twilio/webhook`;
  }, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startSaving(async () => {
      const result = await upsertTenantWhatsappConfig({
        twilioAccountSid,
        twilioAuthToken,
        twilioWhatsappNumber,
        webhookSecret,
        mensajeAutoRespuesta,
        aceptaAgendamientoChat,
        activo,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Configuración WhatsApp guardada");
    });
  };

  const onSendTest = () => {
    startSending(async () => {
      const result = await sendWhatsappTestMessage({ toPhone: testPhone, body: testBody });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Mensaje de prueba enviado");
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Conexión con Twilio</CardTitle>
          <CardDescription>
            Guarda credenciales por clínica para operar WhatsApp Business desde un proveedor externo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label htmlFor="sid">Twilio Account SID</Label>
              <Input id="sid" value={twilioAccountSid} onChange={(e) => setTwilioAccountSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="token">Twilio Auth Token</Label>
              <Input id="token" type="password" value={twilioAuthToken} onChange={(e) => setTwilioAuthToken(e.target.value)} placeholder="Token secreto" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="number">Número WhatsApp (E.164)</Label>
              <Input id="number" value={twilioWhatsappNumber} onChange={(e) => setTwilioWhatsappNumber(e.target.value)} placeholder="+50499990000" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="secret">Webhook Secret (opcional)</Label>
              <Input id="secret" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder="Se usa para validar X-Twilio-Signature" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="auto">Mensaje auto respuesta</Label>
              <Textarea id="auto" rows={4} value={mensajeAutoRespuesta} onChange={(e) => setMensajeAutoRespuesta(e.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="text-sm font-medium">Aceptar citas por chat</p>
                  <p className="text-xs text-muted-foreground">Comando CITA|fecha|nombre|correo|teléfono|motivo</p>
                </div>
                <Switch checked={aceptaAgendamientoChat} onCheckedChange={setAceptaAgendamientoChat} />
              </div>

              <div className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="text-sm font-medium">Integración activa</p>
                  <p className="text-xs text-muted-foreground">Desactiva para pausar mensajes entrantes/salientes</p>
                </div>
                <Switch checked={activo} onCheckedChange={setActivo} />
              </div>
            </div>

            <p className="rounded bg-muted p-2 text-xs break-all">
              Webhook URL para Twilio: <strong>{webhookUrl}</strong>
            </p>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar conexión"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prueba de envío</CardTitle>
          <CardDescription>Envía un mensaje de prueba para validar credenciales y número remitente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="testPhone">Número destino</Label>
            <Input id="testPhone" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="+50488887777" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="testBody">Mensaje</Label>
            <Textarea id="testBody" rows={5} value={testBody} onChange={(e) => setTestBody(e.target.value)} maxLength={1500} />
          </div>

          <Button type="button" variant="outline" onClick={onSendTest} disabled={isSending}>
            {isSending ? "Enviando..." : "Enviar prueba"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
