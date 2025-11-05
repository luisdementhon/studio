"use client";

import { usePathname, useRouter } from 'next/navigation';
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
import { useAuth, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { signOut, User } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const handleSignOut = () => {
    signOut(auth).then(() => {
      router.push('/login');
    });
  };

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);

  // For this demo, we'll keep the logic to switch between user/association views simple.
  // A real app would have a more robust role management system.
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
  
  const getProfileName = () => {
    if (isAssociation) return 'Association';
    if (userData) return `${userData.firstName} ${userData.lastName}`;
    return 'Utilisateur';
  }

  const getProfileEmail = () => {
    if (isUserLoading) return '';
    return user?.email || '';
  }

  const getAvatarFallback = () => {
    if (isAssociation) return 'A';
    if (userData?.firstName) return userData.firstName.charAt(0).toUpperCase();
    return 'U';
  }

  const isLoading = isUserLoading || (isProfileLoading && !isAssociation);


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
          {isLoading ? (
            <>
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex flex-col gap-1 w-full">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </>
          ) : (
            <>
              <Avatar className="h-9 w-9">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100/100`} alt={getProfileName()} data-ai-hint="person portrait"/>
                <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-sm overflow-hidden">
                  <span className="font-semibold truncate">{getProfileName()}</span>
                  <span className="text-muted-foreground truncate">{getProfileEmail()}</span>
              </div>
            </>
          )}
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Déconnexion">
                <LogOut />
                <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
