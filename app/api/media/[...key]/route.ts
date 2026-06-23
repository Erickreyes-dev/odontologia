import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantImageFromS3 } from "@/lib/s3";
import { NextRequest, NextResponse } from "next/server";

function getTenantIdFromKey(key: string) {
  const match = /^tenants\/([^/]+)\/(logos|landing)\//.exec(key);
  return match?.[1] ?? null;
}

export async function GET(_request: NextRequest, { params }: { params: { key: string[] } }) {
  const key = params.key.join("/");
  const tenantId = getTenantIdFromKey(key);
  if (!tenantId) return new NextResponse("Ruta de medio inválida", { status: 400 });

  const session = await getSession();
  const sameTenant = session?.TenantId === tenantId;
  const publicTenant = await prisma.tenant.findFirst({
    where: {
      id: tenantId,
      activo: true,
      OR: [{ logoPath: key }, { landingImagePath: key }],
    },
    select: { id: true },
  });

  if (!sameTenant && !publicTenant) return new NextResponse("No autorizado", { status: 401 });

  const s3Response = await getTenantImageFromS3(key);
  const headers = new Headers();
  headers.set("Content-Type", s3Response.headers.get("content-type") || "application/octet-stream");
  headers.set("Cache-Control", "private, max-age=300");
  return new NextResponse(s3Response.body, { status: 200, headers });
}
