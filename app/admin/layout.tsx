import { AntdRegistry } from '@ant-design/nextjs-registry'
import { AppSidebar } from '~/components/layout/admin/app-sidebar'
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { AdminBackground } from '~/components/layout/admin/admin-background'
import { MouseTracker } from '~/components/layout/admin/mouse-tracker'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <MouseTracker />
      <AdminBackground />
      <AppSidebar />
      <main className="flex w-full h-full flex-1 flex-col p-4">
        <SidebarTrigger className="cursor-pointer" />
        <AntdRegistry>
          <div className="w-full h-full p-2">
            {children}
          </div>
        </AntdRegistry>
      </main>
    </SidebarProvider>
  );
}
