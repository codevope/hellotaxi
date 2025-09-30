

'use client';

import VehiclesTable from '@/components/admin/vehicles-table';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function AdminVehiclesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Gestión de Flota de Vehículos
          </h1>
        </div>
      </div>
      <VehiclesTable />
    </div>
  );
}
