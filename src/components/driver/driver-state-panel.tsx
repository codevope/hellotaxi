"use client";
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Car, Siren, MessageCircle } from 'lucide-react';
import { IncomingRideRequest } from '@/components/driver/incoming-ride-request';
import { ActiveRideCard } from '@/components/driver/active-ride-card';
import RatingForm from '@/components/rating-form';
import type { User } from '@/lib/types';
import type { EnrichedRide } from '@/hooks/driver/use-driver-active-ride';
import { Button } from '@/components/ui/button';
import Chat from '@/components/chat';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface DriverStatePanelProps {
  incomingRequest: any | null;
  requestTimeLeft: number;
  isCountering: boolean;
  counterOfferAmount: number;
  setCounterOfferAmount: (n: number) => void;
  acceptRequest: () => void;
  rejectRequest: () => void;
  startCounterMode: () => void;
  submitCounterOffer: () => void;
  activeRide: EnrichedRide | null;
  updateRideStatus: (status: 'arrived' | 'in-progress' | 'completed') => void;
  isCompletingRide: boolean;
  completedRideForRating: EnrichedRide | null;
  onRatingSubmit: (id: string, rating: number, comment: string) => void;
  isRatingSubmitting: boolean;
  isDriverChatOpen: boolean;
  setIsDriverChatOpen: (o: boolean) => void;
  chatMessages: any[];
  onSendMessage: (text: string) => void;
  onSos: () => void;
  passengerNameForChat?: string;
}

export function DriverStatePanel(props: DriverStatePanelProps) {
  const {
    incomingRequest,
    requestTimeLeft,
    isCountering,
    counterOfferAmount,
    setCounterOfferAmount,
    acceptRequest,
    rejectRequest,
    startCounterMode,
    submitCounterOffer,
    activeRide,
    updateRideStatus,
    isCompletingRide,
    completedRideForRating,
    onRatingSubmit,
    isRatingSubmitting,
    isDriverChatOpen,
    setIsDriverChatOpen,
    chatMessages,
    onSendMessage,
    onSos,
    passengerNameForChat,
  } = props;

  if (incomingRequest) {
    return (
      <IncomingRideRequest
        isOpen={!!incomingRequest}
        onOpenChange={() => {}}
        passenger={incomingRequest.passenger}
        pickup={incomingRequest.pickup}
        dropoff={incomingRequest.dropoff}
        fare={incomingRequest.fare}
        requestTimeLeft={requestTimeLeft}
        isCountering={isCountering}
        counterOfferAmount={counterOfferAmount}
        onCounterOfferChange={setCounterOfferAmount}
        onAccept={acceptRequest}
        onReject={rejectRequest}
        onStartCounterOffer={startCounterMode}
        onSubmitCounterOffer={submitCounterOffer}
        onCancelCounterOffer={() => setCounterOfferAmount(0)}
      />
    );
  }

  if (activeRide) {
    return (
      <>
        <ActiveRideCard
          status={activeRide.status as 'accepted' | 'arrived' | 'in-progress'}
          passenger={activeRide.passenger}
          pickup={activeRide.pickup}
          dropoff={activeRide.dropoff}
          fare={activeRide.fare}
          isCompletingRide={isCompletingRide}
          onStatusUpdate={updateRideStatus}
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-4 right-4 h-16 w-16 rounded-full shadow-2xl animate-pulse"
            >
              <Siren className="h-8 w-8" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de que quieres activar la alerta de pánico?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción notificará inmediatamente a nuestra central de seguridad. Úsalo solo en caso de una emergencia real.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={onSos}>
                Sí, Activar Alerta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Sheet open={isDriverChatOpen} onOpenChange={setIsDriverChatOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="absolute bottom-4 left-4 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90">
              <MessageCircle className="h-7 w-7" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-sm p-0">
            <SheetHeader className="p-4 border-b text-left">
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span>Chat con {passengerNameForChat}</span>
              </SheetTitle>
            </SheetHeader>
            <Chat messages={chatMessages} onSendMessage={onSendMessage} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  if (completedRideForRating) {
    return (
      <RatingForm
        userToRate={completedRideForRating.passenger}
        isDriver={false}
        onSubmit={(rating, comment) => onRatingSubmit(completedRideForRating.passenger.id, rating, comment)}
        isSubmitting={isRatingSubmitting}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          <span>Esperando Solicitudes</span>
        </CardTitle>
      </CardHeader>
      <CardDescription className="px-6 pb-6">
        <Alert>
          <AlertTitle>No hay solicitudes pendientes</AlertTitle>
          <AlertDescription>
            Cuando un pasajero solicite un viaje, aparecerá aquí.
          </AlertDescription>
        </Alert>
      </CardDescription>
    </Card>
  );
}
