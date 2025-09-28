
'use client';

import { useEffect, useState } from 'react';
import { estimateRideFareDeterministic } from '@/ai/flows/estimate-ride-fare';
import { negotiateFare } from '@/ai/flows/negotiate-fare';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CircleDollarSign, ShieldX, MessageSquare, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import type { FareBreakdown } from '@/lib/types';

const PASSENGER_NEGOTIATION_RANGE = 0.20; // Pasajero puede ofrecer hasta 20% menos

type FareNegotiationProps = {
  rideDetails: {
    pickup: string;
    dropoff: string;
    serviceType: 'economy' | 'comfort' | 'exclusive';
    distanceKm: number;
    durationMinutes: number;
  };
  onNegotiationComplete: (finalFare: number, breakdown: FareBreakdown) => void;
  onCancel: () => void;
};

export default function FareNegotiation({
  rideDetails,
  onNegotiationComplete,
  onCancel,
}: FareNegotiationProps) {
  const [status, setStatus] = useState<'estimating' | 'negotiating' | 'processing' | 'counter-offer' | 'failed'>(
    'estimating'
  );
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<FareBreakdown | null>(null);
  const [minFare, setMinFare] = useState(0);
  const [maxFare, setMaxFare] = useState(0);
  const [proposedFare, setProposedFare] = useState(0);
  const [driverResponse, setDriverResponse] = useState<{decision: string, reason: string, counterFare?: number} | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    async function getInitialEstimate() {
      const rideDate = new Date();
      const peakTime = rideDate.getHours() > 16; // Peak time after 4 PM
      type EstimateRideFareInput = Parameters<typeof estimateRideFareDeterministic>[0];

      const fareInput: EstimateRideFareInput = {
        distanceKm: rideDetails.distanceKm,
        durationMinutes: rideDetails.durationMinutes,
        peakTime,
        serviceType: rideDetails.serviceType,
        rideDate: rideDate.toISOString(),
      };

      try {
        const result = await estimateRideFareDeterministic(fareInput);
        const fare = result.estimatedFare;
        // El pasajero negocia hacia abajo. El mínimo es un 20% menos. El máximo es la tarifa estimada.
        const lowerBound = Math.max(1, Math.floor(fare * (1 - PASSENGER_NEGOTIATION_RANGE)));
        
        setEstimatedFare(fare);
        setBreakdown(result.breakdown);
        setProposedFare(fare); // La propuesta inicial es la tarifa completa
        setMinFare(lowerBound);
        setMaxFare(fare); // El máximo que puede proponer el pasajero es la tarifa original
        setStatus('negotiating');
      } catch (error) {
        console.error('La estimación de tarifa falló:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo obtener una estimación de tarifa. Por favor, inténtalo de nuevo.',
        });
        setStatus('failed');
      }
    }
    getInitialEstimate();
  }, [rideDetails, toast]);
  
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


  if (status === 'estimating') {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Estimando tu tarifa...</AlertTitle>
        <AlertDescription>
          Por favor, espera mientras calculamos el mejor precio para tu viaje.
        </AlertDescription>
      </Alert>
    );
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
        <AlertTitle>Tarifa Sugerida: S/{estimatedFare?.toFixed(2)}</AlertTitle>
        <AlertDescription>
          Desliza para proponer una tarifa menor. Puedes ofrecer desde S/{minFare.toFixed(2)}.
        </AlertDescription>
      </Alert>

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
