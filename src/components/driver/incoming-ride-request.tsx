"use client";

import { Car, Star, DollarSign } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/lib/types";

interface IncomingRideRequestProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  passenger: User;
  pickup: string;
  dropoff: string;
  fare: number;
  requestTimeLeft: number;
  isCountering: boolean;
  counterOfferAmount: number;
  onCounterOfferChange: (amount: number) => void;
  onAccept: () => void;
  onReject: () => void;
  onStartCounterOffer: () => void;
  onSubmitCounterOffer: () => void;
  onCancelCounterOffer: () => void;
}

export function IncomingRideRequest({
  isOpen,
  onOpenChange,
  passenger,
  pickup,
  dropoff,
  fare,
  requestTimeLeft,
  isCountering,
  counterOfferAmount,
  onCounterOfferChange,
  onAccept,
  onReject,
  onStartCounterOffer,
  onSubmitCounterOffer,
  onCancelCounterOffer,
}: IncomingRideRequestProps) {
  const handleCounterOfferSubmit = () => {
    onSubmitCounterOffer();
  };

  const handleStartCounterOffer = () => {
    onStartCounterOffer();
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isCountering) onReject();
        onOpenChange(open);
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto"
      >
        <SheetHeader className="space-y-3">
          <SheetTitle className="text-2xl font-bold text-blue-800 flex items-center gap-2">
            <Car className="h-6 w-6" />
            ¡Nueva Solicitud!
          </SheetTitle>
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
            <span className="text-sm font-medium text-gray-700">
              Tiempo restante:
            </span>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full animate-pulse ${
                  requestTimeLeft <= 10 ? "bg-red-500" : "bg-blue-500"
                }`}
              ></div>
              <span
                className={`text-2xl font-bold tabular-nums ${
                  requestTimeLeft <= 10 ? "text-red-600" : "text-blue-600"
                }`}
              >
                {requestTimeLeft}s
              </span>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Información del Pasajero */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
            <Avatar className="h-12 w-12 ring-2 ring-blue-500">
              <AvatarImage src={passenger.avatarUrl} alt={passenger.name} />
              <AvatarFallback className="bg-blue-500 text-white font-semibold">
                {passenger.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{passenger.name}</p>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{passenger.rating?.toFixed(1) || "Nuevo"}</span>
              </div>
            </div>
          </div>

          {/* Detalles del Viaje */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full ring-2 ring-green-200"></div>
                <div className="w-0.5 h-8 bg-gradient-to-b from-green-500 to-red-500"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full ring-2 ring-red-200"></div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide">
                    Origen
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {pickup}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-700 uppercase tracking-wide">
                    Destino
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {dropoff}
                  </p>
                </div>
              </div>
            </div>

            {/* Tarifa Destacada */}
            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-300 shadow-sm">
              <p className="text-xs text-center text-gray-600 uppercase tracking-wide mb-1">
                Tarifa Propuesta
              </p>
              <p className="text-4xl font-bold text-center text-blue-700">
                S/{fare.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-2 mt-4">
            {isCountering ? (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <Label
                    htmlFor="counter-offer"
                    className="text-sm font-medium text-gray-700"
                  >
                    Tu contraoferta (S/)
                  </Label>
                  <Input
                    id="counter-offer"
                    type="number"
                    step="0.10"
                    min="0"
                    value={counterOfferAmount}
                    onChange={(e) =>
                      onCounterOfferChange(Number(e.target.value))
                    }
                    className="mt-2 text-lg font-semibold text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 flex items-center justify-center gap-2"
                    onClick={handleCounterOfferSubmit}
                  >
                    <DollarSign className="h-5 w-5" />
                    Enviar Contraoferta
                  </Button>
                  <Button
                    size="lg"
                    className="w-full py-4 border-2"
                    variant="outline"
                    onClick={onCancelCounterOffer}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 text-base shadow-lg flex items-center justify-center gap-2"
                  onClick={onAccept}
                >
                  <Car className="h-5 w-5" />
                  Aceptar Viaje
                </Button>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 flex items-center justify-center gap-2"
                  onClick={handleStartCounterOffer}
                >
                  <DollarSign className="h-5 w-5" />
                  Hacer Contraoferta
                </Button>
                <Button
                  size="lg"
                  className="w-full py-4 border-2 flex items-center justify-center gap-2"
                  variant="outline"
                  onClick={onReject}
                >
                  Rechazar
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
