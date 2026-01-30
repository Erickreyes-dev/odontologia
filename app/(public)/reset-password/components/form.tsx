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
    <div className="max-w-md mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Cambiar Contraseña</h1>

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
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FieldContent>
              <FieldDescription>
                Ingresa tu nueva contraseña.
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
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FieldContent>
              <FieldDescription>
                Repite la contraseña para confirmar.
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
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isPending ? "Guardando..." : "Cambiar Contraseña"}
        </Button>
      </form>
    </div>
  );
}
