
'use client';

import { useEffect, useState } from 'react';
import { negotiateFare } from '@/ai/flows/negotiate-fare';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CircleDollarSign, ShieldX, MessageSquare, ThumbsUp, Info, List, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import type { FareBreakdown } from '@/lib/types';
import type { RouteInfo } from '@/hooks/use-eta-calculator';
import { Separator } from './ui/separator';

const PASSENGER_NEGOTIATION_RANGE = 0.20; // Pasajero puede ofrecer hasta 20% menos

type FareNegotiationProps = {
  routeInfo: RouteInfo;
  onNegotiationComplete: (finalFare: number, breakdown: FareBreakdown) => void;
  onCancel: () => void;
};


export default function FareNegotiation({
  routeInfo,
  onNegotiationComplete,
  onCancel,
}: FareNegotiationProps) {
  const [status, setStatus] = useState<'negotiating' | 'processing' | 'counter-offer' | 'failed'>('negotiating');
  
  const estimatedFare = routeInfo.estimatedFare || 0;
  const breakdown = routeInfo.fareBreakdown;
  const couponDiscount = breakdown?.couponDiscount || 0;

  // La negociación se hace sobre la tarifa antes del descuento
  const baseFareForNegotiation = estimatedFare + couponDiscount;

  // El pasajero negocia hacia abajo. El mínimo es un 20% menos. El máximo es la tarifa estimada.
  const minFare = Math.max(1, Math.floor(baseFareForNegotiation * (1 - PASSENGER_NEGOTIATION_RANGE)));
  const maxFare = baseFareForNegotiation; // El máximo que puede proponer el pasajero es la tarifa original
  
  const [proposedFare, setProposedFare] = useState(maxFare); // La propuesta inicial es la tarifa completa
  const [driverResponse, setDriverResponse] = useState<{decision: string, reason: string, counterFare?: number} | null>(null);

  const { toast } = useToast();
  
  async function handleProposeFare() {
    if (!estimatedFare || !breakdown) return;
    setStatus('processing');
    setDriverResponse(null);

    try {
        const result = await negotiateFare({
            estimatedFare: baseFareForNegotiation,
            proposedFare,
            minFare: Math.floor(baseFareForNegotiation * 0.9), // Mínimo absoluto del conductor (10% menos)
            maxFare: Math.ceil(baseFareForNegotiation * 1.2),  // Máximo que el conductor esperaría (20% más)
        });

        setDriverResponse(result);

        if(result.decision === 'accepted') {
            const finalFare = proposedFare - couponDiscount;
            const finalBreakdown = { ...breakdown, total: finalFare };
            setTimeout(() => onNegotiationComplete(finalFare, finalBreakdown), 2000);
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
        const finalFare = driverResponse.counterFare - couponDiscount;
        const finalBreakdown = { ...breakdown, total: finalFare };
        onNegotiationComplete(finalFare, finalBreakdown);
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
      <Alert>
        <CircleDollarSign className="h-4 w-4" />
        <AlertTitle>Tarifa Sugerida: S/{baseFareForNegotiation?.toFixed(2)}</AlertTitle>
        <AlertDescription>
          Desliza para proponer una tarifa menor.
        </AlertDescription>
      </Alert>

      {couponDiscount > 0 && (
          <Alert variant="default" className="border-green-500 bg-green-50 text-green-800">
            <Tag className="h-4 w-4 text-green-600" />
            <AlertTitle>Cupón Aplicado</AlertTitle>
            <AlertDescription>
                Se restará un descuento de S/{couponDiscount.toFixed(2)} de tu tarifa final acordada.
            </AlertDescription>
        </Alert>
      )}

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

      {driverResponse?.decision === 'accepted' && (
          <div className="p-4 border rounded-lg bg-green-50 space-y-2 text-center">
              <p className="text-sm">Tarifa Acordada: S/{proposedFare.toFixed(2)}</p>
              <p className="text-sm">Descuento Cupón: -S/{couponDiscount.toFixed(2)}</p>
              <Separator />
              <p className="font-bold text-lg">Total a Pagar: S/{(proposedFare - couponDiscount).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">Buscando conductor para confirmar tu viaje...</p>
          </div>
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

