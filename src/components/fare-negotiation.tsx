
'use client';

import { useEffect, useState } from 'react';
import { estimateRideFareDeterministic } from '@/ai/flows/estimate-ride-fare';
import { negotiateFare } from '@/ai/flows/negotiate-fare';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CircleDollarSign, Info, ShieldX, MessageSquare, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import type { FareBreakdown } from '@/lib/types';

const NEGOTIATION_RANGE = 0.15; // 15%

type FareNegotiationProps = {
  rideDetails: {
    pickup: string;
    dropoff: string;
    serviceType: 'economy' | 'comfort' | 'exclusive';
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
      // These are simplified values for the MVP
      const distanceKm = Math.floor(Math.random() * 20) + 5; // 5-25 km
      const durationMinutes = Math.floor(Math.random() * 30) + 10; // 10-40 min
      const rideDate = new Date();
      const peakTime = rideDate.getHours() > 16; // Peak time after 4 PM
      type EstimateRideFareInput = Parameters<typeof estimateRideFareDeterministic>[0];

      const fareInput: EstimateRideFareInput = {
        distanceKm,
        durationMinutes,
        peakTime,
        serviceType: rideDetails.serviceType,
        rideDate: rideDate.toISOString(),
      };

      try {
        const result = await estimateRideFareDeterministic(fareInput);
        const fare = result.estimatedFare;
        const lowerBound = Math.max(1, Math.floor(fare * (1 - NEGOTIATION_RANGE)));
        const upperBound = Math.ceil(fare * (1 + NEGOTIATION_RANGE));

        setEstimatedFare(fare);
        setBreakdown(result.breakdown);
        setProposedFare(fare);
        setMinFare(lowerBound);
        setMaxFare(upperBound);
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
            minFare: Math.floor(estimatedFare * 0.9), // Driver's absolute minimum is 10% less
            maxFare: Math.ceil(estimatedFare * 1.2), // Driver's absolute maximum is 20% more
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
        <AlertTitle>Tarifa Estimada: S/{estimatedFare?.toFixed(2)}</AlertTitle>
        <AlertDescription>
          Puedes proponer una tarifa entre S/{minFare.toFixed(2)} y S/{maxFare.toFixed(2)}.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <label htmlFor="fare-slider" className="font-medium">Tu Propuesta: <span className="text-primary font-bold text-lg">S/{proposedFare.toFixed(2)}</span></label>
        <Slider
          id="fare-slider"
          min={minFare}
          max={maxFare}
          step={0.5}
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
