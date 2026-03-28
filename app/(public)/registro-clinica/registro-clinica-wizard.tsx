"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { finalizeGoogleOnboardingPayment, loginGoogleExistingTenant, registerTenantWithGoogle } from "../google-onboarding/actions";
import { BadgeCheck, Building2, Check, Globe, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPPORTED_COUNTRIES } from "@/lib/country-currency";

type Period = "mensual" | "trimestral" | "semestral" | "anual";

type PackageOption = {
  id: string;
  nombre: string;
  descripcion: string | null;
  maxUsuarios: number;
  trialActivo: boolean;
  trialDias: number;
  precio: any;
  precioTrimestral: any;
  precioSemestral: any;
  precioAnual: any;
};

const periodLabels: Record<Period, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral (ahorra ~8%)",
  semestral: "Semestral (ahorra ~13%)",
  anual: "Anual (ahorra ~20%)",
};

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

function getPrice(pkg: PackageOption, period: Period) {
  const monthly = Number(pkg.precio ?? 0);
  if (period === "trimestral") return Number(pkg.precioTrimestral ?? monthly * 3);
  if (period === "semestral") return Number(pkg.precioSemestral ?? monthly * 6);
  if (period === "anual") return Number(pkg.precioAnual ?? monthly * 12);
  return monthly;
}

export function RegistroClinicaWizard({ activePackages }: { activePackages: PackageOption[] }) {
  const [credential, setCredential] = useState("");
  const [consultorioNombre, setConsultorioNombre] = useState("");
  const [teamSize, setTeamSize] = useState<"1" | "2" | "3-5" | ">5">("1");
  const [paisCodigo, setPaisCodigo] = useState("US");
  const [packageId, setPackageId] = useState(activePackages[0]?.id ?? "");
  const [periodoPlan, setPeriodoPlan] = useState<Period>("anual");
  const [error, setError] = useState<string | null>(null);
  const [tenantUrl, setTenantUrl] = useState("");
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedPackage = useMemo(
    () => activePackages.find((pkg) => pkg.id === packageId) ?? activePackages[0],
    [activePackages, packageId],
  );
  const canProvisionWithoutPayment = Boolean(selectedPackage?.trialActivo) && Number(selectedPackage?.trialDias ?? 0) > 0;

  const slugPreview = normalizeSlug(consultorioNombre || "tu-clinica");

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

  useEffect(() => {
    const storedCredential = window.localStorage.getItem("google_onboarding_credential");
    if (storedCredential) {
      setCredential(storedCredential);
    }
  }, []);

  useEffect(() => {
    const paypalStatus = searchParams.get("paypal");
    const orderId = searchParams.get("token");
    if (paypalStatus !== "success" || !orderId || !credential) return;

    let isCancelled = false;
    startTransition(async () => {
      const result = await finalizeGoogleOnboardingPayment(orderId, credential);
      if (!result.success) {
        if (!isCancelled) setError(result.error);
        return;
      }
      if (isCancelled) return;
      setTenantUrl(result.tenantUrl);
      window.localStorage.setItem("tenant_url", result.tenantUrl);
      window.localStorage.removeItem("google_onboarding_credential");
      setTimeout(() => router.replace("/dashboard"), 1200);
    });

    return () => {
      isCancelled = true;
    };
  }, [credential, router, searchParams, startTransition]);

  const onGoogleClick = () => {
    setError(null);
    if (!window.google || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      setError("No se pudo cargar Google Sign-In. Verifica la configuración del cliente.");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: async (response: { credential: string }) => {
        setCredential(response.credential);
        window.localStorage.setItem("google_onboarding_credential", response.credential);
        const existing = await loginGoogleExistingTenant(response.credential);
        if (!existing.success) {
          setError(existing.error);
          return;
        }
        if (existing.exists && existing.tenantUrl) {
          setAlreadyExists(true);
          setTenantUrl(existing.tenantUrl);
          window.localStorage.setItem("tenant_url", existing.tenantUrl);
          setTimeout(() => router.replace("/dashboard"), 900);
        }
      },
    });

    window.google.accounts.id.prompt();
  };

  const onSubmit = () => {
    if (!selectedPackage) {
      setError("No hay paquetes configurados por el administrador raíz.");
      return;
    }

    startTransition(async () => {
      const response = await registerTenantWithGoogle({
        credential,
        consultorioNombre,
        teamSize,
        paisCodigo,
        packageId: selectedPackage.id,
        periodoPlan,
      });

      if (!response.success) {
        setError(response.error);
        return;
      }

      if (response.requiresPayment) {
        if (response.reusedPending) {
          setError("Ya tienes un proceso de creación pendiente de pago. Te redirigiremos para completarlo.");
        }
        window.location.href = response.approveLink;
        return;
      }

      setAlreadyExists(Boolean(response.alreadyExists));
      setTenantUrl(response.tenantUrl);
      window.localStorage.setItem("tenant_url", response.tenantUrl);
      window.localStorage.removeItem("google_onboarding_credential");
      setTimeout(() => router.replace("/dashboard"), 1200);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <Card className="border-slate-700 bg-slate-900/80 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-white"><Sparkles className="h-5 w-5 text-cyan-300" /> Registro de clínica en 3 pasos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-cyan-300"><Building2 className="h-4 w-4" /> 1) Datos de tu clínica</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-slate-200">Nombre comercial</Label>
                <Input value={consultorioNombre} onChange={(e) => setConsultorioNombre(e.target.value)} placeholder="Clínica Dental Sonrisa" className="border-slate-700 bg-slate-900" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Tamaño del equipo</Label>
                <select className="h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm" value={teamSize} onChange={(e) => setTeamSize(e.target.value as any)}>
                  <option value="1">1 odontólogo</option>
                  <option value="2">2 odontólogos</option>
                  <option value="3-5">3 a 5 odontólogos</option>
                  <option value=">5">Más de 5</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">País</Label>
                <select className="h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm" value={paisCodigo} onChange={(e) => setPaisCodigo(e.target.value)}>
                  {SUPPORTED_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>{country.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-3 text-sm text-cyan-100">
              URL estimada de tu clínica: <strong>https://{slugPreview}.medisoftcore.com</strong>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-cyan-300"><BadgeCheck className="h-4 w-4" /> 2) Selecciona paquete (definido por root)</p>
            <div className="grid gap-3">
              {activePackages.map((pkg) => {
                const isSelected = packageId === pkg.id;
                return (
                  <button key={pkg.id} type="button" onClick={() => setPackageId(pkg.id)} className={`rounded-xl border p-4 text-left transition ${isSelected ? "border-cyan-400 bg-cyan-500/10" : "border-slate-700 hover:border-slate-500"}`}>
                    <p className="font-semibold text-white">{pkg.nombre}</p>
                    <p className="text-xs text-slate-400">{pkg.descripcion || "Paquete configurable desde root"}</p>
                    <p className="mt-1 text-xs text-slate-400">Hasta {pkg.maxUsuarios} usuarios</p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Frecuencia de pago</Label>
              <div className="grid gap-2 sm:grid-cols-4">
                {(Object.keys(periodLabels) as Period[]).map((period) => (
                  <button key={period} type="button" onClick={() => setPeriodoPlan(period)} className={`rounded-lg border px-3 py-2 text-sm ${periodoPlan === period ? "border-cyan-400 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300"}`}>
                    {periodLabels[period]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 p-3 text-xs text-slate-300">
              Prueba gratis: {selectedPackage?.trialActivo ? `${selectedPackage.trialDias} días (configurado desde root)` : "No incluida en este paquete"}
            </div>
            {!canProvisionWithoutPayment ? (
              <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-100">
                Este paquete requiere pago previo. Te enviaremos a PayPal y la clínica se activará automáticamente al confirmar el pago.
              </div>
            ) : null}
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-cyan-300"><ShieldCheck className="h-4 w-4" /> 3) Confirma con Google</p>
            {!credential ? (
              <Button type="button" variant="outline" onClick={onGoogleClick} className="w-full border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800">
                Iniciar sesión con Google
              </Button>
            ) : null}
            <Button type="button" onClick={onSubmit} disabled={isPending || !credential} className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400">
              {isPending ? "Procesando..." : canProvisionWithoutPayment ? "Crear clínica / iniciar sesión" : "Continuar a pago seguro"}
            </Button>
            {!credential ? <p className="text-xs text-slate-400">Primero conecta tu cuenta Google para finalizar.</p> : <p className="text-xs text-emerald-300">Cuenta Google ya seleccionada.</p>}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            {tenantUrl ? (
              <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-2 text-sm text-emerald-200">
                {alreadyExists ? "Cuenta existente detectada. Iniciamos sesión." : "¡Listo!"} URL: <strong>{tenantUrl}</strong>
              </p>
            ) : null}
          </section>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="text-xl text-white">Resumen de contratación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-300">
          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
            <p className="flex items-center gap-2 text-base font-semibold text-white"><Stethoscope className="h-4 w-4 text-cyan-300" /> {selectedPackage?.nombre ?? "Sin paquete"}</p>
            <p className="mt-1 text-slate-400">{selectedPackage?.descripcion || "Configurado desde root del sistema"}</p>
            <p className="mt-3 text-2xl font-bold text-cyan-300">USD {selectedPackage ? getPrice(selectedPackage, periodoPlan).toLocaleString("en-US") : "0"}</p>
            <p className="text-xs text-slate-400">{periodLabels[periodoPlan]}</p>
            <p className="mt-2 text-xs text-slate-400">Usuarios incluidos: {selectedPackage?.maxUsuarios ?? 0}</p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
            <p className="mb-2 flex items-center gap-2 text-white"><Globe className="h-4 w-4 text-cyan-300" /> URL de clínica</p>
            <p className="text-xs text-slate-400">Guardamos la URL para mostrarla luego en login y facilitar acceso de tu equipo.</p>
          </div>

          <p className="text-xs text-slate-500">¿Ya tienes cuenta? <Link href="/login" className="text-cyan-300 hover:underline">Inicia sesión aquí</Link>.</p>
        </CardContent>
      </Card>
    </div>
  );
}

declare global {
  interface Window {
    google?: any;
  }
}
