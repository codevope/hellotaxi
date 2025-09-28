
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser, loading } = useAuth();

  if (loading) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!appUser?.isAdmin) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-muted">
            <Card className="max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 rounded-full p-4 w-fit mb-4">
                        <ShieldX className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle>Acceso Denegado</CardTitle>
                    <CardDescription>No tienes permisos para acceder a esta sección.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/">Volver al Inicio</Link>
                    </Button>
                </CardContent>
            </Card>
          </div>
      )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AdminSidebar />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
