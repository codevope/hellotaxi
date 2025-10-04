'use client';

import { Car, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import type { Ride, CancellationReason, Location } from '@/lib/types';

interface SearchingRideStatusProps {
  activeRide: Ride | null;
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  onCancelRide: (reason: CancellationReason) => void;
}

export function SearchingRideStatus({
  activeRide,
  pickupLocation,
  dropoffLocation,
  onCancelRide,
}: SearchingRideStatusProps) {
  return (
    <div className="space-y-4">
      {/* Trip Details Card - Diseño moderno */}
      <div className="overflow-hidden rounded-2xl border border-[#049DD9]/20 bg-gradient-to-br from-white to-[#F2F2F2] shadow-lg">
        <div className="border-b border-[#049DD9]/10 bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] px-4 py-3">
          <h3 className="flex items-center gap-2 font-bold text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Detalles del Viaje
          </h3>
        </div>
        
        <div className="space-y-4 p-5">
          {/* Origen */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md">
                <div className="h-3 w-3 rounded-full bg-white"></div>
              </div>
              <div className="h-8 w-0.5 bg-gradient-to-b from-emerald-400 to-[#049DD9]"></div>
            </div>
            <div className="flex-1 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Origen
              </p>
              <p className="mt-1 text-sm font-medium text-gray-800">
                {pickupLocation?.address || activeRide?.pickup}
              </p>
            </div>
          </div>

          {/* Destino */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#049DD9] to-[#0477BF] shadow-md">
                <MapPin className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0477BF]">
                Destino
              </p>
              <p className="mt-1 text-sm font-medium text-gray-800">
                {dropoffLocation?.address || activeRide?.dropoff}
              </p>
            </div>
          </div>

          {/* Precio */}
          {activeRide && (
            <div className="mt-4 rounded-xl border-2 border-dashed border-[#049DD9]/30 bg-gradient-to-r from-[#05C7F2]/5 to-[#049DD9]/5 p-4">
              <div className="flex items-center justify-between">
                <PriceDisplay
                  amount={activeRide.fare}
                  label="Tarifa Estimada"
                  size="lg"
                  variant="highlight"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Searching Status - Animación moderna */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2E4CA6]/5 to-[#049DD9]/5 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(4,119,191,0.1),transparent_50%)]"></div>
        
        <div className="relative flex flex-col items-center justify-center space-y-5 text-center">
          {/* Animación de búsqueda */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#049DD9]/20"></div>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0477BF] to-[#049DD9] shadow-xl">
              <Car className="h-10 w-10 animate-pulse text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-bold text-[#2E4CA6]">
              Buscando conductor...
            </p>
            <p className="text-sm text-gray-600">
              Conectando con los mejores conductores cerca de ti
            </p>
          </div>
          
          {/* Indicador de progreso */}
          <div className="w-full max-w-xs">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full animate-[progress_2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#0477BF] to-[#05C7F2]"></div>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" className="mt-4 border-2 border-[#049DD9] bg-white text-[#049DD9] hover:bg-[#049DD9]/10">
                <X className="mr-2 h-4 w-4" /> Cancelar Búsqueda
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Cancelar la búsqueda?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que quieres cancelar la
                  búsqueda de tu viaje?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  No, continuar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    onCancelRide({
                      code: "PASSENGER_CANCELLED_SEARCH",
                      reason: "Pasajero canceló búsqueda",
                    })
                  }
                >
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
