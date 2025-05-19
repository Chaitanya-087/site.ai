import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background p-2">
        <main className="flex flex-col flex-grow overflow-hidden rounded-xl bg-primary-foreground">
          <Outlet />
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
