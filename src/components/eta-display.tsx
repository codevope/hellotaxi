'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MapPin, 
  Car,
  Loader2
} from 'lucide-react';
import { useETACalculator, type RouteInfo } from '@/hooks/use-eta-calculator';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';


interface ETADisplayProps {
  routeInfo?: RouteInfo | null;
  isCalculating?: boolean;
  error?: string | null;
  startAddress: string;
  endAddress: string;
  className?: string;
}

const ETADisplay: React.FC<ETADisplayProps> = ({
  routeInfo,
  isCalculating = false,
  error,
  startAddress,
  endAddress,
  className = ''
}) => {
  const { formatDuration, formatDistance } = useETACalculator();

  if (isCalculating) {
    return (
      <Card className={`${className} border-dashed`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Calculando ruta y tarifa...</span>
          </div>
        </CardContent>
      </Card>
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
    <Card className={`${className} border-primary/20 bg-primary/5`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground">
                  {formatDuration(duration.value)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {formatDistance(distance.value)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">Tarifa sugerida</p>
            <p className="text-lg font-bold text-primary">
              S/ {(estimatedFare || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ETADisplay;
