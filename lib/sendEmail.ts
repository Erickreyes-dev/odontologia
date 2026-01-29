/* eslint-disable @typescript-eslint/no-explicit-any */
// services/email.ts (o donde lo tengas)
import nodemailer from "nodemailer";

function sleep(ms: number) {
    return new Promise<void>(res => setTimeout(res, ms));
}

export async function getTransporter() {
    // Pool: mantiene la conexión y encola mensajes en vez de abrir/cerrar siempre.
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST!,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
        },
        pool: true,                 // Habilita pooling
        maxConnections: 1,         // Mantener una sola conexión para no paralelizar
        maxMessages: 100,          // cantidad de mensajes por conexión antes de renovarla
        // Opcionales:
        // greetingTimeout: 30000,
        // socketTimeout: 60000,
        tls: {
            rejectUnauthorized: false,
        },
    });
}

export interface MailPayload {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export class EmailService {
    private transporterPromise = getTransporter();

    private isTransientError(err: any) {
        // Considerar transitorio si el SMTP responde 421 o cualquier 4xx temporal.
        const code = err?.responseCode ?? err?.statusCode ?? null;
        const resp = String(err?.response || "");
        if (code === 421) return true;
        // Algunos servidores devuelven códigos 4xx pero con distintos campos.
        if (typeof code === "number" && code >= 400 && code < 500) return true;
        // También puede verificar mensajes de texto
        if (resp.includes("submission rate") || resp.includes("rate limit")) return true;
        return false;
    }

    async sendMail(payload: MailPayload) {
        const transporter = await this.transporterPromise;

        const maxAttempts = 10;
        let attempt = 0;
        // base delay en ms (se usa en backoff exponencial)
        const baseDelay = 2000;

        while (attempt < maxAttempts) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM!,
                    to: payload.to,
                    subject: payload.subject,
                    html: payload.html,
                    text: payload.text,
                });
                // si llegamos acá, OK
                return;
            } catch (err: any) {
                attempt++;
                const isTransient = this.isTransientError(err);
                console.warn(`Attempt ${attempt} failed for ${payload.to}:`, err?.response || err?.message || err);

                if (!isTransient || attempt >= maxAttempts) {
                    // No es transitorio o ya intentamos mucho: re-lanzar
                    throw err;
                }

                // Exponential backoff with jitter
                const backoff = baseDelay * Math.pow(2, attempt - 1);
                const jitter = Math.floor(Math.random() * 2000); // hasta 2s extra
                const wait = backoff + jitter;
                console.info(`Transient SMTP error. Esperando ${wait}ms antes de reintentar (intento ${attempt + 1}/${maxAttempts})`);
                await sleep(wait);
                // reintenta
            }
        }
    }
}
