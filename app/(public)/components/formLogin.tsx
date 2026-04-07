"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";

import { getSession, login } from "../../../auth";
import ForgotPasswordForm from "./forworgot";
import { schemaSignIn, TSchemaSignIn } from "@/lib/shemas";
import GoogleOnboardingButton from "./google-onboarding-button";
import Link from "next/link";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function getTenantSlugFromBrowserHost(): string {
  const host = window.location.hostname.toLowerCase();
  const labels = host.split(".").filter(Boolean);

  if (labels.length >= 3) return labels[0];
  if (labels.length === 2 && LOCAL_HOSTS.has(labels[1])) return labels[0];

  return "";
}

function resolveSafeInternalRedirect(target: string | null | undefined): string {
  if (!target) return "/dashboard";
  if (target.startsWith("/") && !target.startsWith("//")) return target;

  try {
    const parsed = new URL(target);
    if (typeof window !== "undefined" && parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return "/dashboard";
  }

  return "/dashboard";
}

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const redirectTo = resolveSafeInternalRedirect(
    searchParams.get("redirect") ?? searchParams.get("callbackUrl") ?? "/dashboard",
  );

  const form = useForm<z.infer<typeof schemaSignIn>>({
    resolver: zodResolver(schemaSignIn),
    defaultValues: {
      tenantSlug: "",
      usuario: "",
      contrasena: "",
    },
  });

  const [tenantSlugFromHost, setTenantSlugFromHost] = useState("");

  useEffect(() => {
    setMounted(true);
    const slug = getTenantSlugFromBrowserHost();
    const tenantSlugFromQuery = (searchParams.get("tenantSlug") || "").trim().toLowerCase();

    if (slug) {
      setTenantSlugFromHost(slug);
      form.setValue("tenantSlug", slug, { shouldValidate: true });
    } else if (tenantSlugFromQuery) {
      form.setValue("tenantSlug", tenantSlugFromQuery, { shouldValidate: true });
    }
  }, [form, searchParams]);

  const onSubmit = (values: TSchemaSignIn) => {
    startTransition(async () => {
      const response = await login(values, redirectTo);
      if (response.error) {
        form.setError("contrasena", { message: response.error });
        return;
      }

      const session = await getSession();
      if (session?.DebeCambiar) {
        router.replace("/reset-password");
      } else {
        router.replace(resolveSafeInternalRedirect(response.redirect ?? redirectTo));
      }
    });
  };

  if (!mounted) return null;

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="min-w-0 space-y-5 overflow-x-hidden">
        <section className="space-y-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-4">
          <p className="text-center text-sm font-semibold text-cyan-200">Acceso rápido</p>
          <h3 className="text-center text-base font-bold text-white">Iniciar sesión solo con Google</h3>
          <p className="text-center text-xs text-slate-300">
            Este botón es exclusivamente para autenticación con cuenta de Google.
          </p>
          <GoogleOnboardingButton />
        </section>

        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Separator className="bg-slate-700" />
            <p className="text-center text-[11px] uppercase tracking-[0.12em] text-slate-400 sm:whitespace-nowrap sm:text-xs sm:tracking-[0.2em]">
              o con usuario
            </p>
            <Separator className="bg-slate-700" />
          </div>
          <p className="text-center text-xs text-slate-400">
            Usa tu clínica, usuario y contraseña si no deseas autenticarte con Google.
          </p>
        </div>

        <Controller
          name="tenantSlug"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-slate-200">
                Clínica
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                type="text"
                placeholder="slug de tu clínica"
                disabled={isPending || Boolean(tenantSlugFromHost)}
                autoComplete="organization"
                className="h-11 w-full min-w-0 rounded-xl border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/40"
              />
              <FieldDescription className="break-all text-xs text-slate-400">
                {tenantSlugFromHost
                  ? `Se detectó automáticamente desde el subdominio: ${tenantSlugFromHost}`
                  : "Identificador de la clínica (tenant). Si accedes por subdominio no es necesario ingresarlo."}
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="usuario"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-slate-200">
                Usuario
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                type="text"
                placeholder="Ingresa tu usuario"
                disabled={isPending}
                autoComplete="username"
                className="h-11 w-full min-w-0 rounded-xl border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/40"
              />
              <FieldDescription className="text-xs text-slate-400">Agrega su nombre de usuario.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="contrasena"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="relative mb-4">
              <FieldLabel htmlFor={field.name} className="text-slate-200">
                Contraseña
              </FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  type={showPassword ? "text" : "password"}
                  placeholder="*******"
                  disabled={isPending}
                  className="h-11 w-full min-w-0 rounded-xl border-slate-600 bg-slate-800/80 pr-10 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-cyan-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <FieldDescription className="text-xs text-slate-400">Agrega tu contraseña.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full rounded-xl bg-cyan-500 font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          {isPending ? "Iniciando..." : "Iniciar sesión"}
        </Button>

        <Link href="/registro-clinica" className="block break-words text-center text-sm font-medium text-cyan-300 hover:underline">
          Crear cuenta con Google o correo
        </Link>
        <Button variant="link" type="button" onClick={() => setOpen(true)} className="mx-auto block text-slate-300">
          ¿Olvidaste tu contraseña?
        </Button>
      </form>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Recuperar contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu usuario para recibir un correo con el enlace de restablecimiento.
            </DialogDescription>
          </DialogHeader>
          <ForgotPasswordForm
            onCancel={() => setOpen(false)}
            onSuccess={() => {
              setOpen(false);
              router.push("/login");
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
