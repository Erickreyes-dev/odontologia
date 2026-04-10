export const SUPPORTED_LOCALES = ["es", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export type TranslationDictionary = Record<string, string>;

export const translations: Record<Locale, TranslationDictionary> = {
  es: {
    "language.label": "Idioma",
    "language.es": "Español",
    "language.en": "Inglés",

    "sidebar.workspaceDefault": "Sistema Autogestión MP",
    "sidebar.maintenance": "Mantenimiento",
    "sidebar.dashboard": "Dashboard",
    "sidebar.dashboardAdmin": "Dashboard Admin",
    "sidebar.tenants": "Tenants",
    "sidebar.packages": "Paquetes",
    "sidebar.insurance": "Seguros",
    "sidebar.patients": "Pacientes",
    "sidebar.doctors": "Médicos",
    "sidebar.services": "Servicios",
    "sidebar.promotions": "Promociones",
    "sidebar.inventory": "Inventario",
    "sidebar.offices": "Consultorios",
    "sidebar.appointments": "Citas",
    "sidebar.quotes": "Cotizaciones",
    "sidebar.treatmentPlans": "Planes de Tratamiento",
    "sidebar.payments": "Pagos",
    "sidebar.paymentOrders": "Órdenes de Cobro",
    "sidebar.generalMedicine": "Medicina General",
    "sidebar.myClinic": "Mi Clínica",
    "sidebar.roles": "Roles",
    "sidebar.permissions": "Permisos",
    "sidebar.users": "Usuarios",
    "sidebar.employees": "Empleados",
    "sidebar.positions": "Puestos",
    "sidebar.professions": "Profesiones",
    "sidebar.billing": "Facturación",

    "nav.profile": "Perfil",
    "nav.logout": "Cerrar sesión",

    "layout.currentPackage": "Paquete actual:",
    "layout.subscription": "Suscripción",
    "layout.trialTime": "Tiempo de prueba:",
    "layout.remainingDays": "día(s) restantes",
    "layout.subscriptionRequired": "Suscripción requerida",
    "layout.subscriptionMessage": "Tu paquete está {status}. Para usar este módulo debes activar o renovar la suscripción.",
    "layout.currentModule": "Módulo actual:",
    "layout.unknownModule": "desconocido",
    "layout.goBilling": "Ir a facturación",
    "layout.noPackage": "Sin paquete",
  },
  en: {
    "language.label": "Language",
    "language.es": "Spanish",
    "language.en": "English",

    "sidebar.workspaceDefault": "MP Self-Management System",
    "sidebar.maintenance": "Maintenance",
    "sidebar.dashboard": "Dashboard",
    "sidebar.dashboardAdmin": "Admin Dashboard",
    "sidebar.tenants": "Tenants",
    "sidebar.packages": "Packages",
    "sidebar.insurance": "Insurance",
    "sidebar.patients": "Patients",
    "sidebar.doctors": "Doctors",
    "sidebar.services": "Services",
    "sidebar.promotions": "Promotions",
    "sidebar.inventory": "Inventory",
    "sidebar.offices": "Consulting Rooms",
    "sidebar.appointments": "Appointments",
    "sidebar.quotes": "Quotes",
    "sidebar.treatmentPlans": "Treatment Plans",
    "sidebar.payments": "Payments",
    "sidebar.paymentOrders": "Payment Orders",
    "sidebar.generalMedicine": "General Medicine",
    "sidebar.myClinic": "My Clinic",
    "sidebar.roles": "Roles",
    "sidebar.permissions": "Permissions",
    "sidebar.users": "Users",
    "sidebar.employees": "Employees",
    "sidebar.positions": "Positions",
    "sidebar.professions": "Professions",
    "sidebar.billing": "Billing",

    "nav.profile": "Profile",
    "nav.logout": "Sign out",

    "layout.currentPackage": "Current package:",
    "layout.subscription": "Subscription",
    "layout.trialTime": "Trial time:",
    "layout.remainingDays": "day(s) left",
    "layout.subscriptionRequired": "Subscription required",
    "layout.subscriptionMessage": "Your package is {status}. To use this module, you must activate or renew your subscription.",
    "layout.currentModule": "Current module:",
    "layout.unknownModule": "unknown",
    "layout.goBilling": "Go to billing",
    "layout.noPackage": "No package",
  },
};

export function isValidLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as Locale));
}

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const source = translations[locale][key] ?? translations[DEFAULT_LOCALE][key] ?? key;

  if (!vars) return source;

  return Object.entries(vars).reduce(
    (acc, [token, value]) => acc.replaceAll(`{${token}}`, String(value)),
    source,
  );
}
