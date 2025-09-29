
import RidesTable from '@/components/admin/rides-table';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function AdminRidesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Historial de Viajes
          </h1>
        </div>
      </div>
      <RidesTable />
    </div>
  );
}
