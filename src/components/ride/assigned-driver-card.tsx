'use client';

import { X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DriverRating } from '@/components/driver-rating';
import { PriceDisplay } from '@/components/price-display';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Ride, DriverWithVehicleInfo } from '@/lib/types';

interface AssignedDriverCardProps {
  activeRide: Ride;
  assignedDriver: DriverWithVehicleInfo;
  onOpenCancelDialog: () => void;
}

export function AssignedDriverCard({
  activeRide,
  assignedDriver,
  onOpenCancelDialog,
}: AssignedDriverCardProps) {
  const getStatusHeader = () => {
    switch (activeRide.status) {
      case 'accepted':
        return {
          title: '🚗 Conductor en Camino',
          description: 'Preparándose para recogerte',
        };
      case 'arrived':
        return {
          title: '✅ ¡Conductor Aquí!',
          description: 'Dirígete al punto de encuentro',
        };
      case 'in-progress':
        return {
          title: '🛣️ Viaje en Curso',
          description: 'Disfruta tu viaje seguro',
        };
      default:
        return {
          title: 'Viaje Activo',
          description: 'Tu viaje está en progreso',
        };
    }
  };

  const statusHeader = getStatusHeader();

  return (
    <div className="space-y-4">
      {/* Status Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] p-5 shadow-xl">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="relative space-y-1">
          <h3 className="text-xl font-bold text-white">
            {statusHeader.title}
          </h3>
          <p className="text-sm text-[#05C7F2]">
            {statusHeader.description}
          </p>
        </div>
      </div>

      {/* Driver Card - Diseño Premium */}
      <div className="overflow-hidden rounded-2xl border border-[#049DD9]/20 bg-white shadow-lg">
        <div className="bg-gradient-to-r from-[#F2F2F2] to-white p-5">
          <div className="flex items-start gap-4">
            {/* Avatar con borde gradiente */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#049DD9] to-[#05C7F2] opacity-75 blur"></div>
              <Avatar className="relative h-16 w-16 border-4 border-white shadow-md">
                <AvatarImage
                  src={assignedDriver.avatarUrl}
                  alt={assignedDriver.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-[#0477BF] to-[#049DD9] text-xl font-bold text-white">
                  {assignedDriver.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Info del conductor */}
            <div className="flex-1">
              <p className="text-lg font-bold text-[#2E4CA6]">
                {assignedDriver.name}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <div className="rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 px-2 py-0.5">
                  <DriverRating
                    rating={assignedDriver.rating}
                    size="sm"
                    showLabel={false}
                  />
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-gray-600">
                  🚘 {assignedDriver.vehicleBrand} {assignedDriver.vehicleModel}
                </p>
                <p className="text-xs font-mono font-semibold text-[#0477BF]">
                  {assignedDriver.licensePlate}
                </p>
              </div>
            </div>

            {/* Precio */}
            <div className="flex flex-col items-end">
              <PriceDisplay
                amount={activeRide.fare}
                label="Tarifa"
                size="lg"
                variant="highlight"
              />
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-100 p-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full h-12 border-2 border-red-200 bg-white font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-50"
              >
                <X className="mr-2 h-4 w-4" /> Cancelar Viaje
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Seguro que quieres cancelar?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción podría afectar negativamente tu
                  calificación como pasajero. ¿Aún deseas
                  cancelar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  No, continuar viaje
                </AlertDialogCancel>
                <AlertDialogAction onClick={onOpenCancelDialog}>
                  Sí, cancelar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
