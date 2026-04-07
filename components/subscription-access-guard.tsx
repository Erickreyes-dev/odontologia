"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  hasInactiveSubscription: boolean;
  effectiveStatus: string;
  title: string;
  messageTemplate: string;
  ctaLabel: string;
  children: React.ReactNode;
};

const EXEMPT_PATHS = ["/billing", "/suscripcion", "/dashboard-admin", "/tenants", "/paquetes"];

function isExemptPath(pathname: string): boolean {
  return EXEMPT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function SubscriptionAccessGuard({
  hasInactiveSubscription,
  effectiveStatus,
  title,
  messageTemplate,
  ctaLabel,
  children,
}: Props) {
  const pathname = usePathname() ?? "";

  if (!hasInactiveSubscription || isExemptPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-rose-300 bg-rose-50 p-6 text-center dark:border-rose-900/60 dark:bg-rose-950/40">
      <div className="mb-3 flex items-center justify-center gap-2 text-rose-700 dark:text-rose-300">
        <AlertTriangle className="h-5 w-5" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="mb-5 text-sm text-rose-700/90 dark:text-rose-300/90">
        {messageTemplate.replace("{status}", effectiveStatus)}
      </p>
      <Button asChild>
        <Link href="/billing">{ctaLabel}</Link>
      </Button>
    </div>
  );
}
