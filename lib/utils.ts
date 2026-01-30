
import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

// -------------------- CLASSES --------------------
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// -------------------- CURRENCY --------------------
export const formatLempiras = (amount: number) =>
  new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL", minimumFractionDigits: 2 }).format(amount);

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(amount);

// -------------------- DATE & TIME --------------------
export const formatearFecha = (fecha?: string | null): string => {
  if (!fecha) return "N/A";
  try {
    return format(new Date(fecha), "dd 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return "Fecha inválida";
  }
};

export const normalizeDate = (value?: Date | string | null): Date | null => {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
};

export const parseTimeToTodayDate = (time: string): Date => {
  const [hours, minutes, seconds = "0"] = time.split(":");
  const now = new Date();
  now.setHours(Number(hours), Number(minutes), Number(seconds), 0);
  return now;
};

export const formatDate = (date: Date) =>
  date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

/**
 * Formatea una fecha de forma segura para SSR/hidratación: usa los componentes
 * UTC del día para que servidor y cliente muestren el mismo texto (evita
 * diferencias por zona horaria).
 */
export function formatDateSafe(date: Date | string | undefined | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  return format(new Date(y, m, day), "PPP", { locale: es });
}

export const calcularEdad = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

export const calculateServiceDuration = (startDate: Date) => {
  const today = new Date();
  let years = today.getFullYear() - startDate.getFullYear();
  let months = today.getMonth() - startDate.getMonth();
  let days = today.getDate() - startDate.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const isBetweenInclusive = (date: Date, start: Date, end?: Date | null) => {
  const t = startOfDay(date).getTime();
  const s = startOfDay(start).getTime();
  const e = end ? startOfDay(end).getTime() : s;
  return t >= s && t <= e;
};

export const formatTimeRange = (start?: Date | null, end?: Date | null, todoDia?: boolean): string => {
  if (todoDia) return "Todo el día";
  if (!start) return "-";
  const s = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const e = end ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  return e ? `${s} - ${e}` : s;
};

// -------------------- EMPLOYEES --------------------
export const getEmployeeStatus = (isActive: boolean): { label: string; variant: "default" | "secondary" | "destructive" } =>
  isActive ? { label: "Activo", variant: "default" } : { label: "Inactivo", variant: "secondary" };


export const calcularEdadColumns = (birthDate: Date): number => {
  const today = new Date();

  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();

  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  let age = todayYear - birthYear;

  // Si no ha cumplido aún este año, restamos 1
  if (
    todayMonth < birthMonth ||
    (todayMonth === birthMonth && todayDay < birthDay)
  ) {
    age--;
  }

  return age;
};
