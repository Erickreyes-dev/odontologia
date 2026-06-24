import type { DentitionType, NumberingSystem } from "./types";

const FDI_PERMANENT = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
] as const;

const FDI_TEMPORARY = [
  55, 54, 53, 52, 51,
  61, 62, 63, 64, 65,
  85, 84, 83, 82, 81,
  71, 72, 73, 74, 75,
] as const;

const FDI_PERMANENT_SET = new Set<number>(FDI_PERMANENT);
const FDI_TEMPORARY_SET = new Set<number>(FDI_TEMPORARY);

const permanentUniversalMap = new Map<number, number>(
  FDI_PERMANENT.map((id, index) => [id, index + 1])
);

const temporaryUniversalMap = new Map<number, string>(
  FDI_TEMPORARY.map((id, index) => [id, String.fromCharCode(65 + index)])
);

const PALMER_SYMBOLS = {
  upperRight: "┘",
  upperLeft: "└",
  lowerRight: "┐",
  lowerLeft: "┌",
};

export const PERMANENT_TEETH = [...FDI_PERMANENT];
export const TEMPORARY_TEETH = [...FDI_TEMPORARY];

export function inferDentitionById(toothId: number): DentitionType {
  if (FDI_PERMANENT_SET.has(toothId)) return "permanent";
  if (FDI_TEMPORARY_SET.has(toothId)) return "temporary";
  return toothId >= 50 ? "temporary" : "permanent";
}

export function getToothLabel(toothId: number, system: NumberingSystem): string {
  if (system === "FDI") return String(toothId);

  const dentition = inferDentitionById(toothId);
  if (system === "UNIVERSAL") {
    if (dentition === "temporary") {
      return temporaryUniversalMap.get(toothId) ?? String(toothId);
    }
    return String(permanentUniversalMap.get(toothId) ?? toothId);
  }

  return getPalmerLabel(toothId, dentition);
}

export function getPalmerLabel(toothId: number, dentition: DentitionType): string {
  const secondDigit = toothId % 10;
  const firstDigit = Math.floor(toothId / 10);

  const isUpper = [1, 2, 5, 6].includes(firstDigit);
  const isRight = [1, 4, 5, 8].includes(firstDigit);

  const symbol = isUpper
    ? isRight
      ? PALMER_SYMBOLS.upperRight
      : PALMER_SYMBOLS.upperLeft
    : isRight
      ? PALMER_SYMBOLS.lowerRight
      : PALMER_SYMBOLS.lowerLeft;

  const index = dentition === "temporary" ? secondDigit : secondDigit;
  return `${index}${symbol}`;
}
