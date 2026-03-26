"use client";

import { useMemo, useState } from "react";
import { getTourByPath } from "@/lib/app-tour-config";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AppHelpGuide() {
  const pathname = usePathname();
  const tour = useMemo(() => getTourByPath(pathname), [pathname]);
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = tour.steps[stepIndex];

  const goPrevious = () => setStepIndex((prev) => Math.max(prev - 1, 0));
  const goNext = () => setStepIndex((prev) => Math.min(prev + 1, tour.steps.length - 1));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <BookOpen className="mr-2 h-4 w-4" />
          Guía rápida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-500" />
            {tour.title}
          </DialogTitle>
          <DialogDescription>{tour.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Paso {stepIndex + 1} de {tour.steps.length}
          </p>
          <h4 className="mt-2 text-base font-semibold">{currentStep.title}</h4>
          <p className="mt-2 text-sm text-muted-foreground">{currentStep.description}</p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" onClick={goPrevious} disabled={stepIndex === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>
          <Button size="sm" onClick={goNext} disabled={stepIndex === tour.steps.length - 1}>
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
