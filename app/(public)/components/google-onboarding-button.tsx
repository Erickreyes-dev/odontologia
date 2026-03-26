"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles } from "lucide-react";
import { loginGoogleExistingTenant } from "../google-onboarding/actions";

export default function GoogleOnboardingButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const onGoogleClick = () => {
    setError(null);

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
        <Sparkles className="h-3.5 w-3.5" /> Si tu cuenta existe vas al dashboard; si no, continuas onboarding sin volver a elegir Google
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
