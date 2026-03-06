import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";
import ResetPassword from "./components/form";

export default async function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl lg:grid-cols-2">
        <div className="relative hidden min-h-[620px] lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1588776814546-ec7e4f1b5f11?auto=format&fit=crop&w=1400&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" />
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-10 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Seguridad de acceso</p>
            <h2 className="text-3xl font-semibold leading-tight">
              Protege tu cuenta con una nueva contraseña robusta y segura.
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <Card className="mx-auto w-full max-w-md border-slate-700/70 bg-slate-900/60 text-white shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-center text-3xl font-bold">Cambiar contraseña</CardTitle>
              <CardDescription className="text-center text-slate-300">
                Establece una contraseña nueva para continuar en MedisoftCore
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="text-center text-gray-400">Cargando…</div>}>
                <ResetPassword />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
