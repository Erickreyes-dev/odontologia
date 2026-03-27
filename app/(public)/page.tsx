import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { TenantAppointmentForm } from "@/components/tenant-appointment-form";
import { CalendarClock, HeartHandshake, Mail, PhoneCall, Sparkles, Stethoscope } from "lucide-react";
import { resolveCurrencyByCountry } from "@/lib/country-currency";

const services = [
  {
    title: "Agenda inteligente de citas",
    description:
      "Confirma, reprograma y visualiza disponibilidad médica en segundos para reducir ausencias y maximizar la productividad.",
  },
  {
    title: "Historia clínica centralizada",
    description:
      "Accede al perfil completo del paciente, evoluciones y antecedentes clínicos desde cualquier módulo autorizado.",
  },
  {
    title: "Planes de tratamiento y cotizaciones",
    description:
      "Crea propuestas profesionales, ordénalas por etapas y conviértelas en tratamientos aprobados sin fricción.",
  },
  {
    title: "Facturación, pagos y financiamiento",
    description:
      "Controla cuentas por cobrar, registra pagos parciales y gestiona convenios de financiamiento con trazabilidad.",
  },
  {
    title: "Inventario clínico",
    description:
      "Monitorea insumos críticos, evita quiebres de stock y lleva control por consultorio o sede.",
  },
  {
    title: "Operación multi-clínica",
    description:
      "Administra sucursales, usuarios, roles y permisos en un entorno seguro y escalable para crecer sin caos.",
  },
];

const advantages = [
  "Aumenta la tasa de asistencia con recordatorios y agenda inteligente.",
  "Eleva el ticket promedio con planes de tratamiento, promociones y financiamiento.",
  "Reduce errores administrativos centralizando pacientes, equipo y operación.",
  "Toma decisiones con métricas clínicas y financieras en tiempo real.",
];

const businessPillars = [
  {
    title: "Gestión de pacientes sin fricción",
    detail:
      "Historial, citas, consultas y seguimiento en un solo flujo para mejorar la experiencia y la retención.",
  },
  {
    title: "Control comercial y financiero",
    detail:
      "Cotizaciones, pagos parciales, órdenes de cobro y financiamiento para no perder oportunidades de ingreso.",
  },
  {
    title: "Productividad de equipo",
    detail:
      "Roles, permisos, puestos y supervisión por módulo para operar con claridad en clínicas de cualquier tamaño.",
  },
  {
    title: "Crecimiento escalable",
    detail:
      "Inventario, reportes y operación multi-sede para crecer sin perder control de calidad y rentabilidad.",
  },
];

const faqs = [
  {
    question: "¿Este sistema sirve para clínicas pequeñas y grandes?",
    answer:
      "Sí. Está diseñado para operar desde consultorios individuales hasta redes con múltiples sedes, manteniendo control por roles y áreas.",
  },
  {
    question: "¿Puedo controlar pagos parciales y financiamientos?",
    answer:
      "Claro. El módulo financiero contempla pagos, cuentas por cobrar y esquemas de financiamiento para tratamientos de mayor valor.",
  },
  {
    question: "¿Qué tan rápido se puede empezar a usar?",
    answer:
      "La interfaz está pensada para adopción rápida. Los equipos suelen dominar los flujos principales en muy poco tiempo.",
  },
  {
    question: "¿La plataforma contempla seguridad de acceso?",
    answer:
      "Sí. Incluye gestión de usuarios, roles y permisos para proteger la información clínica y administrativa.",
  },
];

function normalizeLogo(logoBase64: string | null): string | null {
  if (!logoBase64) return null;
  if (logoBase64.startsWith("data:image/")) return logoBase64;
  return `data:image/png;base64,${logoBase64}`;
}

export default async function LandingPage() {
  const tenantSlug = headers().get("x-tenant-slug");

  let tenantLanding = null;
  if (tenantSlug) {
    try {
      tenantLanding = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: {
          nombre: true,
          slug: true,
          logoBase64: true,
          mision: true,
          vision: true,
          serviciosInfo: true,
          horariosInfo: true,
          redesSociales: true,
          contactoCorreo: true,
          telefono: true,
          activo: true,
          paisCodigo: true,
          monedaCodigo: true,
          servicios: {
            where: { activo: true, mostrarEnLanding: true },
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              precioBase: true,
              duracionMin: true,
            },
            orderBy: { nombre: "asc" },
          },
          promociones: {
            where: { activo: true, mostrarEnLanding: true },
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              precioReferencial: true,
              precioPromocional: true,
            },
            orderBy: { createAt: "desc" },
          },
        },
      });
    } catch {
      tenantLanding = null;
    }
  }

  if (tenantLanding?.activo) {
    const logo = normalizeLogo(tenantLanding.logoBase64);
    const tenantCurrency = resolveCurrencyByCountry(tenantLanding.paisCodigo);
    const moneyFormatter = new Intl.NumberFormat("es-ES", { style: "currency", currency: tenantLanding.monedaCodigo || tenantCurrency.currency, maximumFractionDigits: 2 });

    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-cyan-50/20 dark:to-slate-950">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              {logo ? (
                <Image
                  src={logo}
                  alt={`Logo ${tenantLanding.nombre}`}
                  width={42}
                  height={42}
                  className="h-10 w-10 rounded-lg border border-border object-cover shadow-sm"
                  unoptimized
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-sm font-bold text-cyan-600 dark:text-cyan-300">
                  {tenantLanding.nombre.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{tenantLanding.nombre}</p>
                <p className="truncate text-xs text-muted-foreground">{tenantLanding.slug}.medisoftcore.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
                <Link href="#servicios" className="transition-colors hover:text-cyan-600 dark:hover:text-cyan-300">Servicios</Link>
                <Link href="#nosotros" className="transition-colors hover:text-cyan-600 dark:hover:text-cyan-300">Nosotros</Link>
                <Link href="#promociones" className="transition-colors hover:text-cyan-600 dark:hover:text-cyan-300">Promociones</Link>
                <Link href="#contacto" className="transition-colors hover:text-cyan-600 dark:hover:text-cyan-300">Contacto</Link>
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.18),_transparent_45%)]" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-16">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" /> Atención odontológica moderna
              </div>
              <h1 className="text-3xl font-bold leading-tight sm:text-5xl">Tu sonrisa en manos de {tenantLanding.nombre}</h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                Un consultorio pensado para brindarte confianza, tecnología y cercanía en cada visita.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="transition-transform hover:scale-[1.02] bg-cyan-600 text-white hover:bg-cyan-500">
                  <Link href="#contacto">Agendar valoración</Link>
                </Button>
                <Button asChild variant="outline" className="transition-transform hover:scale-[1.02]">
                  <Link href="#servicios">Ver tratamientos</Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-transform hover:-translate-y-0.5">
                  <Stethoscope className="mb-2 h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  Especialistas certificados
                </div>
                <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-transform hover:-translate-y-0.5">
                  <HeartHandshake className="mb-2 h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  Atención cálida y humana
                </div>
                <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-transform hover:-translate-y-0.5">
                  <CalendarClock className="mb-2 h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  Horarios flexibles
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
                <Image
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1400&q=80"
                  alt="Consultorio odontológico moderno"
                  width={1400}
                  height={900}
                  className="h-64 w-full object-cover transition-transform duration-500 hover:scale-105 sm:h-80"
                  priority
                />
              </div>
              <Card className="border-border bg-card/90 shadow-sm">
                <CardHeader>
                  <CardTitle>Horario y atención</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground whitespace-pre-line">
                  <p><span className="font-medium text-foreground">Horarios:</span> {tenantLanding.horariosInfo || "No definidos aún."}</p>
                  <p><span className="font-medium text-foreground">Correo:</span> {tenantLanding.contactoCorreo || "No especificado"}</p>
                  <p><span className="font-medium text-foreground">Teléfono:</span> {tenantLanding.telefono || "No especificado"}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="servicios" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-300">Nuestros servicios</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Tratamientos diseñados para tu sonrisa</h2>
          </div>

          {tenantLanding.servicios.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {tenantLanding.servicios.map((servicio) => (
                <Card
                  key={servicio.id}
                  className="group relative overflow-hidden border-border/70 bg-card/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500" />
                  <CardHeader className="space-y-3 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                        Servicio
                      </span>
                      <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {servicio.duracionMin} min
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 text-lg leading-tight">{servicio.nombre}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="line-clamp-3 min-h-[60px] text-sm text-muted-foreground">
                      {servicio.descripcion || "Sin descripción disponible."}
                    </p>
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Precio desde</p>
                      <p className="text-base font-bold text-foreground">{moneyFormatter.format(Number(servicio.precioBase))}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="pt-6 text-sm text-muted-foreground whitespace-pre-line">
                {tenantLanding.serviciosInfo || "Estamos preparando el detalle de servicios para ti."}
              </CardContent>
            </Card>
          )}
        </section>

        <section id="promociones" className="border-y border-border/60 bg-muted/30">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
            <div className="mb-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-300">Promociones</p>
              <h2 className="text-2xl font-bold sm:text-3xl">Ofertas vigentes para tu tratamiento</h2>
            </div>
            {tenantLanding.promociones.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {tenantLanding.promociones.map((promo) => {
                  const ahorro = Number(promo.precioReferencial) - Number(promo.precioPromocional);

                  return (
                    <Card
                      key={promo.id}
                      className="group relative overflow-hidden border-cyan-500/25 bg-gradient-to-br from-cyan-500/5 via-background to-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl"
                    >
                      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-400/20 blur-2xl" />
                      <CardHeader className="space-y-3 pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                            Promoción
                          </span>
                          {ahorro > 0 ? (
                            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                              Ahorra {moneyFormatter.format(ahorro)}
                            </span>
                          ) : null}
                        </div>
                        <CardTitle className="line-clamp-2 text-lg leading-tight">{promo.nombre}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="line-clamp-3 min-h-[60px] text-sm text-muted-foreground">
                          {promo.descripcion || "Promoción especial por tiempo limitado."}
                        </p>
                        <div className="rounded-xl border border-border/70 bg-card/80 p-3">
                          <p className="text-xs text-muted-foreground">Precio promocional</p>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-xl font-extrabold text-cyan-700 dark:text-cyan-300">
                              {moneyFormatter.format(Number(promo.precioPromocional))}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              {moneyFormatter.format(Number(promo.precioReferencial))}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  No hay promociones públicas disponibles en este momento.
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section id="nosotros" className="border-y border-border/60 bg-muted/30">
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-16">
            <Card className="border-border bg-card shadow-sm transition-transform hover:-translate-y-0.5">
              <CardHeader>
                <CardTitle>Misión</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
                {tenantLanding.mision || "No definida aún."}
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-sm transition-transform hover:-translate-y-0.5">
              <CardHeader>
                <CardTitle>Visión</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
                {tenantLanding.vision || "No definida aún."}
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="contacto" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Redes y contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground whitespace-pre-line">
                <p>{tenantLanding.redesSociales || "Sin redes sociales configuradas."}</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {tenantLanding.contactoCorreo || "No especificado"}</p>
                    <p className="flex items-center gap-2"><PhoneCall className="h-4 w-4" /> {tenantLanding.telefono || "No especificado"}</p>
                  </div>
                  <Button asChild className="bg-cyan-600 text-white hover:bg-cyan-500 transition-transform hover:scale-[1.02]">
                    <Link href="/login">Portal de pacientes / staff</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Agenda tu cita</CardTitle>
              </CardHeader>
              <CardContent>
                <TenantAppointmentForm />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_45%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 lg:py-20">
          <div className="space-y-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Plataforma odontológica todo en uno</p>
            <h1 className="mx-auto max-w-4xl text-3xl font-bold leading-tight sm:text-5xl">
              Convierte tu clínica en una operación moderna, rentable y centrada en el paciente
            </h1>
            <p className="mx-auto max-w-3xl text-base text-slate-300 sm:text-lg">
              Desde la primera cita hasta el cierre de pagos: organiza equipos, mejora la atención y toma el control total
              de tu crecimiento con una experiencia profesional de alto nivel.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 sm:w-auto">
                <Link href="/login">Agendar demo estratégica</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 sm:w-auto"
              >
                <Link href="#servicios">Ver servicios</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-cyan-500 bg-transparent text-cyan-300 hover:bg-slate-800 sm:w-auto"
              >
                <Link href="#impacto">Ver impacto en tu clínica</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 text-center sm:grid-cols-3">
            <Card className="border-slate-700 bg-slate-900/70">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-cyan-300">+30%</p>
                <p className="text-sm text-slate-300">Más orden operativo en clínicas con alta demanda</p>
              </CardContent>
            </Card>
            <Card className="border-slate-700 bg-slate-900/70">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-cyan-300">360°</p>
                <p className="text-sm text-slate-300">Visión completa de pacientes, finanzas y equipo</p>
              </CardContent>
            </Card>
            <Card className="border-slate-700 bg-slate-900/70">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-cyan-300">24/7</p>
                <p className="text-sm text-slate-300">Información disponible para decisiones estratégicas</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="servicios" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Servicios clave</p>
          <h2 className="text-2xl font-bold sm:text-3xl">Todo lo que tu clínica necesita para escalar</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.title} className="border-slate-700 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-lg text-slate-100">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="impacto" className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-16">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Ventajas competitivas</p>
            <h3 className="text-2xl font-bold">¿Por qué elegir esta solución?</h3>
            <p className="text-sm text-slate-300">
              Diseñada con enfoque UX/UI para que tu equipo trabaje mejor desde el día uno y tu negocio tenga una base
              tecnológica sólida para crecer.
            </p>
          </div>
          <div className="grid gap-3">
            {advantages.map((advantage) => (
              <div key={advantage} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200">
                ✓ {advantage}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Resultados de negocio</p>
          <h3 className="text-2xl font-bold sm:text-3xl">Un sistema clínico que también impulsa ventas</h3>
          <p className="mx-auto max-w-3xl text-sm text-slate-300">
            No es solo software administrativo: es una plataforma para vender mejor, atender mejor y retener más pacientes.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {businessPillars.map((pillar) => (
            <Card key={pillar.title} className="border-slate-700 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-lg text-slate-100">{pillar.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">{pillar.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">FAQ</p>
          <h3 className="text-2xl font-bold sm:text-3xl">Preguntas frecuentes</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.question} className="border-slate-700 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-base text-slate-100">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 text-center sm:px-6 lg:py-16">
          <div className="mb-8 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Siguiente paso</p>
            <h3 className="text-2xl font-bold sm:text-3xl">Conoce cómo escalar tu clínica con un plan claro</h3>
            <p className="mx-auto max-w-2xl text-sm text-slate-300">
              Te mostramos cómo implementar la plataforma por fases para aumentar productividad, cierres y satisfacción del paciente.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 sm:w-auto">
              <Link href="/login">Entrar al sistema</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 sm:w-auto"
            >
              <Link href="#servicios">Explorar módulos</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-12 text-center sm:px-6">
          <h3 className="text-2xl font-bold">Tu clínica puede vender más, atender mejor y operar con menos estrés</h3>
          <p className="max-w-2xl text-sm text-slate-300">
            Da el siguiente paso con una plataforma creada para líderes del sector odontológico que quieren resultados
            medibles y una experiencia premium para sus pacientes.
          </p>
          <Button asChild size="lg" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
            <Link href="/login">Quiero impulsar mi clínica ahora</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
