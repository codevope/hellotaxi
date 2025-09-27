import ClaimsTable from '@/components/admin/claims-table';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function AdminClaimsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Gestión de Reclamos
          </h1>
        </div>
      </div>
      <ClaimsTable />
    </div>
  );
}
