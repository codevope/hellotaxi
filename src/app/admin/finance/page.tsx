'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import FinancialReportTable from '@/components/admin/financial-report-table';

export default function AdminFinancePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Reporte Financiero por Conductor
          </h1>
        </div>
      </div>

      <FinancialReportTable />
      
    </div>
  );
}
