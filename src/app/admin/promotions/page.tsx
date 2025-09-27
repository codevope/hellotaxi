import PromotionsForm from '@/components/admin/promotions-form';
import PromotionsTable from '@/components/admin/promotions-table';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function AdminPromotionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Gestión de Promociones y Cupones
          </h1>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <PromotionsForm />
        <div className="lg:col-span-2">
            <PromotionsTable />
        </div>
      </div>
    </div>
  );
}
