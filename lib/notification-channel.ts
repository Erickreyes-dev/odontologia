export type NotificationChannel = "email" | "whatsapp" | "both";

export function shouldSendEmail(channel: NotificationChannel) {
  return channel === "email" || channel === "both";
}

export function shouldSendWhatsApp(channel: NotificationChannel) {
  return channel === "whatsapp" || channel === "both";
}
