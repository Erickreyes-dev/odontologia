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
import { Eye, EyeOff } from "lucide-react";

import { getSession, login } from "../../../auth";
import ForgotPasswordForm from "./forworgot"; // revisa el nombre real
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

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false); // controla el Dialog
  const [tenantSlugFromHost, setTenantSlugFromHost] = useState("");
  const [savedTenantUrl, setSavedTenantUrl] = useState("");

  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const form = useForm<z.infer<typeof schemaSignIn>>({
    resolver: zodResolver(schemaSignIn),
    defaultValues: {
      tenantSlug: "",
      usuario: "",
      contrasena: "",
    },
  });

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

    const storedUrl = window.localStorage.getItem("tenant_url");
    if (storedUrl) setSavedTenantUrl(storedUrl);
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
        router.replace(response.redirect!);
      }
    });
  };

  if (!mounted) return null;

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                className="h-11 rounded-xl border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/40"
              />
              <FieldDescription className="text-xs text-slate-400">
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
                className="h-11 rounded-xl border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/40"
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
                  className="h-11 rounded-xl border-slate-600 bg-slate-800/80 pr-10 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/40"
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

        <div className="space-y-2 pt-2">
          <p className="text-center text-sm font-medium text-slate-200">O ingresa con tu cuenta de Google o correo</p>
          <p className="text-center text-xs text-slate-400">
            Si aún no tienes acceso, crea tu cuenta en pocos pasos.
          </p>
        </div>

        <GoogleOnboardingButton />
        <Link href="/registro-clinica" className="block text-center text-sm font-medium text-cyan-300 hover:underline">
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
