'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { DotlyBrand } from '@/components/ui/dotly-brand';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-h-screen bg-muted/20">
        {/* Mobile Header */}
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between bg-white px-6 md:hidden shadow-sm">
          <SidebarTrigger className="h-10 w-10 rounded-xl" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className="flex items-center gap-2">
              <DotlyBrand className="text-4xl" />
            </Link>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        <SidebarInset className="bg-transparent">
          <div className="p-6 md:p-12 lg:p-16 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
