const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function normalizePhoneForWhatsApp(input?: string | null): string | null {
  if (!input) return null;
  const raw = input.replace(/[\s\-().]/g, "");
  if (!raw) return null;

  const withPlus = raw.startsWith("+") ? raw : `+${raw}`;
  return E164_REGEX.test(withPlus) ? withPlus : null;
}

export function isValidInternationalPhone(input?: string | null): boolean {
  if (!input) return true;
  return normalizePhoneForWhatsApp(input) !== null;
}
