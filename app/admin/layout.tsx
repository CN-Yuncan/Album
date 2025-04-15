import { AntdRegistry } from '@ant-design/nextjs-registry'
import { AppSidebar } from '~/components/layout/admin/app-sidebar'
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: 'url(https://pic.rmb.bdstatic.com/bjh/ebe942a9de49856f389c65f25a338335.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <SidebarProvider>
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
    </div>
  );
}
