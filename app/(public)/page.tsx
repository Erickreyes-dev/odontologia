import { getSession } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RequestAccessForm } from "@/components/request-access-form";

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
  "Aumenta la tasa de asistencia con una gestión de citas ordenada.",
  "Mejora la experiencia del paciente con procesos más rápidos y claros.",
  "Reduce errores administrativos centralizando la información.",
  "Toma decisiones con datos clínicos y financieros en tiempo real.",
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

export default async function LandingPage() {
  const session = await getSession();

  if (session) {
    redirect("/profile");
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
                <Link href="/login">Solicitar demostración / Ingresar</Link>
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
                <Link href="#pedir-acceso">Pedir acceso</Link>
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

      <section className="border-y border-slate-800 bg-slate-900/40">
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

      <section id="pedir-acceso" className="border-t border-slate-800 bg-slate-900/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 text-center sm:px-6 lg:py-16">
          <div className="mb-8 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Acceso anticipado</p>
            <h3 className="text-2xl font-bold sm:text-3xl">Solicita acceso y te contactamos</h3>
            <p className="mx-auto max-w-2xl text-sm text-slate-300">
              Déjanos tus datos y enviaremos tu solicitud directamente a nuestro equipo comercial.
            </p>
          </div>
          <RequestAccessForm />
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
