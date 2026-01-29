"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { forgotPasswordAction } from "../actions";

interface ForgotPasswordFormProps {
    onCancel?: () => void;
    onSuccess?: () => void;
}

export default function ForgotPasswordForm({ onCancel, onSuccess }: ForgotPasswordFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const username = formData.get("username");

        // Llama la action manualmente (en vez de usar form action)
        try {
            const result = await forgotPasswordAction(formData);

            if (result) {
                onSuccess?.();
            } else {
                console.error("Error al enviar el correo");
                alert("No se pudo enviar el correo. Intenta de nuevo.");
            }
        } catch (error) {
            alert("Ocurrió un error inesperado.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                    Usuario
                </label>
                <Input
                    id="username"
                    name="username"
                    placeholder="Tu nombre de usuario"
                    required
                    className="w-full"
                    disabled={isSubmitting}
                />
            </div>
            <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Enviando..." : "Enviar correo"}
                </Button>
            </div>
        </form>
    );
}
