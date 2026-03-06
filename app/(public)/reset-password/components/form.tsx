"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { getSession, resetPassword } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { schemaResetPassword, type TSchemaResetPassword } from "../schema";

export default function ResetPassword() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session?.DebeCambiar) {
        router.replace("/");
        return;
      }
      setUsername(session.User);
      setMounted(true);
    })();
  }, [router]);

  const form = useForm<TSchemaResetPassword>({
    resolver: zodResolver(schemaResetPassword),
    defaultValues: { nueva: "", confirmar: "" },
  });

  const onSubmit = (values: TSchemaResetPassword) => {
    startTransition(async () => {
      const { error } = await resetPassword(values, username);
      if (error) {
        form.setError("nueva", { message: error });
        return;
      }
      router.push("/profile");
    });
  };

  if (!mounted) return null;

  return (
    <div className="w-full">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Nueva contraseña */}
        <Controller
          name="nueva"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Nueva Contraseña</FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Input
                    {...field}
                    type={showNew ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={isPending}
                    className="pr-10 border-slate-700 bg-slate-800 text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FieldContent>
              <FieldDescription>
                Usa al menos 8 caracteres con letras y números.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Confirmar contraseña */}
        <Controller
          name="confirmar"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Confirmar Contraseña</FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={isPending}
                    className="pr-10 border-slate-700 bg-slate-800 text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FieldContent>
              <FieldDescription>
                Debe coincidir exactamente con la contraseña nueva.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
        >
          {isPending ? "Guardando..." : "Cambiar Contraseña"}
        </Button>
      </form>
    </div>
  );
}
