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
