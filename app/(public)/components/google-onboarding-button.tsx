"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles } from "lucide-react";

export default function GoogleOnboardingButton() {
  return (
    <div className="space-y-2">
      <Button asChild type="button" className="w-full rounded-xl bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400">
        <Link href="/registro-clinica">
          <Rocket className="mr-2 h-4 w-4" /> Iniciar sesión con Google
        </Link>
      </Button>
      <p className="flex items-center justify-center gap-1 text-center text-xs text-slate-400">
        <Sparkles className="h-3.5 w-3.5" /> Onboarding guiado + registro con Google
      </p>
    </div>
  );
}
