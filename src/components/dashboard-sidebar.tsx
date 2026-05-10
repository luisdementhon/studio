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
import { Home, Settings, LogOut, Users, CreditCard, Target, Heart, History, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth, useDoc, useFirestore, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { DotlyBrand } from '@/components/ui/dotly-brand';


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

  const profileDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    const collectionName = isAssociationView ? 'associations' : 'users';
    return doc(firestore, collectionName, user.uid);
  }, [firestore, user, isAssociationView]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc(profileDocRef);

  const navItems = isAssociationView
    ? [
        { href: '/dashboard/association', label: 'Tableau de bord', icon: Home },
        { href: '/dashboard/association/donors', label: 'Donateurs', icon: Users },
        { href: '/dashboard/association/payouts', label: 'Versements', icon: CreditCard },
        { href: '/dashboard/association/tax-receipts', label: 'Reçus fiscaux', icon: Target },
        { href: '/dashboard/association/profile', label: 'Paramètres', icon: Settings },
      ]
    : [
        { href: '/dashboard/user', label: 'Mes dons', icon: LayoutDashboard },
        { href: '/dashboard/user/associations', label: 'Mes associations', icon: Heart },
        { href: '/dashboard/user/history', label: 'Historique', icon: History },
        { href: '/dashboard/user/profile', label: 'Mon profil', icon: Settings },
      ];

  const getProfileName = () => {
    if (user?.isAnonymous) return isAssociationView ? 'Association Démo' : 'Utilisateur Démo';
    if (!profileData) return isAssociationView ? 'Association' : 'Utilisateur';
    if (isAssociationView) return (profileData as any).associationName;
    const fullName = `${(profileData as any).firstName || ''} ${(profileData as any).lastName || ''}`.trim();
    return fullName || user?.email;
  };
  
  const getAvatarFallback = () => {
    const name = getProfileName();
    return name ? name.charAt(0).toUpperCase() : (isAssociationView ? 'A' : 'U');
  };

  const isLoading = isUserLoading || isProfileLoading;

  return (
    <Sidebar className="border-r border-black/[0.05] bg-white">
      <SidebarHeader className="p-8 pb-10">
        <Link href="/" className="group flex items-center gap-2">
          <DotlyBrand className="text-4xl transition-transform group-hover:scale-105" />
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-6">
        <div className="mb-12">
          <span className="px-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground/30 mb-6 block">
            {isAssociationView ? 'ESPACE ASSOCIATION' : 'ESPACE DONATEUR'}
          </span>
          <SidebarMenu className="gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className={`h-12 rounded-full px-5 transition-all duration-300 ${
                      isActive 
                        ? 'bg-brand-coral text-white font-bold' 
                        : 'text-foreground/60 hover:bg-black/5 hover:text-foreground'
                    }`}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                      <span className="text-sm font-bold">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-6 mt-auto">
        <div className="bg-black text-white rounded-[2rem] p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 rounded-full border-2 border-white/10">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100/100`} alt={getProfileName()} />
                  <AvatarFallback className="rounded-full bg-brand-coral text-white font-extrabold">{getAvatarFallback()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-sm overflow-hidden">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white truncate text-sm">{getProfileName()}</span>
                    {isAssociationView && <div className="w-3 h-3 rounded-full bg-brand-mint flex items-center justify-center"><CheckCircle2 className="w-2 h-2 text-black" /></div>}
                  </div>
                  <span className="text-white/40 truncate text-[10px] font-bold uppercase tracking-widest">{isAssociationView ? 'Vérifié' : 'Membre'}</span>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 hover:text-brand-coral transition-colors flex items-center gap-2 px-1"
            >
              <LogOut className="h-3 w-3" />
              Déconnexion
            </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
