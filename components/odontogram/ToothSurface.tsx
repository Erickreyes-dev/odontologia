import type { CSSProperties } from "react";
import type { OdontogramStateDefinition, ToothSurfaceKey } from "@/lib/odontogram/types";

interface ToothSurfaceProps {
  toothId: number;
  surface: ToothSurfaceKey;
  path: string;
  label: string;
  stateKey?: string | null;
  stateMap: Record<string, OdontogramStateDefinition>;
  active?: boolean;
  readOnly?: boolean;
  onSelect: (surface: ToothSurfaceKey) => void;
  onHover: (surface: ToothSurfaceKey | null) => void;
}

export function ToothSurface({
  toothId,
  surface,
  path,
  label,
  stateKey,
  stateMap,
  active,
  readOnly,
  onSelect,
  onHover,
}: ToothSurfaceProps) {
  const stateConfig = stateKey ? stateMap[stateKey] : undefined;

  const style = {
    fill: stateConfig?.color ?? "hsl(var(--background))",
    stroke: stateConfig?.strokeColor ?? "hsl(var(--border))",
    transition: "fill 180ms ease, stroke 180ms ease, transform 180ms ease, opacity 180ms ease, filter 180ms ease",
    transformOrigin: "50% 50%",
    filter: active ? "drop-shadow(0px 1px 1px rgba(15, 23, 42, 0.2))" : "none",
  } satisfies CSSProperties;

  return (
    <path
      d={path}
      style={style}
      className={readOnly ? "cursor-default" : "cursor-pointer"}
      opacity={active ? 1 : 0.94}
      strokeWidth={active ? 2.5 : 1.5}
      transform={active ? "scale(1.02)" : "scale(1)"}
      onMouseEnter={() => onHover(surface)}
      onMouseLeave={() => onHover(null)}
      onClick={(event) => {
        if (readOnly) return;
        event.stopPropagation();
        onSelect(surface);
      }}
      role="button"
      aria-label={`Diente ${toothId} superficie ${label}`}
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={(event) => {
        if (readOnly) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(surface);
        }
      }}
    />
  );
}
