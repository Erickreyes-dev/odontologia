import { getSession } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";

const modules = [
  "Dashboard operativo y administrativo",
  "Gestión de pacientes y perfil clínico",
  "Agenda de citas y calendario médico",
  "Consultas odontológicas y evolución",
  "Cotizaciones y planes de tratamiento",
  "Pagos, financiamientos y órdenes de cobro",
  "Inventario e insumos",
  "Catálogos clínicos (servicios, seguros, consultorios, profesiones)",
  "RRHH y seguridad (empleados, usuarios, roles y permisos)",
  "Administración multi-clínica (tenants)",
];

export default async function LandingPage() {
  const session = await getSession();

  if (session) {
    redirect("/profile");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="space-y-4 text-center lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">Software odontológico integral</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Gestiona tu clínica dental en una sola plataforma
          </h1>
          <p className="mx-auto max-w-3xl text-sm text-slate-300 sm:text-base lg:mx-0">
            Centraliza operaciones clínicas, administrativas y financieras con una solución pensada para consultorios,
            clínicas con múltiples especialidades y entornos multi-sucursal.
          </p>
          <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row lg:justify-start">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full border-slate-500 bg-transparent text-slate-100 hover:bg-slate-700 sm:w-auto">
              <Link href="#modulos">Ver módulos</Link>
            </Button>
          </div>
        </div>

        <Card id="modulos" className="border-slate-700 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-100">¿Qué incluye el sistema?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => (
                <div key={module} className="rounded-lg border border-slate-700 bg-slate-800/70 p-4 text-sm text-slate-200">
                  {module}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
