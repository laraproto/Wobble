import { SidebarProvider, SidebarTrigger } from "#/components/ui/sidebar";
import { DashboardSidebar } from "#/components/DashboardSidebar";



export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
