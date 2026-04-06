import type { Locale } from "./translations";

const phraseEsToEn: Record<string, string> = {
  "Iniciar sesión": "Sign in",
  "Cerrar sesión": "Sign out",
  "Guardar": "Save",
  "Cancelar": "Cancel",
  "Eliminar": "Delete",
  "Editar": "Edit",
  "Actualizar": "Update",
  "Crear": "Create",
  "Buscar": "Search",
  "Filtrar": "Filter",
  "Limpiar": "Clear",
  "Acciones": "Actions",
  "Estado": "Status",
  "Activo": "Active",
  "Inactivo": "Inactive",
  "Nombre": "Name",
  "Descripción": "Description",
  "Fecha": "Date",
  "Total": "Total",
  "Volver": "Back",
  "Siguiente": "Next",
  "Anterior": "Previous",
  "Enviar": "Submit",
  "Perfil": "Profile",
  "Correo": "Email",
  "Teléfono": "Phone",
  "Usuario": "User",
  "Contraseña": "Password",
  "Confirmar contraseña": "Confirm password",
  "Seleccionar": "Select",
  "Sí": "Yes",
  "No": "No",
};

const wordEsToEn: Record<string, string> = {
  abrir: "open",
  actualizar: "update",
  ahora: "now",
  año: "year",
  años: "years",
  agregar: "add",
  agenda: "agenda",
  agendar: "schedule",
  alerta: "alert",
  alto: "high",
  aprobar: "approve",
  archivo: "file",
  asistencia: "attendance",
  atras: "back",
  atrás: "back",
  auxiliar: "assistant",
  bienvenida: "welcome",
  buscar: "search",
  cancelar: "cancel",
  cargando: "loading",
  cita: "appointment",
  citas: "appointments",
  clínica: "clinic",
  clinica: "clinic",
  clínicas: "clinics",
  codigo: "code",
  código: "code",
  completar: "complete",
  configuración: "settings",
  configuracion: "settings",
  confirmar: "confirm",
  consultorio: "office",
  consultorios: "offices",
  contacto: "contact",
  contenido: "content",
  correo: "email",
  crear: "create",
  crédito: "credit",
  dashboard: "dashboard",
  datos: "data",
  detalle: "detail",
  detalles: "details",
  disponible: "available",
  documento: "document",
  editar: "edit",
  empleado: "employee",
  empleados: "employees",
  empresa: "company",
  en: "in",
  eliminar: "delete",
  enviar: "send",
  error: "error",
  estado: "status",
  factura: "invoice",
  facturación: "billing",
  facturacion: "billing",
  fecha: "date",
  finalizar: "finish",
  guardar: "save",
  historial: "history",
  hoy: "today",
  horas: "hours",
  idioma: "language",
  importe: "amount",
  información: "information",
  informacion: "information",
  iniciar: "start",
  ingreso: "entry",
  inventario: "inventory",
  lista: "list",
  mantenimiento: "maintenance",
  médico: "doctor",
  medicos: "doctors",
  médicos: "doctors",
  mes: "month",
  módulos: "modules",
  modulo: "module",
  módulo: "module",
  nombre: "name",
  notas: "notes",
  nuevo: "new",
  obligatorios: "required",
  observación: "notes",
  observaciones: "notes",
  orden: "order",
  órdenes: "orders",
  ordenes: "orders",
  paquete: "package",
  paquetes: "packages",
  pago: "payment",
  pagos: "payments",
  paciente: "patient",
  pacientes: "patients",
  perfil: "profile",
  permiso: "permission",
  permisos: "permissions",
  plan: "plan",
  planes: "plans",
  por: "by",
  precio: "price",
  profesión: "profession",
  profesiones: "professions",
  promoción: "promotion",
  promociones: "promotions",
  puesto: "position",
  puestos: "positions",
  rápido: "quick",
  recientes: "recent",
  registro: "registration",
  requerido: "required",
  requerida: "required",
  reiniciar: "reset",
  reporte: "report",
  reportes: "reports",
  resultados: "results",
  rol: "role",
  roles: "roles",
  salir: "logout",
  salud: "health",
  seguro: "insurance",
  seguros: "insurance",
  selección: "selection",
  seleccionar: "select",
  servicio: "service",
  servicios: "services",
  sesión: "session",
  sesion: "session",
  sistema: "system",
  suscripción: "subscription",
  suscripcion: "subscription",
  tenant: "tenant",
  tiempo: "time",
  total: "total",
  tratamiento: "treatment",
  tratamientos: "treatments",
  usuario: "user",
  usuarios: "users",
  ver: "view",
  vigente: "active",
};

const phraseEnToEs = Object.fromEntries(Object.entries(phraseEsToEn).map(([es, en]) => [en, es]));
const wordEnToEs = Object.fromEntries(Object.entries(wordEsToEn).map(([es, en]) => [en, es]));

function preserveCase(source: string, target: string) {
  if (!source) return target;
  if (source === source.toUpperCase()) return target.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target;
}

function translateToken(token: string, direction: "es-en" | "en-es") {
  const normalized = token.toLowerCase();
  const map = direction === "es-en" ? wordEsToEn : wordEnToEs;
  const translated = map[normalized];
  if (!translated) return token;
  return preserveCase(token, translated);
}

function translateByWord(input: string, direction: "es-en" | "en-es") {
  return input
    .split(/([^\p{L}\p{N}]+)/u)
    .map((part) => (/^[\p{L}\p{N}]+$/u.test(part) ? translateToken(part, direction) : part))
    .join("");
}

export function autoTranslateText(text: string, locale: Locale): string {
  if (!text.trim()) return text;

  const direction = locale === "en" ? "es-en" : "en-es";
  const phraseMap = direction === "es-en" ? phraseEsToEn : phraseEnToEs;
  const direct = phraseMap[text.trim()];

  if (direct) {
    const leading = text.match(/^\s*/)?.[0] ?? "";
    const trailing = text.match(/\s*$/)?.[0] ?? "";
    return `${leading}${direct}${trailing}`;
  }

  return translateByWord(text, direction);
}
