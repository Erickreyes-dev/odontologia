"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"
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
            toast.error(
                "La contraseña debe tener al menos 6 caracteres",
            );
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
                toast("Error al cambiar la contraseña:", {description: res || "Error desconocido"});
            }
        });
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-6 bg-gray-900 text-white rounded-lg border">
            <h1 className="text-2xl font-bold mb-4">Restablecer contraseña</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium mb-1">Nueva Contraseña</label>
                    <div className="relative">
                        <Input
                            id="newPassword"
                            type={showNew ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.currentTarget.value)}
                            disabled={isPending}
                            className="bg-gray-800 border-gray-700 text-white pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
                        >
                            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                            disabled={isPending}
                            className="bg-gray-800 border-gray-700 text-white pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
                        >
                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    {isPending ? "Cambiando..." : "Cambiar Contraseña"}
                </Button>
            </form>
        </div>
    );
}
