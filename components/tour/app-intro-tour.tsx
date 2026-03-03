"use client";

import { Button } from "@/components/ui/button";
import { getTourByPath } from "@/lib/app-tour-config";
import { HelpCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const TOUR_STORAGE_KEY = "odontologia-tour-v1";

type SeenMap = Record<string, boolean>;

export function AppIntroTour() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const tour = useMemo(() => getTourByPath(pathname), [pathname]);
  const currentStep = tour.steps[stepIndex];

  useEffect(() => {
    const seenRaw = localStorage.getItem(TOUR_STORAGE_KEY);
    const seen: SeenMap = seenRaw ? JSON.parse(seenRaw) : {};
    if (!seen[tour.key]) {
      setIsOpen(true);
      seen[tour.key] = true;
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(seen));
    }
    setStepIndex(0);
  }, [tour.key]);

  useEffect(() => {
    if (!isOpen) return;

    const element = document.querySelector(currentStep.selector);
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("tour-highlight");
    }

    return () => {
      if (element instanceof HTMLElement) {
        element.classList.remove("tour-highlight");
      }
    };
  }, [currentStep.selector, isOpen]);

  const closeTour = () => {
    setIsOpen(false);
    const highlight = document.querySelector(".tour-highlight");
    if (highlight instanceof HTMLElement) {
      highlight.classList.remove("tour-highlight");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-40 gap-1"
        onClick={() => {
          setStepIndex(0);
          setIsOpen(true);
        }}
      >
        <HelpCircle className="h-4 w-4" />
        Tour
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/45">
          <div className="absolute bottom-6 right-6 w-[22rem] rounded-lg border bg-background p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tour.title}
                </p>
                <h3 className="text-base font-semibold">{currentStep.title}</h3>
              </div>
              <button type="button" onClick={closeTour} aria-label="Cerrar tour">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-2 text-sm text-muted-foreground">{tour.description}</p>
            <p className="text-sm">{currentStep.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Paso {stepIndex + 1} de {tour.steps.length}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={stepIndex === 0}
                >
                  Anterior
                </Button>
                {stepIndex < tour.steps.length - 1 ? (
                  <Button type="button" size="sm" onClick={() => setStepIndex((prev) => prev + 1)}>
                    Siguiente
                  </Button>
                ) : (
                  <Button type="button" size="sm" onClick={closeTour}>
                    Finalizar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
