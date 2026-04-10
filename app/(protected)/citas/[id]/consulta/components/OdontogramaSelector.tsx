"use client";

import { useMemo, useState } from "react";
import { Odontogram } from "@/components/odontogram/Odontogram";
import type { OdontogramChart } from "@/lib/odontogram/types";

const DEFAULT_STATES = ["caries", "restauracion", "corona", "extraccion", "sellante"] as const;

interface OdontogramaSelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
  chartValue?: OdontogramChart;
  onChartChange?: (chart: OdontogramChart) => void;
}

export function OdontogramaSelector({ value, onChange, chartValue, onChartChange }: OdontogramaSelectorProps) {
  const [activeState, setActiveState] = useState<(typeof DEFAULT_STATES)[number]>("caries");
  const selectedSet = useMemo(() => new Set(value), [value]);

  const handleChartChange = (nextChart: OdontogramChart) => {
    onChartChange?.(nextChart);

    const selectedTeeth = Array.from(
      new Set(
        nextChart.teeth
          .filter((tooth) => Object.values(tooth.surfaces).some((surface) => Boolean(surface)))
          .map((tooth) => tooth.id)
      )
    ).sort((a, b) => a - b);

    onChange(selectedTeeth);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {DEFAULT_STATES.map((state) => (
          <button
            key={state}
            type="button"
            onClick={() => setActiveState(state)}
            className={`rounded-md border px-2 py-1 text-xs capitalize transition ${
              activeState === state ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {state}
          </button>
        ))}
      </div>

      <Odontogram
        value={chartValue}
        onChange={handleChartChange}
        dentition="mixed"
        activeState={activeState}
        numberingSystem="FDI"
        secondarySystem="UNIVERSAL"
        optionalSystem="PALMER"
        className="space-y-2"
      />

      <p className="text-xs text-muted-foreground">
        Piezas seleccionadas: {selectedSet.size > 0 ? Array.from(selectedSet).sort((a, b) => a - b).join(", ") : "ninguna"}.
      </p>
    </div>
  );
}
