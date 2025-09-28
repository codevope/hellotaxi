
'use client';

import Link from 'next/link';
import { Car, LogOut, User, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useDriverAuth } from '@/hooks/use-driver-auth';

export default function AppHeader() {
  const { user, appUser, signOut } = useAuth();
  const { isDriver } = useDriverAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const isAdmin = appUser?.isAdmin || false;

  const navLinks = [
    // Conditionally render "Viaja" link
    !isDriver && { href: '/ride', label: 'Viaja' },
    !isDriver && { href: '/driver', label: 'Conduce' },
    { href: '/about', label: 'Quiénes Somos' },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b shadow-sm sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 text-blue-600">
        <h1 className="text-2xl font-bold font-headline">Hello Taxi</h1>
      </Link>
      <nav className="hidden md:flex items-center gap-2">
        {navLinks.map((link) => (
          <Button variant="ghost" asChild key={link.href} className={cn(pathname === link.href && 'font-bold bg-secondary')}>
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
        {isAdmin && (
           <Button variant="ghost" asChild className={cn(pathname.startsWith('/admin') && 'font-bold bg-secondary')}>
            <Link href="/admin">Panel de Admin</Link>
          </Button>
        )}
      </nav>
       <div className="flex items-center gap-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                  <AvatarFallback>
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                 <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                 </Link>
              </DropdownMenuItem>
              {isDriver && (
                <DropdownMenuItem asChild>
                  <Link href="/driver/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Panel de Conductor</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => router.push('/login')}>Iniciar Sesión</Button>
        )}
      </div>
    </header>
  );
}
