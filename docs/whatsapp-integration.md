# Integración WhatsApp Business (Twilio)

## Qué incluye

- Configuración multi-clínica en `/mi-clinica/whatsapp`.
- Guardado de credenciales por tenant (`TenantWhatsappConfig`).
- Registro de mensajes entrantes y salientes (`TenantWhatsappMensaje`).
- Webhook Twilio en `/api/whatsapp/twilio/webhook`.
- Agendamiento por comando WhatsApp:
  - `CITA|YYYY-MM-DD HH:mm|Nombre|correo@dominio.com|telefono|Motivo`
  - Crea una `SolicitudCitaPublica` para seguimiento por recepción.
- Soporte básico de documentos entrantes (media URLs registradas).

## Pasos de activación

1. Crear/activar número WhatsApp en Twilio.
2. En Twilio Console, configurar el webhook de mensajes entrantes:
   - `https://TU_DOMINIO/api/whatsapp/twilio/webhook`
3. En el SaaS ir a **Mi Clínica > Configurar WhatsApp Business**.
4. Guardar:
   - Account SID
   - Auth Token
   - Número remitente (E.164)
   - (Opcional) Webhook Secret para validar firma
5. Ejecutar envío de prueba.

## Notas

- Aunque uses Twilio, la cuenta sigue bajo políticas de WhatsApp Business Platform (Meta).
- Para datos clínicos sensibles, evita enviar PHI por chat; usa links a portal seguro.
