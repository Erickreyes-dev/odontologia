"use client";

import Image from "next/image";
import { type CSSProperties, type MouseEvent, useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
] as const;

const TEMPLATES: Record<11 | 13 | 14 | 16, string> = {
  11: "/odontograma-svg/11.svg",
  13: "/odontograma-svg/13.svg",
  14: "/odontograma-svg/14.svg",
  16: "/odontograma-svg/16.svg",
};

const TEMPLATES_OCCL: Partial<Record<14 | 16, string>> = {
  14: "/odontograma-svg/14_occl.svg",
  16: "/odontograma-svg/16_occl.svg",
};

const TOOTH_TEMPLATE = new Map<number, { tpl: 11 | 13 | 14 | 16; rot: 0 | 180; mirror: boolean }>([
  [11, { tpl: 11, rot: 0, mirror: false }], [12, { tpl: 11, rot: 0, mirror: false }],
  [21, { tpl: 11, rot: 0, mirror: true }], [22, { tpl: 11, rot: 0, mirror: true }],
  [31, { tpl: 11, rot: 180, mirror: false }], [32, { tpl: 11, rot: 180, mirror: false }],
  [41, { tpl: 11, rot: 180, mirror: true }], [42, { tpl: 11, rot: 180, mirror: true }],
  [13, { tpl: 13, rot: 0, mirror: false }], [23, { tpl: 13, rot: 0, mirror: true }],
  [33, { tpl: 13, rot: 180, mirror: false }], [43, { tpl: 13, rot: 180, mirror: true }],
  [14, { tpl: 14, rot: 0, mirror: false }], [15, { tpl: 14, rot: 0, mirror: false }],
  [24, { tpl: 14, rot: 0, mirror: true }], [25, { tpl: 14, rot: 0, mirror: true }],
  [34, { tpl: 14, rot: 180, mirror: false }], [35, { tpl: 14, rot: 180, mirror: false }],
  [44, { tpl: 14, rot: 180, mirror: true }], [45, { tpl: 14, rot: 180, mirror: true }],
  [16, { tpl: 16, rot: 0, mirror: false }], [17, { tpl: 16, rot: 0, mirror: false }], [18, { tpl: 16, rot: 0, mirror: false }],
  [26, { tpl: 16, rot: 0, mirror: true }], [27, { tpl: 16, rot: 0, mirror: true }], [28, { tpl: 16, rot: 0, mirror: true }],
  [36, { tpl: 16, rot: 180, mirror: false }], [37, { tpl: 16, rot: 180, mirror: false }], [38, { tpl: 16, rot: 180, mirror: false }],
  [46, { tpl: 16, rot: 180, mirror: true }], [47, { tpl: 16, rot: 180, mirror: true }], [48, { tpl: 16, rot: 180, mirror: true }],
]);

interface OdontogramaModulProps {
  selectedTeeth: number[];
  onSelectedTeethChange?: (next: number[]) => void;
  readOnly?: boolean;
}

type SectionKey = "estados" | "detalles" | "caries" | "obturaciones" | "raiz" | "periodonto";
type ToothRootState = "sana" | "pulpitis" | "resecado" | "pin";
type ToothBaseSelect = "none" | "tooth-base" | "milktooth" | "implant" | "tooth-crownprep" | "tooth-under-gum";
type ToothEndoSelect = "none" | "endo-medical-filling";
type ToothVisualState = { base: ToothBaseSelect; endo: ToothEndoSelect };
const SVG_TEXT_CACHE = new Map<string, string>();
const SWITCHABLE_GROUPS = ["mods", "tooth-variants", "endos", "surfaces", "restorations", "specials"] as const;

function setDataActiveById(svgRoot: SVGSVGElement, id: string, active: boolean) {
  const node = svgRoot.querySelector<SVGElement>(`#${id}`);
  if (!node) return;
  node.setAttribute("data-active", active ? "1" : "0");
}

function normalizeDisplayNoneToDataActive(svgRoot: SVGSVGElement) {
  svgRoot.querySelectorAll<SVGElement>("[style]").forEach((node) => {
    const style = node.getAttribute("style");
    if (!style || !style.includes("display: none")) return;
    node.setAttribute("style", style.replace(/display:\s*none;?/g, "").trim());
    node.setAttribute("data-active", "0");
  });
}

function ensureDataActiveForSwitchables(svgRoot: SVGSVGElement) {
  SWITCHABLE_GROUPS.forEach((groupId) => {
    const group = svgRoot.querySelector<SVGElement>(`#${groupId}`);
    if (!group) return;
    group.querySelectorAll<SVGElement>("[id]").forEach((node) => {
      if (!node.hasAttribute("data-active")) node.setAttribute("data-active", "0");
    });
  });
  for (const id of ["tooth-base", "tooth-healthy-pulp", "tooth-inflam-pulp", "milktooth-base", "milktooth-beauty", "milktooth-healthy-pulp", "milktooth-inflam-pulp"]) {
    const node = svgRoot.querySelector<SVGElement>(`#${id}`);
    if (node && !node.hasAttribute("data-active")) node.setAttribute("data-active", "0");
  }
}

function transformFor(conf: { rot: 0 | 180; mirror: boolean }) {
  return `rotate(${conf.rot}deg) scaleX(${conf.mirror ? "-1" : "1"})`;
}

function ToolButton({
  src,
  label,
  active,
  disabled,
  onClick,
}: {
  src: string;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded-2xl border bg-secondary/20 transition-colors",
        active && "border-primary bg-primary/15",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="relative h-9 w-9">
        <Image src={src} alt={label} fill sizes="36px" className="object-contain" />
      </div>
    </button>
  );
}

function InlineToothSvg({
  src,
  activeIds,
  hiddenIds,
  style,
}: {
  src: string;
  activeIds: string[];
  hiddenIds: string[];
  style: CSSProperties;
}) {
  const [svgText, setSvgText] = useState<string>(SVG_TEXT_CACHE.get(src) ?? "");

  useEffect(() => {
    let cancelled = false;
    if (SVG_TEXT_CACHE.has(src)) return;

    fetch(src)
      .then((res) => res.text())
      .then((text) => {
        if (cancelled) return;
        SVG_TEXT_CACHE.set(src, text);
        setSvgText(text);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [src]);

  const markup = useMemo(() => {
    if (!svgText) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return svgText;

    normalizeDisplayNoneToDataActive(svg);
    ensureDataActiveForSwitchables(svg);
    activeIds.forEach((id) => setDataActiveById(svg, id, true));
    hiddenIds.forEach((id) => setDataActiveById(svg, id, false));

    return svg.outerHTML;
  }, [activeIds, hiddenIds, svgText]);

  if (!markup) return null;

  return <div className="h-full w-full" style={style} dangerouslySetInnerHTML={{ __html: markup }} />;
}

function ToothTile({
  tooth,
  selected,
  readOnly,
  rootState,
  visualState,
  cariesSurfaces,
  onClick,
}: {
  tooth: number;
  selected: boolean;
  readOnly: boolean;
  rootState?: ToothRootState;
  visualState?: ToothVisualState;
  cariesSurfaces?: string[];
  onClick: (event: MouseEvent, tooth: number) => void;
}) {
  const conf = TOOTH_TEMPLATE.get(tooth);
  if (!conf) return null;

  const img = TEMPLATES[conf.tpl];
  const occl = TEMPLATES_OCCL[conf.tpl as 14 | 16];
  const style = { transform: transformFor(conf) };
  const currentVisual = visualState ?? { base: "tooth-base", endo: "none" };
  const currentCaries = cariesSurfaces ?? [];

  const idsToShow: string[] = [];
  const idsToHide: string[] = [];
  const mutuallyExclusiveBaseIds = [
    "tooth-base",
    "milktooth-base",
    "milktooth",
    "implant",
    "tooth-crownprep",
    "tooth-crownprep-inner",
    "tooth-crownprep-outer",
    "tooth-under-gum",
    "no-tooth-after-extraction",
  ];

  if (currentVisual.base === "none") {
    idsToShow.push("no-tooth-after-extraction");
  } else if (currentVisual.base === "tooth-base") {
    idsToShow.push("tooth-base");
  } else if (currentVisual.base === "milktooth") {
    idsToShow.push("milktooth", "milktooth-base");
  } else if (currentVisual.base === "implant") {
    idsToShow.push("implant");
  } else if (currentVisual.base === "tooth-crownprep") {
    idsToShow.push("tooth-crownprep", "tooth-crownprep-inner", "tooth-crownprep-outer");
  } else if (currentVisual.base === "tooth-under-gum") {
    idsToShow.push("tooth-under-gum");
  }

  if (currentVisual.endo === "endo-medical-filling") {
    idsToShow.push("endo-medical-filling");
  }

  const cariesMap: Record<string, string> = {
    mesial: "caries-mesial",
    distal: "caries-distal",
    bucal: "caries-buccal",
    "lingual/palatino": "caries-lingual",
    oclusal: "caries-occlusal",
  };

  Object.values(cariesMap).forEach((id) => idsToHide.push(id));
  currentCaries.forEach((surface) => {
    const cariesId = cariesMap[surface];
    if (cariesId) idsToShow.push(cariesId);
  });

  idsToHide.push("tooth-healthy-pulp", "tooth-inflam-pulp", "milktooth-healthy-pulp", "milktooth-inflam-pulp");
  if (rootState === "pulpitis") {
    idsToShow.push(currentVisual.base === "milktooth" ? "milktooth-inflam-pulp" : "tooth-inflam-pulp");
  } else {
    idsToShow.push(currentVisual.base === "milktooth" ? "milktooth-healthy-pulp" : "tooth-healthy-pulp");
  }

  mutuallyExclusiveBaseIds.forEach((id) => {
    if (!idsToShow.includes(id)) idsToHide.push(id);
  });

  return (
    <button
      type="button"
      onClick={(event) => onClick(event, tooth)}
      disabled={readOnly}
      className={cn(
        "relative h-[108px] rounded-2xl border border-border bg-card p-1 transition",
        selected && "border-primary ring-2 ring-primary/50"
      )}
    >
      {rootState === "pulpitis" && (
        <div className="pointer-events-none absolute inset-x-0 top-6 mx-auto h-9 w-2 rounded-full bg-destructive">
          <div className="absolute inset-0 -translate-x-1/2">
            <span className="absolute left-3 top-1 h-[1px] w-2 bg-foreground/70" />
            <span className="absolute left-3 top-3 h-[1px] w-2 bg-foreground/70" />
            <span className="absolute left-3 top-5 h-[1px] w-2 bg-foreground/70" />
          </div>
        </div>
      )}
      {occl && (
        <div className="absolute inset-x-0 top-1 mx-auto h-8 w-8">
          <InlineToothSvg src={occl} activeIds={idsToShow} hiddenIds={idsToHide} style={style} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-1 mx-auto h-16 w-10">
        <InlineToothSvg src={img} activeIds={idsToShow} hiddenIds={idsToHide} style={style} />
      </div>
    </button>
  );
}

export function OdontogramaModul({ selectedTeeth, onSelectedTeethChange, readOnly = false }: OdontogramaModulProps) {
  const [activeTooth, setActiveTooth] = useState<number | null>(selectedTeeth[0] ?? null);
  const [rootStateByTooth, setRootStateByTooth] = useState<Record<number, ToothRootState>>({});
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    estados: true,
    detalles: true,
    caries: true,
    obturaciones: true,
    raiz: true,
    periodonto: true,
  });
  const [activeTool, setActiveTool] = useState<"base" | "variante" | "restauracion" | "raiz" | "extraccion">("base");
  const [selectedCaries, setSelectedCaries] = useState<string[]>([]);
  const [visualStateByTooth, setVisualStateByTooth] = useState<Record<number, ToothVisualState>>({});
  const [cariesByTooth, setCariesByTooth] = useState<Record<number, string[]>>({});
  const selectedSet = useMemo(() => new Set(selectedTeeth), [selectedTeeth]);
  const activeVisualState = activeTooth ? visualStateByTooth[activeTooth] ?? { base: "tooth-base", endo: "none" } : { base: "tooth-base", endo: "none" };

  const toggleSection = (section: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleToothClick = (event: MouseEvent, tooth: number) => {
    if (readOnly || !onSelectedTeethChange) return;

    const isMulti = event.metaKey || event.ctrlKey;
    const next = isMulti
      ? selectedSet.has(tooth)
        ? selectedTeeth.filter((id) => id !== tooth)
        : [...selectedTeeth, tooth]
      : selectedSet.has(tooth) && selectedTeeth.length === 1
        ? []
        : [tooth];

    setActiveTooth(tooth);
    onSelectedTeethChange(next.sort((a, b) => a - b));
  };

  const updateRootState = (state: ToothRootState) => {
    if (!activeTooth) return;
    setRootStateByTooth((prev) => ({ ...prev, [activeTooth]: state }));
  };

  const updateBaseState = (base: ToothBaseSelect) => {
    if (!activeTooth) return;
    setVisualStateByTooth((prev) => ({
      ...prev,
      [activeTooth]: {
        base,
        endo: prev[activeTooth]?.endo ?? "none",
      },
    }));
  };

  const updateEndoState = (endo: ToothEndoSelect) => {
    if (!activeTooth) return;
    setVisualStateByTooth((prev) => ({
      ...prev,
      [activeTooth]: {
        base: prev[activeTooth]?.base ?? "tooth-base",
        endo,
      },
    }));
  };

  useEffect(() => {
    if (!activeTooth) return;
    setSelectedCaries(cariesByTooth[activeTooth] ?? []);
  }, [activeTooth, cariesByTooth]);

  const topRow = ALL_TEETH.slice(0, 16);
  const bottomRow = [...ALL_TEETH.slice(16)].reverse();

  return (
    <div className="rounded-3xl border border-border bg-muted/20">
      {!readOnly && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-3xl font-bold tracking-tight text-foreground">Carta dental</h3>
            <p className="text-sm text-muted-foreground">Haz clic en un diente. Para selección múltiple, usa CMD/CTRL + clic.</p>
          </div>
          <div className="flex gap-2">
            <ToolButton src={TEMPLATES[11]} label="base" active={activeTool === "base"} onClick={() => setActiveTool("base")} />
            <ToolButton src={TEMPLATES[13]} label="variante" active={activeTool === "variante"} onClick={() => setActiveTool("variante")} />
            <ToolButton src={TEMPLATES[14]} label="restauración" active={activeTool === "restauracion"} onClick={() => setActiveTool("restauracion")} />
            <ToolButton src={TEMPLATES[16]} label="raíz" active={activeTool === "raiz"} onClick={() => setActiveTool("raiz")} />
            <ToolButton src={TEMPLATES[16]} label="extracción" active={activeTool === "extraccion"} disabled onClick={() => setActiveTool("extraccion")} />
          </div>
        </div>
      )}

      <div className="grid gap-0 lg:grid-cols-[1fr_430px]">
        <div className="p-4">
          <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-2 text-center text-sm font-semibold text-muted-foreground">
            {topRow.map((tooth, idx) => <span key={`${tooth}-${idx}`}>{idx + 1}</span>)}
          </div>

          <div className="mt-2 grid grid-cols-8 gap-2 md:grid-cols-[repeat(16,minmax(0,1fr))]">
            {topRow.map((tooth) => (
              <ToothTile
                key={tooth}
                tooth={tooth}
                selected={selectedSet.has(tooth)}
                readOnly={readOnly}
                rootState={rootStateByTooth[tooth]}
                visualState={visualStateByTooth[tooth]}
                cariesSurfaces={cariesByTooth[tooth]}
                onClick={handleToothClick}
              />
            ))}
          </div>

          <div className="mt-2 grid grid-cols-8 gap-2 md:grid-cols-[repeat(16,minmax(0,1fr))]">
            {bottomRow.map((tooth) => (
              <ToothTile
                key={tooth}
                tooth={tooth}
                selected={selectedSet.has(tooth)}
                readOnly={readOnly}
                rootState={rootStateByTooth[tooth]}
                visualState={visualStateByTooth[tooth]}
                cariesSurfaces={cariesByTooth[tooth]}
                onClick={handleToothClick}
              />
            ))}
          </div>

          <div className="mt-2 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-2 text-center text-sm font-semibold text-muted-foreground">
            {bottomRow.map((tooth) => <span key={`label-${tooth}`}>{tooth}</span>)}
          </div>
        </div>

        {!readOnly && (
          <aside className="border-l border-border bg-muted/10 p-4">
            <div className="rounded-2xl border border-border bg-card/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-2xl font-bold text-foreground">Controles</h4>
                <button
                  type="button"
                  className="rounded-xl border border-destructive/40 px-4 py-1 text-destructive"
                  onClick={() => onSelectedTeethChange?.([])}
                >
                  Borrar selección
                </button>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                Diente activo: <span className="rounded-full bg-primary/15 px-2 py-1 font-semibold text-primary">{activeTooth ?? "-"}</span>
              </p>
              <div className="space-y-3">
                <section className="rounded-2xl border border-border bg-card/60 p-3">
                  <h5 className="text-lg font-bold">Base e endodoncia</h5>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">Base</span>
                      <select
                        id="toothSelect"
                        value={activeVisualState.base}
                        onChange={(event) => updateBaseState(event.target.value as ToothBaseSelect)}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                        disabled={!activeTooth}
                      >
                        <option value="none">Diente ausente</option>
                        <option value="tooth-base">Diente permanente</option>
                        <option value="milktooth">Diente primario</option>
                        <option value="implant">Implante</option>
                        <option value="tooth-crownprep">Preparado para corona</option>
                        <option value="tooth-under-gum">Diente subgingival</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">Endodoncia</span>
                      <select
                        id="endoSelect"
                        value={activeVisualState.endo}
                        onChange={(event) => updateEndoState(event.target.value as ToothEndoSelect)}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                        disabled={!activeTooth}
                      >
                        <option value="none">Raíz sana</option>
                        <option value="endo-medical-filling">Obturación radicular medicinal</option>
                      </select>
                    </div>
                  </div>
                </section>
                <section className="rounded-2xl border border-border bg-card/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h5 className="text-lg font-bold">Raíz</h5>
                    <button type="button" onClick={() => toggleSection("raiz")} className="rounded-full border border-border p-1">
                      {openSections.raiz ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>
                  {openSections.raiz && (
                    <>
                      <button type="button" className="flex w-full items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 text-left font-semibold" onClick={() => updateRootState("sana")}>
                        Raíz sana <ChevronDown className="h-4 w-4" />
                      </button>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[
                          { id: "pulpitis", label: "Pulpitis", state: "pulpitis" as ToothRootState },
                          { id: "resecado", label: "Diente resecado", state: "resecado" as ToothRootState },
                          { id: "pin", label: "Pin parapulpar", state: "pin" as ToothRootState },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={cn(
                              "rounded-full border px-3 py-1",
                              rootStateByTooth[activeTooth ?? -1] === item.state && "border-primary bg-primary/15 text-primary"
                            )}
                            onClick={() => updateRootState(item.state)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </section>
                <section className="rounded-2xl border border-border bg-card/60 p-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-lg font-bold">Caries</h5>
                    <button type="button" onClick={() => toggleSection("caries")} className="rounded-full border border-border p-1">
                      {openSections.caries ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>
                  {openSections.caries && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {["mesial", "distal", "bucal", "lingual/palatino", "oclusal"].map((surface) => (
                        <button
                          key={surface}
                          type="button"
                          onClick={() => {
                            if (!activeTooth) return;
                            setSelectedCaries((prev) => {
                              const next = prev.includes(surface) ? prev.filter((item) => item !== surface) : [...prev, surface];
                              setCariesByTooth((current) => ({ ...current, [activeTooth]: next }));
                              return next;
                            });
                          }}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-left",
                            selectedCaries.includes(surface) && "border-primary bg-primary/15 text-primary"
                          )}
                        >
                          {surface}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
                {[
                  { title: "Obturaciones y restauración", section: "obturaciones" as SectionKey },
                  { title: "Periodonto e inflamaciones", section: "periodonto" as SectionKey },
                ].map((item) => (
                  <section key={item.section} className="rounded-2xl border border-border bg-card/60 p-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-lg font-bold">{item.title}</h5>
                      <button type="button" onClick={() => toggleSection(item.section)} className="rounded-full border border-border p-1">
                        {openSections[item.section] ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                    </div>
                    {openSections[item.section] && (
                      <button type="button" className="mt-3 flex w-full items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 text-left font-semibold">
                        Ninguno <ChevronDown className="h-4 w-4" />
                      </button>
                    )}
                  </section>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
