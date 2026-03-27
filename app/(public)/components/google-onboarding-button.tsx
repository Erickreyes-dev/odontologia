"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles } from "lucide-react";
import { loginGoogleExistingTenant } from "../google-onboarding/actions";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/^\./, "").replace(/^www\./, "").split(":")[0];
}

function resolveTenantSlugFromBrowserHost(hostname: string): string {
  const labels = normalizeHost(hostname).split(".").filter(Boolean);
  if (labels.length >= 3) return labels[0];
  if (labels.length === 2 && LOCAL_HOSTS.has(labels[1])) return labels[0];
  return "";
}

function getPlatformLoginUrl(tenantSlug: string): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_PLATFORM_URL;
  if (!raw) return null;

  try {
    const url = new URL(raw);
    url.pathname = "/login";
    url.searchParams.set("tenantSlug", tenantSlug);
    return url.toString();
  } catch {
    return null;
  }
}

export default function GoogleOnboardingButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const tenantSlugFromHost = useMemo(() => {
    if (typeof window === "undefined") return "";
    return resolveTenantSlugFromBrowserHost(window.location.hostname);
  }, []);

  useEffect(() => {
    if (tenantSlugFromHost) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [tenantSlugFromHost]);

  const onGoogleClick = () => {
    setError(null);

    if (tenantSlugFromHost) {
      const loginUrl = getPlatformLoginUrl(tenantSlugFromHost);
      if (!loginUrl) {
        setError("Configura NEXT_PUBLIC_APP_URL para usar Google Sign-In desde subdominios.");
        return;
      }

      window.location.assign(loginUrl);
      return;
    }

    if (!window.google || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      setError("No se pudo cargar Google Sign-In. Intenta de nuevo en unos segundos.");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: (response: { credential?: string }) => {
        startTransition(async () => {
          if (!response.credential) {
            setError("Google no devolvió una credencial válida.");
            return;
          }

          const result = await loginGoogleExistingTenant(response.credential);
          if (!result.success) {
            setError(result.error);
            return;
          }

          if (result.exists) {
            if (result.tenantUrl) {
              window.localStorage.setItem("tenant_url", result.tenantUrl);
            }
            router.replace("/dashboard");
            return;
          }

          window.localStorage.setItem("google_onboarding_credential", response.credential);
          router.push("/registro-clinica");
        });
      },
    });

    window.google.accounts.id.prompt();
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={onGoogleClick}
        disabled={isPending}
        className="w-full rounded-xl bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400"
      >
        <Rocket className="mr-2 h-4 w-4" /> {isPending ? "Validando cuenta..." : "Iniciar sesión con Google"}
      </Button>
      <p className="flex items-center justify-center gap-1 text-center text-xs text-slate-400">
        <Sparkles className="h-3.5 w-3.5" />
        {tenantSlugFromHost
          ? "Te redirigimos al dominio principal para autenticar con Google sin depender de wildcard en subdominios."
          : "Continuarás automáticamente con login u onboarding según el estado de tu cuenta."}
      </p>
      {error ? <p className="text-center text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

declare global {
  interface Window {
    google?: any;
  }
}
