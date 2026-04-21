"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  sendWhatsappTestMessage,
  sendWhatsappVerificationCode,
  type TenantWhatsappConfigView,
  upsertTenantWhatsappConfig,
  verifyWhatsappNumber,
} from "../actions";

interface Props {
  config: TenantWhatsappConfigView;
}

export function WhatsappConfigForm({ config }: Props) {
  const [twilioWhatsappNumber, setTwilioWhatsappNumber] = useState(config.twilioWhatsappNumber);
  const [mensajeAutoRespuesta, setMensajeAutoRespuesta] = useState(config.mensajeAutoRespuesta);
  const [aceptaAgendamientoChat, setAceptaAgendamientoChat] = useState(config.aceptaAgendamientoChat);
  const [activo, setActivo] = useState(config.activo);
  const [verificationCode, setVerificationCode] = useState("");

  const [testPhone, setTestPhone] = useState("");
  const [testBody, setTestBody] = useState("Hola 👋 este es un mensaje de prueba desde tu SaaS.");

  const [isSaving, startSaving] = useTransition();
  const [isSending, startSending] = useTransition();
  const [isRequestingCode, startRequestingCode] = useTransition();
  const [isVerifying, startVerifying] = useTransition();

  const webhookUrl = useMemo(() => {
    if (typeof window === "undefined") return "/api/whatsapp/twilio/webhook";
    return `${window.location.origin}/api/whatsapp/twilio/webhook`;
  }, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startSaving(async () => {
      const result = await upsertTenantWhatsappConfig({
        twilioWhatsappNumber,
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

  const onRequestCode = () => {
    startRequestingCode(async () => {
      const result = await sendWhatsappVerificationCode();
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Código enviado al número de la clínica por WhatsApp");
    });
  };

  const onVerifyCode = () => {
    startVerifying(async () => {
      const result = await verifyWhatsappNumber({ code: verificationCode });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Número verificado y conexión activa");
      setActivo(true);
      setVerificationCode("");
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
            Tu plataforma usa credenciales globales en variables de entorno. La clínica solo registra y verifica su número.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label htmlFor="number">Número WhatsApp (E.164)</Label>
              <Input id="number" value={twilioWhatsappNumber} onChange={(e) => setTwilioWhatsappNumber(e.target.value)} placeholder="+50499990000" />
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

            <Button type="submit" disabled={isSaving || isRequestingCode || isVerifying}>
              {isSaving ? "Guardando..." : "Guardar conexión"}
            </Button>
          </form>

          <div className="mt-4 space-y-2 rounded border p-3">
            <p className="text-sm font-medium">Verificación del número de la clínica</p>
            <p className="text-xs text-muted-foreground">
              1) Guarda el número. 2) Envía código. 3) Ingresa el código recibido en ese WhatsApp.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={onRequestCode} disabled={isRequestingCode}>
                {isRequestingCode ? "Enviando código..." : "Enviar código"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                placeholder="Código de 6 dígitos"
              />
              <Button type="button" onClick={onVerifyCode} disabled={isVerifying}>
                {isVerifying ? "Verificando..." : "Verificar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Estado: <strong>{config.estado}</strong>{config.verifiedAt ? " · número verificado" : ""}
            </p>
          </div>
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
