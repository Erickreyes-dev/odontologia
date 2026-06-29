import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantFileFromS3 } from "@/lib/s3";
import { NextRequest, NextResponse } from "next/server";

function getTenantFolderFromKey(key: string) {
  const match = /^tenants\/([^/]+)\/(logos|landing|consultas|pacientes)\//.exec(key);
  return match ? { tenantFolder: match[1], folder: match[2] } : null;
}

export async function GET(_request: NextRequest, { params }: { params: { key: string[] } }) {
  const key = params.key.join("/");
  const parsed = getTenantFolderFromKey(key);
  if (!parsed) return new NextResponse("Ruta de medio inválida", { status: 400 });

  const session = await getSession();
  const sameTenant = session?.TenantId === parsed.tenantFolder || session?.TenantSlug === parsed.tenantFolder;

  if (parsed.folder === "logos" || parsed.folder === "landing") {
    const publicTenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ id: parsed.tenantFolder }, { slug: parsed.tenantFolder }],
        activo: true,
        ...(parsed.folder === "logos" ? { logoPath: key } : { landingImagePath: key }),
      },
      select: { id: true },
    });

    if (!sameTenant && !publicTenant) return new NextResponse("No autorizado", { status: 401 });
  } else {
    if (!session || !sameTenant) return new NextResponse("No autorizado", { status: 401 });

    const exists = parsed.folder === "consultas"
      ? await prisma.consultaArchivo.findFirst({ where: { tenantId: session.TenantId, key }, select: { id: true } })
      : await prisma.pacienteArchivo.findFirst({ where: { tenantId: session.TenantId, key }, select: { id: true } });

    if (!exists) return new NextResponse("No autorizado", { status: 401 });
  }

  const s3Response = await getTenantFileFromS3(key);
  const headers = new Headers();
  headers.set("Content-Type", s3Response.headers.get("content-type") || "application/octet-stream");
  headers.set("Cache-Control", "private, max-age=300");
  return new NextResponse(s3Response.body, { status: 200, headers });
}
