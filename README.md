This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Configuración de S3 para medios privados de tenants

El sistema guarda logos e imágenes de landing en un bucket S3 privado y entrega los archivos a través de `/api/media/...`, validando que el archivo pertenezca al tenant autenticado o a un tenant activo cuando se muestra en su landing pública.

### 1. Crear bucket S3

1. En AWS S3 crea un bucket, por ejemplo `odontologia-medios-prod`, en la región donde corre la aplicación.
2. Mantén **Block all public access** activado.
3. No agregues una bucket policy pública.
4. Activa versionado si quieres poder recuperar imágenes reemplazadas.

### 2. Crear rol IAM para la aplicación

Crea un rol IAM para el runtime donde se despliega Next.js (EC2/ECS/App Runner/Lambda/etc.) y adjunta una política limitada al bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::odontologia-medios-prod/tenants/*"
    }
  ]
}
```

En desarrollo local puedes usar credenciales temporales con `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` y `AWS_SESSION_TOKEN`, pero en producción se recomienda usar el rol IAM del servicio para no guardar llaves estáticas.

### 3. Variables de entorno

Configura estas variables en el entorno de la aplicación:

```bash
AWS_REGION=us-east-1
AWS_S3_BUCKET=odontologia-medios-prod
```

Si corres localmente sin rol IAM, agrega también credenciales temporales:

```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...
```

### 4. Aplicar migración

Ejecuta la migración para reemplazar el campo de logo en base64 por rutas S3 y agregar la imagen configurable de landing:

```bash
npx prisma migrate deploy
npx prisma generate
```

> Nota: los logos antiguos guardados como base64 no se pueden convertir automáticamente desde la base de datos a S3 sin un script de migración de archivos. Después de desplegar, cada tenant debe volver a subir su logo desde **Mi clínica**.

## Integración de Meta / WhatsApp Embedded Signup

El repositorio ya incluye una pantalla de tenant en `/whatsapp` para que cada clínica conecte su propio negocio/número de WhatsApp mediante Embedded Signup de Meta. La conexión queda guardada en `WhatsappConnection` con `businessAccountId`, `wabaId` y `phoneNumberId`; no se crea ni se usa un WABA del dueño del sistema para enviar mensajes de los tenants.

No se requiere una migración adicional para webhooks: la migración existente `20260706120000_whatsapp_embedded_signup` ya creó la tabla necesaria para guardar la conexión del tenant. El webhook agregado en `/api/meta/whatsapp/webhook` solo valida que Meta pueda llamar a la plataforma y confirma la recepción de eventos; cuando se necesite historial de mensajes o auditoría persistente, se puede agregar una tabla específica en otra iteración.

### Variables de entorno del dueño del sistema

Configura estas variables en el runtime de Medisoft Core:

```bash
NEXT_PUBLIC_META_APP_ID=tu_app_id_publico
NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID=tu_configuration_id_de_embedded_signup
NEXT_PUBLIC_META_GRAPH_VERSION=v21.0
META_GRAPH_VERSION=v21.0
META_APP_ID=tu_app_id
META_APP_SECRET=tu_app_secret
META_SYSTEM_USER_ACCESS_TOKEN=token_de_system_user_para_embedded_signup_y_consulta_graph
META_WEBHOOK_VERIFY_TOKEN=un_token_largo_generado_por_ti
```

`NEXT_PUBLIC_META_APP_ID` y `NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID` habilitan el botón del SDK en el navegador. `META_APP_SECRET`, `META_SYSTEM_USER_ACCESS_TOKEN` y `META_WEBHOOK_VERIFY_TOKEN` deben permanecer solo en servidor. El token del system user pertenece al negocio dueño de la app y se usa para completar/consultar el alta; los tenants autorizan su propio negocio y número durante el signup.

### URLs que debes registrar en Meta

- Dominio de la app: `medisoftcore.com`
- Términos y condiciones: `https://medisoftcore.com/terminos-y-condiciones`
- Política de privacidad: `https://medisoftcore.com/politicas-de-privacidad`
- Webhook callback URL principal: `https://medisoftcore.com/api/meta/whatsapp/webhook`
- Webhook callback URL alternativa: `https://medisoftcore.com/api/webhooks/meta/whatsapp`
- Verify token del webhook: el valor de `META_WEBHOOK_VERIFY_TOKEN`

### Paso a paso en Meta for Developers

1. Entra a Meta for Developers y crea una app de tipo **Business** para Medisoft Core.
2. En **App settings > Basic** configura nombre, correo de contacto, dominio `medisoftcore.com`, URL de privacidad y URL de términos.
3. Agrega el producto **WhatsApp** a la app.
4. En **WhatsApp > Configuration / Embedded Signup** crea una configuración para Embedded Signup y copia su **Configuration ID** a `NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID`.
5. En la configuración de Embedded Signup habilita que el cliente seleccione o cree su propio Meta Business, WABA y número; esa es la parte que hace que cada tenant conecte su API/número, no el WABA del dueño del sistema.
6. Configura los permisos requeridos por Meta para el flujo: `whatsapp_business_management` y `whatsapp_business_messaging`.
7. En **Webhooks** selecciona el objeto **WhatsApp Business Account**, registra la Callback URL principal (`https://medisoftcore.com/api/meta/whatsapp/webhook`) y el Verify Token, y suscribe al menos `messages`. Agrega también campos de calidad/plantillas si los vas a usar.
8. Cambia la app a **Live Mode** y completa **App Review** para los permisos si Meta lo solicita antes de permitir negocios externos reales.

### Paso a paso en Meta Business Suite / Business Settings

1. Abre el Business Manager dueño de Medisoft Core y verifica el negocio si Meta lo requiere.
2. Asocia la app Business creada en Developers al negocio dueño del sistema.
3. Crea un **System User** para la integración de Medisoft Core.
4. Genera un token permanente del System User con `whatsapp_business_management` y `whatsapp_business_messaging`; guárdalo como `META_SYSTEM_USER_ACCESS_TOKEN`.
5. Asegúrate de que el System User tenga acceso a la app y activos necesarios para operar Embedded Signup. Esto no significa que los tenants usarán tu número; solo permite a tu app completar el flujo y consultar Graph API después de la autorización.
6. Define un valor aleatorio y largo para `META_WEBHOOK_VERIFY_TOKEN`, guárdalo en tu hosting y usa exactamente el mismo valor al verificar el webhook en Meta.

### Paso a paso para cada tenant en Medisoft Core

1. El administrador del tenant entra a `/whatsapp` con permiso `editar_tenant`.
2. Hace clic en **Conectar WhatsApp**.
3. Meta abre Embedded Signup para que el tenant inicie sesión, seleccione o cree su negocio, WABA y número.
4. Medisoft Core recibe el resultado, consulta Graph API y guarda la conexión del tenant en `WhatsappConnection`.
5. Los envíos futuros deben usar el `phoneNumberId` guardado para ese tenant y un token válido autorizado para ese negocio/número.

### Guía de revisión de Meta para permisos de WhatsApp

Para el flujo multi-tenant de Medisoft Core, la app usa WhatsApp Business Platform para que cada clínica conecte su propio Business Portfolio/WABA/número mediante Embedded Signup y luego pueda enviar comunicaciones transaccionales a sus pacientes desde el sistema.

#### Permisos usados directamente por la aplicación

- `whatsapp_business_management`: necesario para completar Embedded Signup, consultar el número conectado (`phoneNumberId`) y guardar la conexión del tenant.
- `whatsapp_business_messaging`: necesario para enviar mensajes transaccionales desde el número conectado del tenant, por ejemplo mensajes de prueba, datos de citas, cotizaciones y comprobantes de pago.

Video sugerido para App Review:

1. Iniciar sesión como administrador de una clínica en Medisoft Core.
2. Ir a `/whatsapp` y mostrar el botón **Conectar WhatsApp**.
3. Abrir Embedded Signup, seleccionar negocio/WABA/número y mostrar el estado conectado.
4. Enviar un **Mensaje de prueba** desde `/whatsapp`.
5. Ir a **Citas** y usar **Enviar por WhatsApp** en una cita.
6. Ir a **Cotizaciones** y usar **Enviar por WhatsApp** en una cotización.
7. Ir a **Pagos** y usar **Enviar por WhatsApp** en un pago.

Descripción sugerida para `whatsapp_business_messaging`:

> Medisoft Core usa este permiso para enviar mensajes transaccionales solicitados por la clínica desde el número de WhatsApp Business conectado por cada tenant. Los mensajes incluyen pruebas de conexión, información de citas, cotizaciones dentales y confirmaciones de pagos. Estos mensajes ayudan a que los pacientes reciban información operativa de su atención odontológica directamente desde la clínica. La app no usa este permiso para spam ni para envíos no solicitados.

Descripción sugerida para `whatsapp_business_management`:

> Medisoft Core usa este permiso para completar el Embedded Signup de WhatsApp Business Platform, consultar los datos del número conectado por el tenant y guardar `businessAccountId`, `wabaId` y `phoneNumberId` por clínica. Esto permite que cada clínica administre su propia conexión de WhatsApp sin copiar credenciales manualmente y que los mensajes se envíen desde el número autorizado del tenant.

#### Permisos de proveedor tecnológico

Si Meta solicita `manage_app_solution`, úsalo únicamente si Medisoft Core está aplicando como Tech Provider/Solution Partner para administrar soluciones de socios entre proveedores tecnológicos y socios de soluciones. Si el permiso es aprobado, Medisoft Core lo usará para listar y administrar las soluciones/apps asociadas al onboarding de WhatsApp de clientes y para completar los flujos requeridos por Meta para proveedores tecnológicos. No se debe solicitar si no se está completando el proceso de Tech Provider.

Descripción sugerida para `manage_app_solution`:

> Medisoft Core solicita este permiso para soportar el flujo de proveedor tecnológico de Meta requerido para que clínicas externas conecten sus propias cuentas de WhatsApp Business a través de Embedded Signup. El permiso se usa para administrar la solución de partner asociada a la app de Medisoft Core, validar las apps/soluciones que el negocio puede administrar y completar los pasos de onboarding requeridos por Meta para operar WhatsApp Business Platform para tenants. La información recibida se usa únicamente para configurar y mantener la integración de WhatsApp de las clínicas dentro de Medisoft Core.

Si Meta solicita `whatsapp_business_manage_events`, solicítalo solo si vas a registrar eventos de conversión/actividad en nombre de las WABA administradas. El flujo actual de mensajería transaccional de Medisoft Core no requiere registrar eventos de compras, carritos o leads para optimización publicitaria; si no se implementa esa medición, no conviene solicitarlo.

Descripción sugerida solo si se implementa medición de eventos:

> Medisoft Core usará este permiso para registrar eventos operativos autorizados de la clínica relacionados con interacciones de WhatsApp Business, como confirmaciones de citas, generación de cotizaciones o pagos confirmados, cuando la clínica habilite explícitamente la medición. Estos eventos permitirán a la clínica analizar la efectividad de sus comunicaciones y mejorar reportes agregados. La app no enviará datos sensibles de salud ni información clínica detallada en eventos de anuncios; solo registrará eventos mínimos, agregados o no sensibles conforme a las políticas de Meta.
