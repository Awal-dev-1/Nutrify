import { MainSidebar } from "@/components/dashboard/main-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <Sidebar>
            <MainSidebar />
        </Sidebar>
        <SidebarInset>
            <DashboardHeader />
            <main className="min-h-[calc(100vh-4rem)] bg-background p-4 lg:p-6">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
