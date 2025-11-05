
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { DotlyLogo } from '@/components/dotly-logo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        {/* Mobile Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
          <Link href="/">
            <DotlyLogo className="h-6 w-auto text-primary" />
          </Link>
          <SidebarTrigger />
        </header>

        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
