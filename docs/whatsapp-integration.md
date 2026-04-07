# Integración WhatsApp Business (Twilio)

## Qué incluye

- Configuración multi-clínica en `/mi-clinica/whatsapp`.
- Módulo operativo de chat en `/whatsapp` para iniciar conversaciones y ver contactos recientes.
- Guardado de número y estado de verificación por tenant (`TenantWhatsappConfig`).
- Registro de mensajes entrantes y salientes (`TenantWhatsappMensaje`).
- Webhook Twilio en `/api/whatsapp/twilio/webhook`.
- Agendamiento por comando WhatsApp:
  - `CITA|YYYY-MM-DD HH:mm|Nombre|correo@dominio.com|telefono|Motivo`
  - Crea una `SolicitudCitaPublica` para seguimiento por recepción.
- Soporte básico de documentos entrantes (media URLs registradas).
- Cuando se envía información por correo (citas, planes, pagos), se intenta enviar también un aviso por WhatsApp al teléfono del paciente si existe.
- En pacientes, el teléfono se guarda normalizado sin `+` ni espacios (ej. `50488346201`) y al enviar WhatsApp se agrega automáticamente el prefijo `+`.

## Pasos de activación

1. Crear/activar número WhatsApp en Twilio.
2. En Twilio Console, configurar el webhook de mensajes entrantes:
   - `https://TU_DOMINIO/api/whatsapp/twilio/webhook`
3. Configurar en el servidor del SaaS (una sola vez):
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM`
4. En el SaaS ir a **Mi Clínica > Configurar WhatsApp Business**.
5. La clínica solo debe:
   - Guardar su número WhatsApp (E.164)
   - Solicitar código de verificación
   - Ingresar el código recibido y verificar
6. Ejecutar envío de prueba.

## Notas

- Aunque uses Twilio, la cuenta sigue bajo políticas de WhatsApp Business Platform (Meta).
- Para datos clínicos sensibles, evita enviar PHI por chat; usa links a portal seguro.
