// app/layout.tsx
import { getSession } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { AppIntroTour } from "@/components/tour/app-intro-tour";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const sesion = await getSession();

  if (!sesion) {
    redirect("/");
  }

  return (
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full p-2" data-tour="main-content">
          <SidebarTrigger data-tour="sidebar-trigger" />
          <AppIntroTour />
          {children}
        </main>
      </SidebarProvider>
  );
}
