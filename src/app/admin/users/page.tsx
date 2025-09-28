import AdminsTable from '@/components/admin/admins-table';
import UsersTable from '@/components/admin/users-table';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminUsersPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Gestión de Usuarios
          </h1>
        </div>
      </div>
      <Tabs defaultValue="passengers">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="passengers">Pasajeros</TabsTrigger>
          <TabsTrigger value="admins">Administradores</TabsTrigger>
        </TabsList>
        <TabsContent value="passengers" className="mt-6">
          <UsersTable />
        </TabsContent>
        <TabsContent value="admins" className="mt-6">
          <AdminsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
