'use client';

import { X, Wallet, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from '@/components/price-display';
import type { Ride, CancellationReason } from '@/lib/types';

interface CounterOfferCardProps {
  counterOfferValue: number;
  onAcceptCounterOffer: () => void;
  onRejectCounterOffer: (reason: CancellationReason) => void;
}

export function CounterOfferCard({
  counterOfferValue,
  onAcceptCounterOffer,
  onRejectCounterOffer,
}: CounterOfferCardProps) {
  return (
    <div className="space-y-4">
      {/* Header con gradiente del logo */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2E4CA6] via-[#0477BF] to-[#049DD9] p-6 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
              <DollarSign className="h-5 w-5 text-[#05C7F2]" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Nueva Contraoferta
            </h3>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#05C7F2]/20 to-[#049DD9]/20 blur-xl"></div>
            <div className="relative rounded-xl border border-white/30 bg-white/10 p-6 backdrop-blur-md">
              <div className="flex flex-col items-center [&_*]:!text-white">
                <PriceDisplay
                  amount={counterOfferValue}
                  label="Propuesta del Conductor"
                  size="xl"
                  variant="default"
                />
              </div>
            </div>
          </div>
          
          <p className="text-center text-sm text-white/90">
            El conductor ha propuesto un nuevo precio para este viaje
          </p>
        </div>
      </div>

      {/* Botones de acción con diseño moderno */}
      <div className="space-y-3">
        <Button
          onClick={onAcceptCounterOffer}
          className="group relative h-14 w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <div className="relative flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>Aceptar S/ {counterOfferValue.toFixed(2)}</span>
          </div>
        </Button>
        
        <Button
          onClick={() =>
            onRejectCounterOffer({
              code: "REJECTED_COUNTER",
              reason: "Contraoferta rechazada",
            })
          }
          variant="outline"
          className="group h-14 w-full rounded-xl border-2 border-red-200 bg-white font-semibold text-red-600 transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-700 active:scale-[0.98]"
        >
          <div className="flex items-center justify-center gap-2">
            <X className="h-5 w-5" />
            <span>Rechazar y Buscar Otro</span>
          </div>
        </Button>
      </div>

    </div>
  );
}
