"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Loader2, MessageCircle, PlugZap, Unplug, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { completeWhatsappEmbeddedSignup, disconnectWhatsappConnection } from "../actions";

type FacebookLoginResponse = {
  authResponse?: { code?: string };
  status?: string;
};

type FacebookSdk = {
  init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: { config_id: string; response_type: string; override_default_response_type: boolean; extras: Record<string, unknown> }
  ) => void;
};

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: FacebookSdk;
  }
}

type WhatsappConnectionView = {
  businessAccountId: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhone: string | null;
  verifiedName: string | null;
  qualityRating: string | null;
  messagingLimit: string | null;
  status: string;
  connectedAt: string;
};

type Props = {
  appId: string;
  configId: string;
  graphVersion: string;
  connection: WhatsappConnectionView | null;
};

export function WhatsappSettingsClient({ appId, configId, graphVersion, connection }: Props) {
  const [isPending, startTransition] = useTransition();
  const [sdkReady, setSdkReady] = useState(false);
  const [signupPayload, setSignupPayload] = useState<Record<string, unknown> | null>(null);

  const isConfigured = useMemo(() => Boolean(appId && configId), [appId, configId]);

  useEffect(() => {
    if (!isConfigured || window.FB) {
      setSdkReady(Boolean(window.FB));
      return;
    }

    window.fbAsyncInit = () => {
      window.FB?.init({ appId, cookie: true, xfbml: true, version: graphVersion });
      setSdkReady(true);
    };

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/es_LA/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [appId, graphVersion, isConfigured]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) return;
      if (typeof event.data !== "string") return;

      try {
        const payload = JSON.parse(event.data) as { type?: string; event?: string; data?: Record<string, unknown> };
        if (payload.type === "WA_EMBEDDED_SIGNUP") {
          setSignupPayload(payload.data ?? payload);
        }
      } catch {
        return;
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const connect = () => {
    if (!window.FB) {
      toast.error("El SDK de Meta aún no está listo.");
      return;
    }

    window.FB.login(
      (response) => {
        const payload = { ...(signupPayload ?? {}), code: response.authResponse?.code };
        startTransition(async () => {
          const result = await completeWhatsappEmbeddedSignup(payload);
          if (result.ok) toast.success("WhatsApp conectado correctamente.");
        });
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { sessionInfoVersion: 3, setup: {} },
      }
    );
  };

  const disconnect = () => {
    startTransition(async () => {
      const result = await disconnectWhatsappConnection();
      if (result.ok) toast.success("Conexión de WhatsApp desactivada.");
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-emerald-600" /> Conectar WhatsApp Business</CardTitle>
          <CardDescription>El administrador de la clínica autoriza tu app de Meta y el sistema guarda el WABA ID y Phone Number ID automáticamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConfigured ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Faltan variables públicas de Meta</AlertTitle>
              <AlertDescription>Configura NEXT_PUBLIC_META_APP_ID y NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID para habilitar el botón.</AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-4">
              <li>La clínica hace clic en <strong>Conectar WhatsApp</strong>.</li>
              <li>Meta abre Embedded Signup para iniciar sesión, escoger empresa y seleccionar número.</li>
              <li>El backend valida la respuesta, consulta Graph API y persiste la conexión por tenant.</li>
            </ol>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={connect} disabled={!isConfigured || !sdkReady || isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}
              Conectar WhatsApp
            </Button>
            {connection?.status === "connected" ? (
              <Button variant="outline" onClick={disconnect} disabled={isPending}>
                <Unplug className="mr-2 h-4 w-4" /> Desconectar
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado de conexión</CardTitle>
          <CardDescription>Datos guardados para enviar mensajes con WhatsApp Cloud API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {connection ? (
            <>
              <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" /> {connection.status}</Badge>
              <Info label="Nombre verificado" value={connection.verifiedName} />
              <Info label="Teléfono" value={connection.displayPhone} />
              <Info label="Phone Number ID" value={connection.phoneNumberId} />
              <Info label="WABA ID" value={connection.wabaId} />
              <Info label="Business ID" value={connection.businessAccountId} />
              <Info label="Calidad" value={connection.qualityRating} />
              <Info label="Límite" value={connection.messagingLimit} />
            </>
          ) : (
            <p className="text-muted-foreground">Aún no hay una cuenta de WhatsApp conectada para esta clínica.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-medium break-all">{value || "—"}</p>
    </div>
  );
}
