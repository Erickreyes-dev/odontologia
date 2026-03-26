import { getSession } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Login from "../components/formLogin";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl lg:grid-cols-2">
        <div className="relative hidden min-h-[620px] lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1400&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" />
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-10 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Odontología digital</p>
            <h2 className="text-3xl font-semibold leading-tight">
              Gestiona tu clínica con una experiencia moderna y segura.
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <Card className="mx-auto w-full max-w-md border-slate-700/70 bg-slate-900/60 text-white shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-center text-3xl font-bold">Bienvenido</CardTitle>
              <CardDescription className="text-center text-slate-300">
                Ingresa clínica, usuario y contraseña para iniciar sesión
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="text-center text-gray-400">Cargando…</div>}>
                <Login />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
