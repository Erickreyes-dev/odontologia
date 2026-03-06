"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { resetPassword } from "../actions";

interface Props {
  token: string;
}

export default function ResetPasswordForm({ token }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.info("Las contraseñas no coinciden");
      return;
    }

    startTransition(async () => {
      const res = await resetPassword(token, newPassword);
      if (res === true) {
        toast.success("Contraseña cambiada con éxito");
        router.push("/");
      } else {
        toast("Error al cambiar la contraseña:", { description: res || "Error desconocido" });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-slate-100">
          Nueva contraseña
        </label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            disabled={isPending}
            className="border-slate-700 bg-slate-950/60 pr-10 text-white"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-white"
          >
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-100">
          Confirmar contraseña
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            disabled={isPending}
            className="border-slate-700 bg-slate-950/60 pr-10 text-white"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-white"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-cyan-600 hover:bg-cyan-500">
        {isPending ? "Cambiando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
