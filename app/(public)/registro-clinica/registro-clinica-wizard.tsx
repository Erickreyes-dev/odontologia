"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerTenantWithGoogle } from "../google-onboarding/actions";
import { BadgeCheck, Building2, Check, CircleDollarSign, Crown, Globe, Rocket, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const countries = [
  { code: "HN", label: "Honduras" },
  { code: "US", label: "Estados Unidos" },
  { code: "MX", label: "México" },
  { code: "CO", label: "Colombia" },
  { code: "AR", label: "Argentina" },
  { code: "ES", label: "España" },
];

type PackageCode = "start" | "growth" | "pro" | "enterprise";
type Period = "mensual" | "trimestral" | "anual";

const packageCards: Array<{ code: PackageCode; title: string; subtitle: string; users: string; icon: any; prices: Record<Period, number>; features: string[]; popular?: boolean }> = [
  {
    code: "start",
    title: "Start Clinic",
    subtitle: "Ideal para 1-2 odontólogos",
    users: "Hasta 8 usuarios",
    icon: Stethoscope,
    prices: { mensual: 99, trimestral: 273, anual: 950 },
    features: ["Pacientes y citas", "Cotizaciones básicas", "Recibos y PDFs"],
  },
  {
    code: "growth",
    title: "Growth Clinic",
    subtitle: "Más vendido para clínicas en crecimiento",
    users: "Hasta 20 usuarios",
    icon: Rocket,
    prices: { mensual: 189, trimestral: 522, anual: 1815 },
    features: ["Promociones", "Pagos y órdenes de cobro", "Dashboard + inventario"],
    popular: true,
  },
  {
    code: "pro",
    title: "Pro Revenue",
    subtitle: "Para maximizar cobranza y margen",
    users: "Hasta 40 usuarios",
    icon: CircleDollarSign,
    prices: { mensual: 329, trimestral: 908, anual: 3158 },
    features: ["Financiamiento y cuotas", "Analítica avanzada", "Permisos robustos"],
  },
  {
    code: "enterprise",
    title: "Multi-Clinic / Enterprise",
    subtitle: "Grupos odontológicos y franquicias",
    users: "Sedes y usuarios escalables",
    icon: Crown,
    prices: { mensual: 599, trimestral: 1653, anual: 5750 },
    features: ["Administración central", "SLA preferencial", "Integraciones a medida"],
  },
];

const periodLabels: Record<Period, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral (ahorra ~8%)",
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

export function RegistroClinicaWizard({ activePackages }: { activePackages: Array<{ id: string; nombre: string; maxUsuarios: number }> }) {
  const [credential, setCredential] = useState("");
  const [consultorioNombre, setConsultorioNombre] = useState("");
  const [teamSize, setTeamSize] = useState<"1" | "2" | "3-5" | ">5">("1");
  const [paisCodigo, setPaisCodigo] = useState("US");
  const [packageCode, setPackageCode] = useState<PackageCode>("growth");
  const [periodoPlan, setPeriodoPlan] = useState<Period>("anual");
  const [error, setError] = useState<string | null>(null);
  const [tenantUrl, setTenantUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selectedCard = useMemo(() => packageCards.find((pkg) => pkg.code === packageCode) ?? packageCards[1], [packageCode]);
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

  const onGoogleClick = () => {
    setError(null);
    if (!window.google || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      setError("No se pudo cargar Google Sign-In. Verifica la configuración del cliente.");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => setCredential(response.credential),
    });

    window.google.accounts.id.prompt();
  };

  const onSubmit = () => {
    startTransition(async () => {
      const response = await registerTenantWithGoogle({
        credential,
        consultorioNombre,
        teamSize,
        paisCodigo,
        packageCode,
        periodoPlan,
      });

      if (!response.success) {
        setError(response.error);
        return;
      }

      setTenantUrl(response.tenantUrl);
      window.localStorage.setItem("tenant_url", response.tenantUrl);
      setTimeout(() => router.replace("/profile"), 1800);
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
                  {countries.map((country) => (
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
            <p className="flex items-center gap-2 text-sm font-semibold text-cyan-300"><BadgeCheck className="h-4 w-4" /> 2) Elige tu paquete</p>
            <div className="grid gap-3">
              {packageCards.map((pkg) => {
                const Icon = pkg.icon;
                const isSelected = packageCode === pkg.code;
                return (
                  <button key={pkg.code} type="button" onClick={() => setPackageCode(pkg.code)} className={`rounded-xl border p-4 text-left transition ${isSelected ? "border-cyan-400 bg-cyan-500/10" : "border-slate-700 hover:border-slate-500"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 font-semibold text-white"><Icon className="h-4 w-4 text-cyan-300" /> {pkg.title} {pkg.popular ? <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-200">Más vendido</span> : null}</p>
                        <p className="text-xs text-slate-400">{pkg.subtitle} · {pkg.users}</p>
                      </div>
                      {isSelected ? <Check className="h-5 w-5 text-cyan-300" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Frecuencia de pago</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(periodLabels) as Period[]).map((period) => (
                  <button key={period} type="button" onClick={() => setPeriodoPlan(period)} className={`rounded-lg border px-3 py-2 text-sm ${periodoPlan === period ? "border-cyan-400 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-300"}`}>
                    {periodLabels[period]}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-cyan-300"><ShieldCheck className="h-4 w-4" /> 3) Confirma y crea tu cuenta</p>
            <Button type="button" variant="outline" onClick={onGoogleClick} className="w-full border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800">
              Continuar con Google
            </Button>
            <Button type="button" onClick={onSubmit} disabled={isPending || !credential || consultorioNombre.trim().length < 3} className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400">
              {isPending ? "Creando clínica..." : "Crear clínica y contratar paquete"}
            </Button>
            {!credential ? <p className="text-xs text-slate-400">Primero conecta tu cuenta Google para finalizar.</p> : <p className="text-xs text-emerald-300">Google conectado correctamente.</p>}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            {tenantUrl ? (
              <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-2 text-sm text-emerald-200">
                ¡Listo! Guardamos tu URL: <strong>{tenantUrl}</strong>
              </p>
            ) : null}
          </section>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="text-xl text-white">Resumen comercial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-300">
          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
            <p className="text-base font-semibold text-white">{selectedCard.title}</p>
            <p className="mt-1 text-slate-400">{selectedCard.subtitle}</p>
            <p className="mt-3 text-2xl font-bold text-cyan-300">USD {selectedCard.prices[periodoPlan].toLocaleString("en-US")}</p>
            <p className="text-xs text-slate-400">{periodLabels[periodoPlan]}</p>
            <ul className="mt-3 space-y-1">
              {selectedCard.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-cyan-300" /> {feature}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
            <p className="mb-2 flex items-center gap-2 text-white"><Globe className="h-4 w-4 text-cyan-300" /> URL de clínica y contratación</p>
            <p className="text-xs text-slate-400">Al finalizar, te mostramos y guardamos la URL de acceso para tu equipo y pacientes.</p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4 text-xs text-slate-400">
            Paquetes activos detectados en el sistema: <strong className="text-slate-200">{activePackages.map((pkg) => pkg.nombre).join(", ") || "Sin paquetes"}</strong>
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
