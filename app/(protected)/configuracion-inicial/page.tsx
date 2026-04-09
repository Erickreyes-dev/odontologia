import { getSession } from "@/auth";
import HeaderComponent from "@/components/HeaderComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Route } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type SetupStep = {
  key:
    | "puesto"
    | "empleado"
    | "profesion"
    | "medico"
    | "consultorio"
    | "paciente"
    | "servicio"
    | "cita"
    | "consulta"
    | "ordenCobro"
    | "pago";
  title: string;
  description: string;
  href: string;
  completed: boolean;
  locked: boolean;
};

export default async function ConfiguracionInicialPage() {

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.TenantId) {
    return (
      <div className="space-y-4">
        <HeaderComponent
          Icon={Route}
          description="Estamos terminando de preparar tu clínica. Recarga la página en unos segundos."
          screenName="Configuración inicial"
        />
      </div>
    );
  }

  const [
    puestosCount,
    empleadosCount,
    profesionesCount,
    medicosCount,
    consultoriosCount,
    pacientesCount,
    serviciosCount,
    citasCount,
    consultasCount,
    ordenesCobroCount,
    pagosCount,
  ] = await Promise.all([
    prisma.puesto.count({ where: { tenantId: session.TenantId } }),
    prisma.empleados.count({ where: { tenantId: session.TenantId } }),
    prisma.profesion.count({ where: { tenantId: session.TenantId } }),
    prisma.medico.count({ where: { tenantId: session.TenantId } }),
    prisma.consultorio.count({ where: { tenantId: session.TenantId } }),
    prisma.paciente.count({ where: { tenantId: session.TenantId } }),
    prisma.servicio.count({ where: { tenantId: session.TenantId } }),
    prisma.cita.count({ where: { tenantId: session.TenantId } }),
    prisma.consulta.count({ where: { tenantId: session.TenantId } }),
    prisma.ordenDeCobro.count({ where: { tenantId: session.TenantId } }),
    prisma.pago.count({ where: { tenantId: session.TenantId } }),
  ]);

  const flags = {
    puesto: puestosCount > 0,
    empleado: empleadosCount > 0,
    profesion: profesionesCount > 0,
    medico: medicosCount > 0,
    consultorio: consultoriosCount > 0,
    paciente: pacientesCount > 0,
    servicio: serviciosCount > 0,
    cita: citasCount > 0,
    consulta: consultasCount > 0,
    ordenCobro: ordenesCobroCount > 0,
    pago: pagosCount > 0,
  };

  const steps: SetupStep[] = [
    {
      key: "puesto",
      title: "1. Crear puesto",
      description: "Define el primer puesto para poder registrar empleados.",
      href: "/puestos/create?fromSetup=1",
      completed: flags.puesto,
      locked: false,
    },
    {
      key: "empleado",
      title: "2. Crear empleado",
      description: "Registra al primer colaborador de tu clínica.",
      href: "/empleados/create?fromSetup=1",
      completed: flags.empleado,
      locked: !flags.puesto,
    },
    {
      key: "profesion",
      title: "3. Crear profesión",
      description: "Agrega una profesión para asociarla al médico.",
      href: "/profesiones/create?fromSetup=1",
      completed: flags.profesion,
      locked: !flags.empleado,
    },
    {
      key: "medico",
      title: "4. Crear médico",
      description: "Asocia un empleado y su profesión para habilitar citas.",
      href: "/medicos/create?fromSetup=1",
      completed: flags.medico,
      locked: !flags.profesion,
    },
    {
      key: "consultorio",
      title: "5. Crear consultorio",
      description: "Define al menos un consultorio para habilitar el flujo clínico básico.",
      href: "/consultorios/create?fromSetup=1",
      completed: flags.consultorio,
      locked: !flags.medico,
    },
    {
      key: "paciente",
      title: "6. Crear primer cliente (paciente)",
      description: "Registra tu primer cliente para poder agendar una cita.",
      href: "/pacientes/create",
      completed: flags.paciente,
      locked: !flags.consultorio,
    },
    {
      key: "servicio",
      title: "7. Crear primeros servicios",
      description: "Crea al menos un servicio para usarlo en la consulta de prueba.",
      href: "/servicios/create",
      completed: flags.servicio,
      locked: !flags.paciente,
    },
    {
      key: "cita",
      title: "8. Crear primera cita",
      description: "Agenda una cita de prueba para tu primer cliente.",
      href: "/citas/create",
      completed: flags.cita,
      locked: !flags.servicio,
    },
    {
      key: "consulta",
      title: "9. Registrar consulta de prueba",
      description: "Abre la cita creada y completa su consulta de prueba para finalizar el onboarding.",
      href: "/citas",
      completed: flags.consulta,
      locked: !flags.cita,
    },
    {
      key: "ordenCobro",
      title: "10. Crear orden de cobro de ejemplo",
      description: "Desde la consulta registrada, crea una orden de cobro para validar el flujo de facturación.",
      href: "/ordenes-cobro",
      completed: flags.ordenCobro,
      locked: !flags.consulta,
    },
    {
      key: "pago",
      title: "11. Registrar pago de la cita/consulta",
      description: "Registra el pago de la orden para cerrar el ciclo de prueba completo.",
      href: "/ordenes-cobro",
      completed: flags.pago,
      locked: !flags.ordenCobro,
    },
  ];

  const nextStep = steps.find((step) => !step.completed && !step.locked);
  const setupCompleted = steps.every((step) => step.completed);

  return (
    <div className="space-y-4">
      <HeaderComponent
        Icon={Route}
        description="Completa estos pasos iniciales en orden para empezar a registrar pacientes y citas."
        screenName="Configuración inicial"
      />

      <Card>
        <CardHeader>
          <CardTitle>Flujo guiado de inicio</CardTitle>
          <CardDescription>
            Completa los 11 pasos. Cuando termines, podrás usar el sistema con normalidad.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step) => (
            <div key={step.key} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-start gap-3">
                {step.completed ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>

              <Button asChild size="sm" disabled={step.locked}>
                <Link href={step.href} prefetch={false}>{step.completed ? "Editar" : "Ir"}</Link>
              </Button>
            </div>
          ))}

          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            {setupCompleted
              ? "✅ Configuración inicial completada. Ya puedes registrar pacientes y citas."
              : `Siguiente paso recomendado: ${nextStep?.title ?? "Revisa los pasos pendientes"}.`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
