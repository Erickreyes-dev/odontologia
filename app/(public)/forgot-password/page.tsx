// app/forgot-password/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isResetTokenValid } from "./actions";
import ResetPasswordForm from "./components/form";

interface Props {
  searchParams: { token?: string };
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const token = searchParams.token || "";
  const isValid = token ? await isResetTokenValid(token) : false;

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
              Recupera el acceso a tu cuenta de forma rápida y segura.
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <Card className="mx-auto w-full max-w-md border-slate-700/70 bg-slate-900/60 text-white shadow-none">
            {token && isValid ? (
              <>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-center text-3xl font-bold">Restablecer contraseña</CardTitle>
                  <CardDescription className="text-center text-slate-300">
                    Crea una nueva contraseña para volver a entrar a tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResetPasswordForm token={token} />
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-center text-3xl font-bold">Enlace inválido</CardTitle>
                  <CardDescription className="text-center text-slate-300">
                    El enlace para restablecer contraseña no es válido o expiró.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-sm text-slate-200">
                    Solicita un nuevo correo de recuperación para intentarlo de nuevo.
                  </p>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
