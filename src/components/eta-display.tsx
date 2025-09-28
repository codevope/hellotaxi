
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CarFront,
  Loader2,
  Tag
} from 'lucide-react';
import { useETACalculator, type RouteInfo, type TrafficCondition } from '@/hooks/use-eta-calculator';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

interface ETADisplayProps {
  routeInfo?: RouteInfo | null;
  isCalculating?: boolean;
  error?: string | null;
  className?: string;
}

const trafficConfig: Record<TrafficCondition, { text: string; className: string; iconColor: string }> = {
    light: { text: 'Tráfico ligero', className: 'bg-green-100 text-green-800 border-green-200', iconColor: 'text-green-500' },
    moderate: { text: 'Tráfico moderado', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', iconColor: 'text-yellow-500' },
    heavy: { text: 'Tráfico pesado', className: 'bg-red-100 text-red-800 border-red-200', iconColor: 'text-red-500' },
    unknown: { text: 'Tráfico no disponible', className: 'bg-gray-100 text-gray-800 border-gray-200', iconColor: 'text-gray-500' },
};


const ETADisplay: React.FC<ETADisplayProps> = ({
  routeInfo,
  isCalculating = false,
  error,
  className = ''
}) => {
  const { formatDuration, formatDistance } = useETACalculator();

  if (isCalculating) {
    return (
      <div className={cn("rounded-lg border-dashed border-2 p-4", className)}>
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Calculando ruta y tarifa óptima...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al Calcular</AlertTitle>
          <AlertDescription>No se pudo obtener la ruta. Por favor, verifica las direcciones.</AlertDescription>
      </Alert>
    );
  }

  if (!routeInfo) {
    return null;
  }

  const { distance, duration, estimatedFare, trafficCondition, fareBreakdown } = routeInfo;
  const trafficInfo = trafficConfig[trafficCondition];
  const couponDiscount = fareBreakdown?.couponDiscount || 0;


  return (
    <div className={cn("rounded-xl overflow-hidden shadow-lg bg-primary text-white", className)}>
      <div className="p-6">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm opacity-80">Duración estimada</p>
                <p className="text-4xl font-bold tracking-tighter">{formatDuration(duration.value)}</p>
                <Badge variant="secondary" className={cn("mt-2 border-0 flex items-center gap-1.5 text-xs", trafficInfo.className)}>
                    <CarFront className={cn("h-4 w-4", trafficInfo.iconColor)} />
                    <span className="font-semibold">{trafficInfo.text}</span>
                </Badge>
            </div>
             <CarFront className="w-12 h-12 text-white/50" />
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
            <div>
                 <p className="text-sm opacity-80">Distancia</p>
                <p className="text-lg font-semibold">{formatDistance(distance.value)}</p>
            </div>
            <div>
                <p className="text-sm opacity-80">Tarifa Sugerida</p>
                <p className="text-lg font-bold">S/ {(estimatedFare || 0).toFixed(2)}</p>
            </div>
        </div>

        {couponDiscount > 0 && (
          <>
            <Separator className="my-4 bg-white/20" />
            <div className="flex items-center justify-center gap-2 text-sm text-green-300 font-semibold">
              <Tag className="h-4 w-4" />
              <span>Se aplicó un descuento de S/{couponDiscount.toFixed(2)} con tu cupón.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ETADisplay;


