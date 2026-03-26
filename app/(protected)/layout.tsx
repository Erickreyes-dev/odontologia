import { getSession } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { AppIntroTour } from "@/components/tour/app-intro-tour";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { getQuickActionCatalogs } from "./quick-actions/actions";
import { QuickActionsPopover } from "@/components/quick-actions-popover";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const sesion = await getSession();

  if (!sesion) {
    redirect("/");
  }

  const quickData = await getQuickActionCatalogs();

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full p-2" data-tour="main-content">
        <div className="mb-2 flex items-center justify-between">
          <SidebarTrigger data-tour="sidebar-trigger" />
          {quickData ? <QuickActionsPopover data={quickData} /> : null}
        </div>
        <AppIntroTour />
        {children}
      </main>
    </SidebarProvider>
  );
}
