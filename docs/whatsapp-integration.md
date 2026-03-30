# Integración WhatsApp Business (Meta Cloud API) - Multi-tenant

## Resumen técnico
- Nuevo módulo tenant-aware con conexión por clínica (`/whatsapp`).
- Billing fijo: `tenant_meta_direct` (la clínica paga directo a Meta).
- Persistencia de conexiones, conversaciones, mensajes y webhook events con aislamiento por `tenantId`.
- Chat integrado en perfil de paciente con envío de texto y documento (URL segura).

## Despliegue
1. Ejecutar migraciones Prisma:
   ```bash
   npx prisma migrate deploy
   ```
2. Regenerar cliente Prisma (si aplica en build):
   ```bash
   npx prisma generate
   ```
3. Variables de entorno requeridas:
   - `META_APP_ID`
   - `META_APP_SECRET`
   - `META_EMBEDDED_SIGNUP_CONFIG_ID`
   - `META_WEBHOOK_VERIFY_TOKEN`
   - `APP_URL`
4. Configurar callback de OAuth y webhook en Meta apuntando a:
   - `https://<dominio>/api/whatsapp/connect/callback`
   - `https://<dominio>/api/whatsapp/webhook`

## QA manual checklist
- [ ] Tenant admin ve el módulo WhatsApp con copy comercial y checkbox obligatorio.
- [ ] Conexión OAuth deja estado `connected`.
- [ ] Desde perfil de paciente se abre chat y se envía texto/documento.
- [ ] Webhook actualiza estados `sent/delivered/read/failed`.
- [ ] Mensajes inbound aparecen en conversación sin mezclarse entre tenants.
- [ ] En formularios de cita/cotización existe selector de canal (Email/WhatsApp/Ambos).
- [ ] Si WhatsApp no está conectado y se selecciona WhatsApp, se muestra error claro.
- [ ] Alta/edición de paciente exige ZIP postal y valida teléfono internacional.

## Riesgos y fase 2
- Validación criptográfica HMAC de firma webhook pendiente (implementación parcial).
- Embedded signup callback actualmente soporta assets por query; en fase 2 consultar assets directo a Graph API.
- Envío de documento usa URL segura externa; fase 2 debe incluir almacenamiento firmado (S3/R2).
