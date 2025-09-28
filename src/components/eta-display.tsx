
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  CarFront,
  Loader2
} from 'lucide-react';
import { useETACalculator, type RouteInfo } from '@/hooks/use-eta-calculator';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ETADisplayProps {
  routeInfo?: RouteInfo | null;
  isCalculating?: boolean;
  error?: string | null;
  className?: string;
}

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

  const { distance, duration, estimatedFare } = routeInfo;

  return (
    <div className={cn("rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white", className)}>
      <div className="p-6">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm opacity-80">Duración estimada</p>
                <p className="text-4xl font-bold tracking-tighter">{formatDuration(duration.value)}</p>
                <Badge variant="secondary" className="mt-1 bg-white/20 text-white border-0">con tráfico</Badge>
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
      </div>
    </div>
  );
};

export default ETADisplay;
