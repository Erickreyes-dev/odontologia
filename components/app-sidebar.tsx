import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantLogoBase64 } from "@/lib/tenant-branding";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {  Boxes, Building2, Calendar, ChevronDown, ChevronUp, CreditCard, DollarSign, File,  Hospital, IdCardIcon, LayersIcon, LayoutDashboard, MessageCircle, Package, Receipt, Settings, ShieldPlus, Stethoscope, Tags, UserIcon, UserRoundCheck, Users2, UsersIcon } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";
import { NavUser } from "./nav-user";
import { ModeToggle } from "./buton-theme";
import { getServerTranslator } from "@/lib/i18n/settings";

// Menú de mantenimiento
const mantenimientoItems = [
  {
    titleKey: "sidebar.roles",
    url: "/roles",
    icon: LayersIcon,
    permiso: "ver_roles",
  },
  {
    titleKey: "sidebar.permissions",
    url: "/permisos",
    icon: LayersIcon,
    permiso: "ver_permisos",
  },
  {
    titleKey: "sidebar.users",
    url: "/usuarios",
    icon: UserIcon,
    permiso: "ver_usuarios",
  },
  {
    titleKey: "sidebar.employees",
    url: "/empleados",
    icon: UsersIcon,
    permiso: "ver_empleados",
  },
  {
    titleKey: "sidebar.positions",
    url: "/puestos",
    icon: UserRoundCheck,
    permiso: "ver_puestos",
  },
  {
    titleKey: "sidebar.professions",
    url: "/profesiones",
    icon: IdCardIcon,
    permiso: "ver_profesiones",
  },
  {
    titleKey: "sidebar.billing",
    url: "/billing",
    icon: CreditCard,
    permiso: "ver_pagos",
  },


];




// Menu items con permisos necesarios (sin los items de mantenimiento)
const items = [
  {
    titleKey: "sidebar.dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    permiso: "ver_pagos",
  },
  {
    titleKey: "sidebar.dashboardAdmin",
    url: "/dashboard-admin",
    icon: ShieldPlus,
    permiso: "ver_dashboard_admin",
  },
  {
    titleKey: "sidebar.tenants",
    url: "/tenants",
    icon: ShieldPlus,
    permiso: "ver_tenants",
  },
  {
    titleKey: "sidebar.packages",
    url: "/paquetes",
    icon: Package,
    permiso: "ver_paquetes",
  },

  {
    titleKey: "sidebar.insurance",
    url: "/seguros",
    icon: ShieldPlus,
    permiso: "ver_seguros",
  },

  {
    titleKey: "sidebar.patients",
    url: "/pacientes",
    icon: Users2,
    permiso: "ver_pacientes",
  },
  {
    titleKey: "sidebar.doctors",
    url: "/medicos",
    icon: Stethoscope,
    permiso: "ver_medicos",
  },
  {
    titleKey: "sidebar.services",
    url: "/servicios",
    icon: Package,
    permiso: "ver_servicios",
  },
  {
    titleKey: "sidebar.promotions",
    url: "/promociones",
    icon: Tags,
    permiso: "ver_promociones",
  },
  {
    titleKey: "sidebar.inventory",
    url: "/inventario",
    icon: Boxes,
    permiso: "ver_inventario",
  },
  {
    titleKey: "sidebar.offices",
    url: "/consultorios",
    icon: Hospital,
    permiso: "ver_consultorios",
  },
  {
    titleKey: "sidebar.appointments",
    url: "/citas",
    icon: Calendar,
    permiso: "ver_citas",
  },
  {
    titleKey: "WhatsApp",
    url: "/whatsapp",
    icon: MessageCircle,
    permiso: "ver_pacientes",
  },
  {
    titleKey: "sidebar.quotes",
    url: "/cotizaciones",
    icon: File,
    permiso: "ver_cotizaciones",
  },
  {
    titleKey: "sidebar.treatmentPlans",
    url: "/planes-tratamiento",
    icon: LayersIcon,
    permiso: "ver_planes_tratamiento",
  },
  {
    titleKey: "sidebar.payments",
    url: "/pagos",
    icon: DollarSign,
    permiso: "ver_pagos",
  },
  {
    titleKey: "sidebar.paymentOrders",
    url: "/ordenes-cobro",
    icon: Receipt,
    permiso: "ver_pagos",
  },

  {
    titleKey: "sidebar.myClinic",
    url: "/mi-clinica",
    icon: Building2,
    permiso: "editar_tenant",
  },
];

export async function AppSidebar() {
  const usuario = await getSession(); // Obtiene el nombre del usuario
  const { t } = getServerTranslator();
  const tenantLogoBase64 = await getTenantLogoBase64();
  const tenantDisplayName = usuario?.TenantNombre || usuario?.TenantSlug || "la clínica";
  const permisosUsuario = usuario?.Permiso || [];
  // Filtrar los ítems basados en los permisos del usuario
  const filteredItems = items.filter(item =>
    permisosUsuario.includes(item.permiso)
  );

  // Filtrar los ítems de mantenimiento basados en los permisos del usuario
  const filteredMantenimientoItems = mantenimientoItems.filter(item =>
    permisosUsuario.includes(item.permiso)
  );

  // Solo mostrar la sección de mantenimiento si hay al menos un ítem con permiso
  const showMantenimiento = filteredMantenimientoItems.length > 0;

  return (
    <Sidebar collapsible="icon" variant="floating" data-tour="sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between gap-2" data-tour="workspace-label">
            <div className="flex items-center gap-2 min-w-0">
              {tenantLogoBase64 ? (
                <Image
                  src={tenantLogoBase64}
                  alt={`Logo de ${tenantDisplayName}`}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded object-cover border"
                />
              ) : null}
              <div className="min-w-0">
                <span className="truncate block">{usuario?.TenantSlug || t("sidebar.workspaceDefault")}</span>
              </div>
            </div>
            <ModeToggle></ModeToggle>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu data-tour="main-menu">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} prefetch={false}>
                      <item.icon size={16} className="p-0" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {showMantenimiento && (
                <Collapsible className="group/collapsible" data-tour="maintenance-group">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Settings size={16} className="p-0" />
                        <span>{t("sidebar.maintenance")}</span>
                        <ChevronDown className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <ChevronUp className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {filteredMantenimientoItems.map((item) => (
                          <SidebarMenuSubItem key={item.titleKey}>
                            <SidebarMenuSubButton asChild>
                              <Link href={item.url} prefetch={false}>
                                {t(item.titleKey)}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {usuario && <NavUser usuario={usuario} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
