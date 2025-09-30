"use client";

import {
  Car,
  LayoutDashboard,
  Settings,
  Users,
  UserCog,
  ShieldAlert,
  Siren,
  Banknote,
  Ticket,
  ShieldX,
  CalendarPlus,
  FileText,
  LogOut,
  CarFront,
} from "lucide-react";
import Link from "next/link";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { appUser, signOut } = useAuth();
  const isActive = (path: string) => pathname.startsWith(path);

  const isAdmin = appUser?.isAdmin || false;

  if (!isAdmin) {
    // In a real app, you might redirect or show a restricted access message.
    // For now, we just don't render the sidebar content for non-admins.
    return (
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 text-primary">
          <h1 className="text-xl lg:text-2xl font-extrabold font-headline bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] bg-clip-text text-transparent">
            Hello TAXI
          </h1>
        </Link>
      </SidebarHeader>
    );
  }

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 text-primary">
          <h1 className="text-xl lg:text-2xl font-extrabold font-headline bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] bg-clip-text text-transparent">
            Hello TAXI
          </h1>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarMenu className="gap-2 mt-4">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/admin") && pathname === "/admin"}
            >
              <Link href="/admin">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/users")}>
              <Link href="/admin/users">
                <Users />
                <span>Usuarios</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/drivers")}>
              <Link href="/admin/drivers">
                <UserCog />
                <span>Conductores</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/vehicles")}>
              <Link href="/admin/vehicles">
                <CarFront />
                <span>Vehículos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/rides")}>
              <Link href="/admin/rides">
                <Car />
                <span>Viajes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/finance")}>
              <Link href="/admin/finance">
                <Banknote />
                <span>Finanzas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/admin/cancellations")}
            >
              <Link href="/admin/cancellations">
                <ShieldX />
                <span>Cancelaciones</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/sos")}>
              <Link href="/admin/sos">
                <Siren />
                <span>Alertas SOS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/claims")}>
              <Link href="/admin/claims">
                <ShieldAlert />
                <span>Reclamos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/promotions")}>
              <Link href="/admin/promotions">
                <Ticket />
                <span>Promociones</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/zones")}>
              <Link href="/admin/zones">
                <CalendarPlus />
                <span>Tarifas Especiales</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/admin/documentation")}
            >
              <Link href="/admin/documentation">
                <FileText />
                <span>Documentación</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/settings")}>
              <Link href="/admin/settings">
                <Settings />
                <span>Ajustes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
