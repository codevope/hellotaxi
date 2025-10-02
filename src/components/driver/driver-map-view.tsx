"use client";

import { useState } from "react";
import { MessageCircle, Siren, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import MapView from "@/components/map-view";
import Chat from "@/components/chat";
import type { Location, ChatMessage } from "@/lib/types";

interface DriverMapViewProps {
  driverLocation: Location | null;
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  hasActiveRide: boolean;
  passengerName?: string;
  chatMessages: ChatMessage[];
  onSosConfirm: () => void;
  onSendMessage: (text: string) => void;
}

export function DriverMapView({
  driverLocation,
  pickupLocation,
  dropoffLocation,
  hasActiveRide,
  passengerName,
  chatMessages,
  onSosConfirm,
  onSendMessage,
}: DriverMapViewProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-[60vh] rounded-xl overflow-hidden shadow-lg relative">
      <MapView
        driverLocation={driverLocation}
        pickupLocation={pickupLocation || null}
        dropoffLocation={dropoffLocation || null}
        interactive={false}
      />

      {hasActiveRide && (
        <>
          {/* Botón de SOS */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-4 right-4 h-16 w-16 rounded-full shadow-2xl animate-pulse hover:scale-110 transition-transform"
              >
                <Siren className="h-8 w-8" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alerta de Pánico
                </AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que quieres activar la alerta de pánico?
                  Esta acción notificará inmediatamente a nuestra central de
                  seguridad. Úsalo solo en caso de una emergencia real.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={onSosConfirm}
                >
                  Sí, Activar Alerta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Botón de Chat */}
          <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="absolute bottom-4 left-4 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 hover:scale-110 transition-transform"
              >
                <MessageCircle className="h-7 w-7" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-sm p-0">
              <SheetHeader className="p-4 border-b text-left bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] text-white">
                <SheetTitle className="flex items-center gap-2 text-white">
                  <MessageCircle className="h-5 w-5" />
                  <span>Chat con {passengerName || "Pasajero"}</span>
                </SheetTitle>
              </SheetHeader>
              <Chat messages={chatMessages} onSendMessage={onSendMessage} />
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
