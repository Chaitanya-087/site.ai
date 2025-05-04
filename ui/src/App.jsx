import { Outlet } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/hooks/use-theme"
import { AuthProvider } from "./hooks/use-auth";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className='bg-background p-2'>
            <main className="flex flex-col flex-grow overflow-hidden rounded-xl bg-primary-foreground">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
