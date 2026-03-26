export type TourStep = {
  selector: string;
  title: string;
  description: string;
};

export type RouteTourConfig = {
  key: string;
  title: string;
  description: string;
  steps: TourStep[];
};

const defaultSteps: TourStep[] = [
  {
    selector: "[data-tour='workspace-label']",
    title: "Identidad de clínica y suscripción",
    description:
      "Confirma la clínica activa, el paquete contratado y los días de prueba. Este dato define límites como cantidad de usuarios.",
  },
  {
    selector: "[data-tour='sidebar-trigger']",
    title: "Control del panel lateral",
    description:
      "Abre o colapsa el menú lateral para priorizar lectura de tablas/formularios sin perder acceso rápido a módulos clave.",
  },
  {
    selector: "[data-tour='sidebar']",
    title: "Mapa completo de navegación",
    description:
      "Desde este panel cambias entre módulos clínicos, administrativos y financieros. Mantén este flujo para no perder contexto del paciente.",
  },
  {
    selector: "[data-tour='main-menu']",
    title: "Módulos operativos diarios",
    description:
      "Aquí vive el flujo principal del día: agenda, pacientes, cotizaciones, planes y cobros. Navega en ese orden para reducir retrabajos.",
  },
  {
    selector: "[data-tour='maintenance-group']",
    title: "Mantenimiento y seguridad",
    description:
      "Gestiona roles, permisos, usuarios y catálogos. Usa este bloque para controlar accesos y mantener datos consistentes.",
  },
  {
    selector: "[data-tour='main-content']",
    title: "Área de trabajo",
    description:
      "Esta sección cambia según la pantalla. Revisa primero filtros, luego listado y finalmente acciones de crear/editar para evitar errores.",
  },
];

function moduleSteps(moduleName: string, purpose: string, nextAction: string): TourStep[] {
  return [
    {
      selector: "[data-tour='workspace-label']",
      title: `Contexto antes de usar ${moduleName}`,
      description:
        `Verifica clínica activa, paquete y prueba disponible antes de operar ${moduleName}. Así validas límites funcionales y de acceso.`,
    },
    {
      selector: "[data-tour='main-content']",
      title: `¿Para qué sirve ${moduleName}?`,
      description: purpose,
    },
    {
      selector: "[data-tour='main-content']",
      title: `Cómo trabajar ${moduleName} por segmentos`,
      description:
        "1) Usa filtros/buscador. 2) Revisa resultados y estado. 3) Ejecuta crear/editar solo tras validar datos clave del registro.",
    },
    {
      selector: "[data-tour='main-menu']",
      title: `Integración de ${moduleName} con otros módulos`,
      description:
        `Este módulo no es aislado: confirma qué proceso alimenta o continúa después para mantener trazabilidad clínica y administrativa.`,
    },
    {
      selector: "[data-tour='sidebar']",
      title: `Cómo continuar desde ${moduleName}`,
      description: nextAction,
    },
    {
      selector: "[data-tour='maintenance-group']",
      title: `Control de acceso relacionado con ${moduleName}`,
      description:
        "Si un usuario no ve acciones, revisa su rol/permisos en Mantenimiento. Evita otorgar permisos globales sin necesidad.",
    },
    {
      selector: "[data-tour='sidebar-trigger']",
      title: `Tip de productividad en ${moduleName}`,
      description:
        `Colapsa o expande el menú lateral mientras trabajas en ${moduleName} para ganar espacio sin perder acceso rápido a otros módulos.`,
    },
  ];
}

export const APP_TOUR_ROUTES: RouteTourConfig[] = [
  {
    key: "/dashboard",
    title: "Dashboard",
    description: "Resumen general con indicadores clave para tomar decisiones rápidas del día.",
    steps: moduleSteps(
      "el Dashboard",
      "Aquí visualizas métricas clave del día para identificar citas, ingresos y pendientes operativos en un solo lugar.",
      "Desde el menú lateral navega al módulo que necesite atención inmediata según los indicadores que estés viendo.",
    ),
  },
  {
    key: "/dashboard-admin",
    title: "Dashboard Admin",
    description:
      "Panel de control para la plataforma: gestión de tenants, administradores y estado operativo.",
    steps: moduleSteps(
      "el Dashboard Admin",
      "Este panel sirve para supervisar tenants, administradores y estado general de la plataforma.",
      "Después de revisar el estado, entra al módulo administrativo correspondiente para realizar ajustes puntuales.",
    ),
  },
  {
    key: "/citas",
    title: "Citas",
    description:
      "Organiza la agenda clínica, crea citas y controla el flujo de atención con enfoque en puntualidad.",
    steps: moduleSteps(
      "Citas",
      "En esta pantalla organizas la agenda, creas nuevas citas y validas disponibilidad para mantener la puntualidad clínica.",
      "Tras registrar o mover una cita, pasa a Pacientes o Consulta para continuar con la atención del caso.",
    ),
  },
  {
    key: "/pacientes",
    title: "Pacientes",
    description:
      "Gestiona expedientes y datos demográficos para tener continuidad clínica en cada consulta.",
    steps: moduleSteps(
      "Pacientes",
      "Aquí gestionas expedientes clínicos y datos de contacto para dar seguimiento completo a cada persona atendida.",
      "Cuando ubiques al paciente, continúa hacia cotizaciones, planes o pagos según la etapa de su tratamiento.",
    ),
  },
  {
    key: "/medicos",
    title: "Médicos",
    description: "Administra el personal médico y su información profesional para la operación diaria.",
    steps: moduleSteps(
      "Médicos",
      "Esta sección centraliza la información del personal médico para asignaciones y control operativo.",
      "Después de actualizar un médico, vuelve a Citas para reflejar la disponibilidad correcta en la agenda.",
    ),
  },
  {
    key: "/servicios",
    title: "Servicios",
    description: "Configura procedimientos y costos base para estandarizar presupuestos y cobros.",
    steps: moduleSteps(
      "Servicios",
      "Desde aquí defines procedimientos y costos base para construir presupuestos consistentes.",
      "Con los servicios listos, crea cotizaciones con importes más precisos y estandarizados.",
    ),
  },
  {
    key: "/cotizaciones",
    title: "Cotizaciones",
    description: "Prepara propuestas de tratamiento claras para mejorar conversión y seguimiento comercial.",
    steps: moduleSteps(
      "Cotizaciones",
      "En esta pantalla elaboras propuestas de tratamiento con montos claros para facilitar aprobación del paciente.",
      "Luego de enviar o aceptar una cotización, continúa con pagos u órdenes de cobro para ejecutar el proceso financiero.",
    ),
  },
  {
    key: "/planes-tratamiento",
    title: "Planes de tratamiento",
    description: "Diseña planes por etapas y valida objetivos clínicos antes de ejecutar procedimientos.",
    steps: moduleSteps(
      "Planes de tratamiento",
      "Aquí estructuras el tratamiento por etapas para mantener trazabilidad clínica y objetivos por sesión.",
      "Una vez definido el plan, coordina citas y seguimiento del paciente desde los módulos relacionados.",
    ),
  },
  {
    key: "/pagos",
    title: "Pagos",
    description: "Registra pagos y financiamientos para mantener trazabilidad financiera por paciente.",
    steps: moduleSteps(
      "Pagos",
      "Esta vista permite registrar abonos y financiamientos para mantener el historial financiero actualizado.",
      "Al terminar, revisa órdenes de cobro o perfil del paciente para confirmar saldos y próximos vencimientos.",
    ),
  },
  {
    key: "/ordenes-cobro",
    title: "Órdenes de cobro",
    description: "Emite y controla cobros pendientes para sostener el flujo de caja de la clínica.",
    steps: moduleSteps(
      "Órdenes de cobro",
      "Aquí controlas montos pendientes y fechas de cobro para sostener el flujo de caja.",
      "Después de crear una orden, da seguimiento en Pagos para registrar la recuperación del saldo.",
    ),
  },
  {
    key: "/inventario",
    title: "Inventario",
    description:
      "Monitorea insumos críticos y evita quiebres de stock durante procedimientos clínicos.",
    steps: moduleSteps(
      "Inventario",
      "En este módulo monitoreas insumos y stock disponible para evitar faltantes en procedimientos.",
      "Tras actualizar existencias, valida servicios o planificación clínica para anticipar necesidades.",
    ),
  },
  {
    key: "/consultorios",
    title: "Consultorios",
    description: "Gestiona espacios de atención y su disponibilidad para una agenda ordenada.",
    steps: moduleSteps(
      "Consultorios",
      "Aquí administras espacios físicos de atención y su disponibilidad en la operación diaria.",
      "Con los consultorios configurados, continúa en Citas para asignar correctamente cada atención.",
    ),
  },
  {
    key: "/seguros",
    title: "Seguros",
    description: "Administra aseguradoras y condiciones para facturación correcta por cobertura.",
    steps: moduleSteps(
      "Seguros",
      "Esta sección se usa para configurar aseguradoras y condiciones de cobertura por paciente.",
      "Luego revisa cotizaciones o cobros para aplicar correctamente reglas de facturación por seguro.",
    ),
  },
  {
    key: "/roles",
    title: "Roles",
    description: "Define perfiles de acceso para mantener seguridad y separación de funciones.",
    steps: moduleSteps(
      "Roles",
      "Aquí defines perfiles de acceso para ordenar responsabilidades dentro del sistema.",
      "Después de crear un rol, asigna permisos y usuarios para que el perfil quede operativo.",
    ),
  },
  {
    key: "/permisos",
    title: "Permisos",
    description: "Configura permisos granulares para controlar qué puede ver o editar cada usuario.",
    steps: moduleSteps(
      "Permisos",
      "En esta pantalla estableces acciones permitidas para proteger información sensible.",
      "Al finalizar, valida los permisos desde Roles o Usuarios para verificar que el acceso funcione como esperas.",
    ),
  },
  {
    key: "/usuarios",
    title: "Usuarios",
    description: "Crea y administra cuentas del sistema para el equipo administrativo y clínico.",
    steps: moduleSteps(
      "Usuarios",
      "Aquí gestionas cuentas del sistema para el equipo clínico y administrativo.",
      "Cuando crees o edites un usuario, confirma su rol y permisos para evitar bloqueos operativos.",
    ),
  },
  {
    key: "/empleados",
    title: "Empleados",
    description: "Centraliza información del personal para coordinación interna y trazabilidad operativa.",
    steps: moduleSteps(
      "Empleados",
      "Esta vista concentra datos del personal para una coordinación interna más ordenada.",
      "Después de actualizar empleados, revisa puestos y profesiones para mantener la estructura del equipo.",
    ),
  },
  {
    key: "/puestos",
    title: "Puestos",
    description: "Estandariza cargos y responsabilidades para una operación clara y escalable.",
    steps: moduleSteps(
      "Puestos",
      "Aquí defines los cargos del equipo para clarificar responsabilidades.",
      "Al terminar, relaciona cada puesto con empleados y permisos según su función.",
    ),
  },
  {
    key: "/profesiones",
    title: "Profesiones",
    description: "Clasifica especialidades del equipo para búsquedas y asignaciones más precisas.",
    steps: moduleSteps(
      "Profesiones",
      "En este módulo clasificas especialidades para búsquedas y asignaciones más precisas.",
      "Con la profesión registrada, úsala al crear o editar empleados y médicos.",
    ),
  },
  {
    key: "default",
    title: "Recorrido de pantalla",
    description:
      "Explora esta vista usando el menú lateral y las acciones del contenido central para completar tus tareas.",
    steps: defaultSteps,
  },
];

export function getTourByPath(pathname: string): RouteTourConfig {
  return APP_TOUR_ROUTES.find((item) => item.key !== "default" && pathname.startsWith(item.key)) ??
    APP_TOUR_ROUTES.find((item) => item.key === "default")!;
}
