
'use client';

import { useEffect, useState } from 'react';
import { negotiateFare } from '@/ai/flows/negotiate-fare';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CircleDollarSign, ShieldX, MessageSquare, ThumbsUp, Info, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import type { FareBreakdown } from '@/lib/types';
import type { RouteInfo } from '@/hooks/use-eta-calculator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from './ui/separator';

const PASSENGER_NEGOTIATION_RANGE = 0.20; // Pasajero puede ofrecer hasta 20% menos

type FareNegotiationProps = {
  routeInfo: RouteInfo;
  onNegotiationComplete: (finalFare: number, breakdown: FareBreakdown) => void;
  onCancel: () => void;
};

function FareBreakdownDialog({ breakdown }: { breakdown: FareBreakdown }) {
    const items = [
        { label: 'Tarifa Base', value: breakdown.baseFare },
        { label: 'Costo por Distancia', value: breakdown.distanceCost },
        { label: 'Costo por Duración', value: breakdown.durationCost },
        { label: 'Tarifa de Servicio', value: breakdown.serviceCost, sub: `(${(breakdown.serviceMultiplier - 1) * 100}%)` },
    ];
    const surcharges = [
        { label: 'Recargo por Hora Punta', value: breakdown.peakSurcharge },
        { label: 'Recargo por Día Especial', value: breakdown.specialDaySurcharge },
    ];
    const discounts = [
        { label: 'Descuento por Cupón', value: breakdown.couponDiscount },
    ];

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Desglose de la Tarifa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
                {items.map(item => (
                    <div key={item.label} className="flex justify-between items-center">
                        <p className="text-muted-foreground">{item.label} {item.sub && <span className="text-xs">{item.sub}</span>}</p>
                        <p>S/{item.value.toFixed(2)}</p>
                    </div>
                ))}
                
                {(surcharges.some(s => s.value > 0) || discounts.some(d => d.value > 0)) && <Separator />}

                <div className="flex justify-between items-center font-medium">
                    <p>Subtotal (sin recargos)</p>
                    <p>S/{breakdown.subtotal.toFixed(2)}</p>
                </div>

                {surcharges.filter(s => s.value > 0).map(surcharge => (
                     <div key={surcharge.label} className="flex justify-between items-center text-orange-600">
                        <p>{surcharge.label}</p>
                        <p>+ S/{surcharge.value.toFixed(2)}</p>
                    </div>
                ))}
                {discounts.filter(d => d.value > 0).map(discount => (
                    <div key={discount.label} className="flex justify-between items-center text-green-600">
                        <p>{discount.label}</p>
                        <p>- S/{discount.value.toFixed(2)}</p>
                    </div>
                ))}

                {(surcharges.some(s => s.value > 0) || discounts.some(d => d.value > 0)) && <Separator />}

                <div className="flex justify-between items-center text-lg font-bold">
                    <p>Total Sugerido</p>
                    <p>S/{breakdown.total.toFixed(2)}</p>
                </div>
                 {breakdown.couponDiscount > 0 && (
                    <p className="text-xs text-center text-green-600">
                        El descuento del cupón ya está aplicado en el total sugerido.
                    </p>
                )}
            </div>
        </DialogContent>
    );
}


export default function FareNegotiation({
  routeInfo,
  onNegotiationComplete,
  onCancel,
}: FareNegotiationProps) {
  const [status, setStatus] = useState<'negotiating' | 'processing' | 'counter-offer' | 'failed'>('negotiating');
  
  const estimatedFare = routeInfo.estimatedFare || 0;
  const breakdown = routeInfo.fareBreakdown;

  // El pasajero negocia hacia abajo. El mínimo es un 20% menos. El máximo es la tarifa estimada.
  const minFare = Math.max(1, Math.floor(estimatedFare * (1 - PASSENGER_NEGOTIATION_RANGE)));
  const maxFare = estimatedFare; // El máximo que puede proponer el pasajero es la tarifa original
  
  const [proposedFare, setProposedFare] = useState(maxFare); // La propuesta inicial es la tarifa completa
  const [driverResponse, setDriverResponse] = useState<{decision: string, reason: string, counterFare?: number} | null>(null);

  const { toast } = useToast();
  
  async function handleProposeFare() {
    if (!estimatedFare || !breakdown) return;
    setStatus('processing');
    setDriverResponse(null);

    try {
        const result = await negotiateFare({
            estimatedFare,
            proposedFare,
            minFare: Math.floor(estimatedFare * 0.9), // Mínimo absoluto del conductor (10% menos)
            maxFare: Math.ceil(estimatedFare * 1.2),  // Máximo que el conductor esperaría (20% más)
        });

        setDriverResponse(result);

        if(result.decision === 'accepted') {
            const finalBreakdown = { ...breakdown, total: proposedFare };
            setTimeout(() => onNegotiationComplete(proposedFare, finalBreakdown), 2000);
        } else if (result.decision === 'counter-offer' && result.counterFare) {
            setStatus('counter-offer');
            setProposedFare(result.counterFare);
        } else {
            setStatus('failed');
        }

    } catch (error) {
        console.error('La negociación de tarifa falló:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'La negociación falló. Por favor, inténtalo de nuevo.',
        });
        setStatus('failed');
    }
  }
  
  function handleAcceptCounterOffer() {
    if(driverResponse?.counterFare && breakdown) {
        const finalBreakdown = { ...breakdown, total: driverResponse.counterFare };
        onNegotiationComplete(driverResponse.counterFare, finalBreakdown);
    }
  }

  if (status === 'failed') {
    return (
        <Alert variant="destructive">
            <ShieldX className="h-4 w-4"/>
            <AlertTitle>Negociación Fallida</AlertTitle>
            <AlertDescription>
                {driverResponse?.reason || "No pudimos acordar una tarifa."}
                <div className="mt-4 flex gap-2">
                   <Button onClick={onCancel} className="w-full">
                        Empezar de Nuevo
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Dialog>
        <Alert>
          <CircleDollarSign className="h-4 w-4" />
          <AlertTitle>Tarifa Sugerida: S/{estimatedFare?.toFixed(2)}</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>
              Desliza para proponer una tarifa menor.
            </span>
            {breakdown && (
              <DialogTrigger asChild>
                <Button variant="link" size="sm" className="px-0 h-auto">
                    <List className="mr-1 h-4 w-4"/>
                    Ver desglose
                </Button>
              </DialogTrigger>
            )}
          </AlertDescription>
        </Alert>
        {breakdown && <FareBreakdownDialog breakdown={breakdown} />}
      </Dialog>


      <div className="space-y-4">
        <label htmlFor="fare-slider" className="font-medium">Tu Propuesta: <span className="text-primary font-bold text-lg">S/{proposedFare.toFixed(2)}</span></label>
        <Slider
          id="fare-slider"
          min={minFare}
          max={maxFare}
          step={0.50}
          value={[proposedFare]}
          onValueChange={(value) => setProposedFare(value[0])}
          disabled={status === 'processing' || status === 'counter-offer'}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>S/{minFare.toFixed(2)}</span>
          <span>S/{maxFare.toFixed(2)}</span>
        </div>
      </div>

      {status === 'processing' && (
         <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Enviando tu oferta...</AlertTitle>
            <AlertDescription>
                Esperando la respuesta del conductor.
            </AlertDescription>
        </Alert>
      )}

      {driverResponse && status !== 'processing' && (
        <Alert variant={driverResponse.decision === 'accepted' ? 'default' : 'destructive'}>
            {driverResponse.decision === 'accepted' ? <ThumbsUp className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            <AlertTitle>El conductor dice: "{driverResponse.decision.replace('-', ' ')}"</AlertTitle>
            <AlertDescription>
                {driverResponse.reason}
            </AlertDescription>
        </Alert>
      )}

      {status === 'counter-offer' && driverResponse?.counterFare && (
        <div className="p-4 border rounded-lg bg-secondary/50 space-y-3">
            <p className="text-center font-semibold">Contraoferta del Conductor: S/{driverResponse.counterFare.toFixed(2)}</p>
            <div className="flex gap-2">
                <Button onClick={handleAcceptCounterOffer} className="w-full">Aceptar Contraoferta</Button>
                <Button onClick={onCancel} variant="outline" className="w-full">Cancelar</Button>
            </div>
        </div>
      )}
      
      {status === 'negotiating' && (
        <div className="flex gap-2">
            <Button onClick={handleProposeFare} className="w-full">
              Proponer Tarifa
            </Button>
            <Button onClick={onCancel} variant="outline" className="w-full">
              Cancelar
            </Button>
        </div>
      )}

    </div>
  );
}

