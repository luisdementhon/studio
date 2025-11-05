"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { DotlyLogo } from '@/components/dotly-logo';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Home, Settings, LogOut, Building, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function DashboardSidebar() {
  const pathname = usePathname();
  const isAssociation = pathname.startsWith('/dashboard/association');

  const navItems = isAssociation
    ? [
        { href: '/dashboard/association', label: 'Tableau de bord', icon: Home },
        { href: '/dashboard/association/profile', label: 'Profil Association', icon: Settings },
      ]
    : [
        { href: '/dashboard/user', label: 'Mes Dons', icon: Home },
        { href: '/dashboard/user/profile', label: 'Mon Profil', icon: Settings },
      ];

  const profileName = isAssociation ? 'Les Restos du Coeur' : 'Jean Dupont';
  const profileEmail = isAssociation ? 'contact@restosducoeur.org' : 'jean.dupont@email.com';
  const avatarSeed = isAssociation ? 'asso' : 'user';

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between">
        <Link href="/" className="text-primary transition-colors duration-300 hover:text-primary/80">
          <DotlyLogo className="w-24" />
        </Link>
        <SidebarTrigger className="md:hidden"/>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="space-y-2">
        <div className="flex items-center gap-3 p-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={`https://picsum.photos/seed/${avatarSeed}/100/100`} alt={profileName} />
              <AvatarFallback>{profileName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm overflow-hidden">
                <span className="font-semibold truncate">{profileName}</span>
                <span className="text-muted-foreground truncate">{profileEmail}</span>
            </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Déconnexion">
              <Link href="/">
                <LogOut />
                <span>Déconnexion</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
