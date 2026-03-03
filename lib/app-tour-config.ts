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
    selector: "[data-tour='sidebar-trigger']",
    title: "Menú lateral",
    description: "Abre o colapsa el menú para ganar espacio y enfocarte en la tarea del módulo.",
  },
  {
    selector: "[data-tour='sidebar']",
    title: "Navegación principal",
    description:
      "Desde aquí puedes cambiar entre módulos clínicos, administrativos y financieros sin perder contexto.",
  },
  {
    selector: "[data-tour='main-content']",
    title: "Área de trabajo",
    description:
      "Esta sección cambia según la pantalla. Aquí verás tablas, formularios, filtros y acciones rápidas.",
  },
];

export const APP_TOUR_ROUTES: RouteTourConfig[] = [
  {
    key: "/dashboard",
    title: "Dashboard",
    description: "Resumen general con indicadores clave para tomar decisiones rápidas del día.",
    steps: defaultSteps,
  },
  {
    key: "/dashboard-admin",
    title: "Dashboard Admin",
    description:
      "Panel de control para la plataforma: gestión de tenants, administradores y estado operativo.",
    steps: defaultSteps,
  },
  {
    key: "/citas",
    title: "Citas",
    description:
      "Organiza la agenda clínica, crea citas y controla el flujo de atención con enfoque en puntualidad.",
    steps: defaultSteps,
  },
  {
    key: "/pacientes",
    title: "Pacientes",
    description:
      "Gestiona expedientes y datos demográficos para tener continuidad clínica en cada consulta.",
    steps: defaultSteps,
  },
  {
    key: "/medicos",
    title: "Médicos",
    description: "Administra el personal médico y su información profesional para la operación diaria.",
    steps: defaultSteps,
  },
  {
    key: "/servicios",
    title: "Servicios",
    description: "Configura procedimientos y costos base para estandarizar presupuestos y cobros.",
    steps: defaultSteps,
  },
  {
    key: "/cotizaciones",
    title: "Cotizaciones",
    description: "Prepara propuestas de tratamiento claras para mejorar conversión y seguimiento comercial.",
    steps: defaultSteps,
  },
  {
    key: "/planes-tratamiento",
    title: "Planes de tratamiento",
    description: "Diseña planes por etapas y valida objetivos clínicos antes de ejecutar procedimientos.",
    steps: defaultSteps,
  },
  {
    key: "/pagos",
    title: "Pagos",
    description: "Registra pagos y financiamientos para mantener trazabilidad financiera por paciente.",
    steps: defaultSteps,
  },
  {
    key: "/ordenes-cobro",
    title: "Órdenes de cobro",
    description: "Emite y controla cobros pendientes para sostener el flujo de caja de la clínica.",
    steps: defaultSteps,
  },
  {
    key: "/inventario",
    title: "Inventario",
    description:
      "Monitorea insumos críticos y evita quiebres de stock durante procedimientos clínicos.",
    steps: defaultSteps,
  },
  {
    key: "/consultorios",
    title: "Consultorios",
    description: "Gestiona espacios de atención y su disponibilidad para una agenda ordenada.",
    steps: defaultSteps,
  },
  {
    key: "/seguros",
    title: "Seguros",
    description: "Administra aseguradoras y condiciones para facturación correcta por cobertura.",
    steps: defaultSteps,
  },
  {
    key: "/roles",
    title: "Roles",
    description: "Define perfiles de acceso para mantener seguridad y separación de funciones.",
    steps: defaultSteps,
  },
  {
    key: "/permisos",
    title: "Permisos",
    description: "Configura permisos granulares para controlar qué puede ver o editar cada usuario.",
    steps: defaultSteps,
  },
  {
    key: "/usuarios",
    title: "Usuarios",
    description: "Crea y administra cuentas del sistema para el equipo administrativo y clínico.",
    steps: defaultSteps,
  },
  {
    key: "/empleados",
    title: "Empleados",
    description: "Centraliza información del personal para coordinación interna y trazabilidad operativa.",
    steps: defaultSteps,
  },
  {
    key: "/puestos",
    title: "Puestos",
    description: "Estandariza cargos y responsabilidades para una operación clara y escalable.",
    steps: defaultSteps,
  },
  {
    key: "/profesiones",
    title: "Profesiones",
    description: "Clasifica especialidades del equipo para búsquedas y asignaciones más precisas.",
    steps: defaultSteps,
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
