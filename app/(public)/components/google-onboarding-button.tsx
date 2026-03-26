"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { registerTenantWithGoogle } from "../google-onboarding/actions";

const countries = [
  { code: "HN", label: "Honduras" },
  { code: "US", label: "Estados Unidos" },
  { code: "MX", label: "México" },
  { code: "CO", label: "Colombia" },
  { code: "AR", label: "Argentina" },
  { code: "ES", label: "España" },
];

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleOnboardingButton() {
  const [open, setOpen] = useState(false);
  const [credential, setCredential] = useState("");
  const [consultorioNombre, setConsultorioNombre] = useState("");
  const [teamSize, setTeamSize] = useState<"1" | "2" | "3-5" | ">5">("1");
  const [paisCodigo, setPaisCodigo] = useState("HN");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (!window.google || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return;

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          setCredential(response.credential);
          setOpen(true);
        },
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const onGoogleClick = () => {
    setError(null);
    if (!window.google) {
      setError("No se pudo cargar Google Sign-In");
      return;
    }
    window.google.accounts.id.prompt();
  };

  const onSubmit = () => {
    startTransition(async () => {
      const response = await registerTenantWithGoogle({
        credential,
        consultorioNombre,
        teamSize,
        paisCodigo,
      });

      if (!response.success) {
        setError(response.error);
        return;
      }

      setOpen(false);
      router.replace("/profile");
    });
  };

  return (
    <>
      <Button type="button" variant="outline" className="w-full" onClick={onGoogleClick}>
        Continuar con Google
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configura tu consultorio</DialogTitle>
            <DialogDescription>Completa estos datos para activar tu prueba gratis de 7 días.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Nombre del consultorio</Label>
              <Input value={consultorioNombre} onChange={(e) => setConsultorioNombre(e.target.value)} placeholder="Clínica Sonrisa" />
            </div>
            <div className="space-y-2">
              <Label>¿Cuántos doctores tiene tu equipo?</Label>
              <select className="w-full rounded-md border bg-background px-3 py-2" value={teamSize} onChange={(e) => setTeamSize(e.target.value as any)}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3-5">De 3 a 5</option>
                <option value=">5">Más de 5</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <select className="w-full rounded-md border bg-background px-3 py-2" value={paisCodigo} onChange={(e) => setPaisCodigo(e.target.value)}>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>{country.label}</option>
                ))}
              </select>
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button disabled={isPending || !credential} onClick={onSubmit} className="w-full">
              {isPending ? "Creando cuenta..." : "Crear consultorio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
