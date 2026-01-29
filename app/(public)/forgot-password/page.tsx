// app/forgot-password/page.tsx
import { isResetTokenValid } from "./actions";
import ResetPasswordForm from "./components/form";

interface Props {
    searchParams: { token?: string };
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
    const token = searchParams.token || "";

    const isValid = await isResetTokenValid(token);
    if (!token || !isValid) {
        return (
            <div className="max-w-md mx-auto mt-20 p-6 border rounded-md shadow">
                <h1 className="text-xl font-bold mb-4">Enlace inválido o expirado</h1>
                <p>Lo sentimos, el enlace ya no es válido o ha expirado. Vuelve a solicitar el restablecimiento de contraseña.</p>
            </div>
        );
    }

    return <ResetPasswordForm token={token} />;
}
