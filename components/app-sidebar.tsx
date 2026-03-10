import { getSession } from "@/auth";
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
import {  Boxes, Building2, Calendar, ChevronDown, ChevronUp, DollarSign, File,  Hospital, IdCardIcon, LayersIcon, LayoutDashboard, Package, Receipt, Settings, ShieldPlus, Stethoscope, Tags, UserIcon, UserRoundCheck, Users2, UsersIcon } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";
import { NavUser } from "./nav-user";
import { ModeToggle } from "./buton-theme";

// Menú de mantenimiento
const mantenimientoItems = [
  {
    title: "Roles",
    url: "/roles",
    icon: LayersIcon,
    permiso: "ver_roles",
  },
  {
    title: "Permisos",
    url: "/permisos",
    icon: LayersIcon,
    permiso: "ver_permisos",
  },
  {
    title: "Usuarios",
    url: "/usuarios",
    icon: UserIcon,
    permiso: "ver_usuarios",
  },
  {
    title: "Empleados",
    url: "/empleados",
    icon: UsersIcon,
    permiso: "ver_empleados",
  },
  {
    title: "Puestos",
    url: "/puestos",
    icon: UserRoundCheck,
    permiso: "ver_puestos",
  },
  {
    title: "Profesiones",
    url: "/profesiones",
    icon: IdCardIcon,
    permiso: "ver_profesiones",
  },


];




// Menu items con permisos necesarios (sin los items de mantenimiento)
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    permiso: "ver_pagos",
  },
  {
    title: "Dashboard Admin",
    url: "/dashboard-admin",
    icon: ShieldPlus,
    permiso: "ver_dashboard_admin",
  },
  {
    title: "Tenants",
    url: "/tenants",
    icon: ShieldPlus,
    permiso: "ver_tenants",
  },
  {
    title: "Paquetes",
    url: "/paquetes",
    icon: Package,
    permiso: "ver_paquetes",
  },

  {
    title: "Seguros",
    url: "/seguros",
    icon: ShieldPlus,
    permiso: "ver_seguros",
  },

  {
    title: "Pacientes",
    url: "/pacientes",
    icon: Users2,
    permiso: "ver_pacientes",
  },
  {
    title: "Medicos",
    url: "/medicos",
    icon: Stethoscope,
    permiso: "ver_medicos",
  },
  {
    title: "Servicios",
    url: "/servicios",
    icon: Package,
    permiso: "ver_servicios",
  },
  {
    title: "Promociones",
    url: "/promociones",
    icon: Tags,
    permiso: "ver_promociones",
  },
  {
    title: "Inventario",
    url: "/inventario",
    icon: Boxes,
    permiso: "ver_inventario",
  },
  {
    title: "Consultorios",
    url: "/consultorios",
    icon: Hospital,
    permiso: "ver_consultorios",
  },
  {
    title: "Citas",
    url: "/citas",
    icon: Calendar,
    permiso: "ver_citas",
  },
  {
    title: "cotizaciones",
    url: "/cotizaciones",
    icon: File,
    permiso: "ver_cotizaciones",
  },
  {
    title: "Planes de Tratamiento",
    url: "/planes-tratamiento",
    icon: LayersIcon,
    permiso: "ver_planes_tratamiento",
  },
  {
    title: "Pagos",
    url: "/pagos",
    icon: DollarSign,
    permiso: "ver_pagos",
  },
  {
    title: "Ordenes de Cobro",
    url: "/ordenes-cobro",
    icon: Receipt,
    permiso: "ver_pagos",
  },

  {
    title: "Mi Clínica",
    url: "/mi-clinica",
    icon: Building2,
    permiso: "editar_tenant",
  },
];

export async function AppSidebar() {
  const usuario = await getSession(); // Obtiene el nombre del usuario
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
              <span className="truncate">{usuario?.TenantSlug || "Sistema Autogestión MP"}</span>
            </div>
            <ModeToggle></ModeToggle>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu data-tour="main-menu">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon size={16} className="p-0" />
                      <span>{item.title}</span>
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
                        <span>Mantenimiento</span>
                        <ChevronDown className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <ChevronUp className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {filteredMantenimientoItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <Link href={item.url}>
                                {item.title}
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
