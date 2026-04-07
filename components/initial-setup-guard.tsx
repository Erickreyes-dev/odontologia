"use client";

import { useRouter, usePathname } from "next/navigation";
import { Route } from "lucide-react";
import { Button } from "@/components/ui/button";

type InitialSetupGuardProps = {
  isSetupCompleted: boolean;
  children: React.ReactNode;
};

const SETUP_ALLOWED_PREFIXES = [
  "/configuracion-inicial",
  "/puestos",
  "/empleados",
  "/profesiones",
  "/medicos",
  "/consultorios",
  "/pacientes",
  "/servicios",
  "/citas",
  "/profile",
  "/billing",
  "/suscripcion",
  "/dashboard-admin",
  "/tenants",
  "/paquetes",
];

export function InitialSetupGuard({ isSetupCompleted, children }: InitialSetupGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isSetupAllowedPath = SETUP_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isSetupCompleted || isSetupAllowedPath) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto mt-12 max-w-2xl rounded-2xl border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
        <Route className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Configuración inicial pendiente</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Para continuar, completa primero la configuración inicial de tu clínica.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Módulo actual: <span className="font-medium text-foreground">{pathname}</span>
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={() => {
            router.push("/configuracion-inicial");
            router.refresh();
          }}
        >
          Ir a configuración inicial
        </Button>
      </div>
    </div>
  );
}
