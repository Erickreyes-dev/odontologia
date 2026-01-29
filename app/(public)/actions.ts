// app/actions/auth.ts

"use server";

import { requestPasswordReset } from "./forgot-password/actions";

export async function forgotPasswordAction(formData: FormData) {
    const username = formData.get("username");
    if (typeof username !== "string" || !username.trim() || username.length < 3) {
        // Si el usuario está vacío, redirigimos de vuelta a login con un flag de error
        return false;
    }

    // Llamamos a la lógica que genera el token y envía el email
    await requestPasswordReset(username.trim());

    // Redirigimos al login con un mensaje de “correo enviado”
    return true
}
