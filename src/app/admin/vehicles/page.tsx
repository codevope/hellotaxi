
'use client';

import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Wrench } from 'lucide-react';
import VehiclesTable from '@/components/admin/vehicles-table';
import VehicleModelsManager from '@/components/admin/vehicle-models-manager';

export default function AdminVehiclesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Gestión de Vehículos
          </h1>
        </div>
      </div>
      <Tabs defaultValue="fleet">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="fleet">
            <Car className="mr-2" />
            Flota de Vehículos
          </TabsTrigger>
          <TabsTrigger value="models">
            <Wrench className="mr-2" />
            Marcas y Modelos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fleet" className="mt-6">
          <VehiclesTable />
        </TabsContent>
        <TabsContent value="models" className="mt-6">
          <VehicleModelsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
