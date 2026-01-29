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

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false); // controla el Dialog

  const redirectTo = searchParams.get("redirect") ?? "/profile";

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<z.infer<typeof schemaSignIn>>({
    resolver: zodResolver(schemaSignIn),
    defaultValues: {
      usuario: "",
      contrasena: "",
    },
  });

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Usuario */}
        <Controller
          name="usuario"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Usuario</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                type="text"
                placeholder="Ingresa tu usuario"
                disabled={isPending}
                autoComplete="username"
              />
              <FieldDescription>Agrega su nombre de usuario.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Contraseña */}
        <Controller
          name="contrasena"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="relative mb-4">
              <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  type={showPassword ? "text" : "password"}
                  placeholder="*******"
                  disabled={isPending}
                  className="pr-10" // deja espacio para el ojo
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <FieldDescription>Agrega tu contraseña.</FieldDescription>
              {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
            </Field>
          )}
        />


        <Button type="submit" disabled={isPending}>
          {isPending ? "Iniciando..." : "Iniciar sesión"}
        </Button>

        <Button variant="link" type="button" onClick={() => setOpen(true)}>
          ¿Olvidaste tu contraseña?
        </Button>
      </form>

      {/* Dialog fuera del form */}
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
              router.push("/"); // ruta después de enviar
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
