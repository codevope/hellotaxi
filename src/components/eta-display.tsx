'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MapPin, 
  Zap, 
  AlertTriangle, 
  Car,
  Loader2
} from 'lucide-react';
import { useETACalculator, type RouteInfo } from '@/hooks/use-eta-calculator';

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
  const { getTrafficStatus, formatDuration, formatDistance } = useETACalculator();

  if (isCalculating) {
    return (
      <Card className={`${className} border-dashed border-gray-300`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Calculando ruta...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200 bg-red-50`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!routeInfo) {
    return null;
  }

  const hasTrafficInfo = routeInfo.durationInTraffic !== undefined;
  const trafficStatus = hasTrafficInfo 
    ? getTrafficStatus(routeInfo.duration.value, routeInfo.durationInTraffic!.value)
    : 'light';

  const getTrafficColor = (status: 'light' | 'moderate' | 'heavy') => {
    switch (status) {
      case 'light': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'heavy': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getTrafficIcon = (status: 'light' | 'moderate' | 'heavy') => {
    switch (status) {
      case 'light': return <Zap className="w-3 h-3" />;
      case 'moderate': return <Clock className="w-3 h-3" />;
      case 'heavy': return <AlertTriangle className="w-3 h-3" />;
    }
  };

  const getTrafficText = (status: 'light' | 'moderate' | 'heavy') => {
    switch (status) {
      case 'light': return 'Tráfico fluido';
      case 'moderate': return 'Tráfico moderado';
      case 'heavy': return 'Tráfico pesado';
    }
  };

  const displayDuration = hasTrafficInfo ? routeInfo.durationInTraffic! : routeInfo.duration;
  const estimatedFare = Math.ceil((routeInfo.distance.value / 1000) * 2.5 + 5); // Tarifa estimada simple

  return (
    <Card className={`${className} border-blue-200 bg-blue-50`}>
      <CardContent className="p-4 space-y-3">
        {/* Tiempo y Distancia Principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-blue-900">
                  {formatDuration(displayDuration.value)}
                </span>
                {hasTrafficInfo && (
                  <Badge 
                    variant="outline" 
                    className={`${getTrafficColor(trafficStatus)} text-xs`}
                  >
                    {getTrafficIcon(trafficStatus)}
                    <span className="ml-1">{getTrafficText(trafficStatus)}</span>
                  </Badge>
                )}
              </div>
              <p className="text-sm text-blue-700 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {formatDistance(routeInfo.distance.value)}
              </p>
            </div>
          </div>

          {/* Tarifa Estimada */}
          <div className="text-right">
            <p className="text-sm text-gray-500">Tarifa estimada</p>
            <p className="text-lg font-semibold text-green-600">
              S/ {estimatedFare}
            </p>
          </div>
        </div>

        {/* Información Adicional del Tráfico */}
        {hasTrafficInfo && routeInfo.duration.value !== routeInfo.durationInTraffic!.value && (
          <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-blue-200">
            <span>Sin tráfico: {formatDuration(routeInfo.duration.value)}</span>
            <span>
              +{formatDuration(routeInfo.durationInTraffic!.value - routeInfo.duration.value)} por tráfico
            </span>
          </div>
        )}

        {/* Direcciones */}
        <div className="text-xs text-gray-600 space-y-1">
          <p className="truncate">
            <span className="font-medium">Desde:</span> {startAddress}
          </p>
          <p className="truncate">
            <span className="font-medium">Hacia:</span> {endAddress}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ETADisplay;
