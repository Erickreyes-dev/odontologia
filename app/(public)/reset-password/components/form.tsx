// components/ResetPassword.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { getSession, resetPassword } from "@/auth";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { schemaResetPassword, type TSchemaResetPassword } from "../schema";

export default function ResetPassword() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [username, setUsername] = useState<string>("");
    // Solo en montaje validamos que haya sesión y flag
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
            // Ya está la cookie con el nuevo token, el middleware lo verá correcto
            router.push("/profile");
        });
    };

    if (!mounted) return null;

    return (
        <div className="max-w-md mx-auto p-6 bg-gray-900 text-white rounded-lg">
            <h1 className="text-2xl font-bold mb-4">Cambiar Contraseña</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="nueva"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nueva Contraseña</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            {...field}
                                            type={showNew ? "text" : "password"}
                                            placeholder="••••••••"
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
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmar"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirmar Contraseña</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            {...field}
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="••••••••"
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
                                </FormControl>
                                <FormMessage />
                            </FormItem>
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
            </Form>
        </div>
    );
}
