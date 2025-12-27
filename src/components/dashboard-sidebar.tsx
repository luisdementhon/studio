
"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Home, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const handleSignOut = () => {
    if (auth) {
      signOut(auth).then(() => {
        router.push('/login');
      });
    }
  };

  const isAssociationView = pathname.startsWith('/dashboard/association');

  const profileDocRef = useMemoFirebase(() => {
    if (!user) return null;
    const collectionName = isAssociationView ? 'associations' : 'users';
    return doc(firestore, collectionName, user.uid);
  }, [firestore, user, isAssociationView]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileDocRef);

  const navItems = isAssociationView
    ? [
        { href: '/dashboard/association', label: 'Tableau de bord', icon: Home },
        { href: '/dashboard/association/profile', label: 'Profil Association', icon: Settings },
      ]
    : [
        { href: '/dashboard/user', label: 'Mes Dons', icon: Home },
        { href: '/dashboard/user/profile', label: 'Mon Profil', icon: Settings },
      ];

  const getProfileName = () => {
    if (!profileData) return isAssociationView ? 'Association' : 'Utilisateur';
    if (isAssociationView) return (profileData as any).associationName;
    const fullName = `${(profileData as any).firstName || ''} ${(profileData as any).lastName || ''}`.trim();
    return fullName || user?.email;
  };
  
  const getAvatarFallback = () => {
    if (!profileData) return isAssociationView ? 'A' : 'U';
    let name = isAssociationView ? (profileData as any).associationName : (profileData as any).firstName;
     if (!name && user?.email) {
      name = user.email;
    }
    return name ? name.charAt(0).toUpperCase() : (isAssociationView ? 'A' : 'U');
  };

  const getProfileEmail = () => user?.email || '';
  
  const isLoading = isUserLoading || isProfileLoading;

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col items-start">
        <Link href="/" className="text-primary transition-colors duration-300 hover:text-primary/80">
          <Logo className="w-36 text-sidebar-primary" />
        </Link>
        <SidebarTrigger className="hidden md:flex" />
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
