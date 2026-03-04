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
    redirect("/profile");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="mx-auto w-full max-w-md border-gray-700 bg-gray-800 text-white shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">Bienvenido</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Ingrese clínica, usuario y contraseña para iniciar sesión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center text-gray-400">Cargando…</div>}>
            <Login />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
