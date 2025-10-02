"use client";

import { Car } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/price-display";
import type { User, EnrichedDriver } from "@/lib/types";

interface ActiveRideCardProps {
  status: "accepted" | "arrived" | "in-progress";
  passenger: User;
  dropoff: string;
  fare: number;
  isCompletingRide: boolean;
  onStatusUpdate: (
    newStatus: "arrived" | "in-progress" | "completed"
  ) => void;
}

export function ActiveRideCard({
  status,
  passenger,
  dropoff,
  fare,
  isCompletingRide,
  onStatusUpdate,
}: ActiveRideCardProps) {
  const getStatusDescription = () => {
    switch (status) {
      case "accepted":
        return "Dirígete al punto de recojo del pasajero.";
      case "arrived":
        return "Esperando al pasajero.";
      case "in-progress":
        return "Llevando al pasajero a su destino.";
      default:
        return "";
    }
  };

  const getActionButton = () => {
    switch (status) {
      case "accepted":
        return (
          <Button
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold"
            onClick={() => onStatusUpdate("arrived")}
            disabled={isCompletingRide}
          >
            ✅ He Llegado
          </Button>
        );
      case "arrived":
        return (
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold"
            onClick={() => onStatusUpdate("in-progress")}
            disabled={isCompletingRide}
          >
            🚗 Iniciar Viaje
          </Button>
        );
      case "in-progress":
        return (
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold"
            onClick={() => onStatusUpdate("completed")}
            disabled={isCompletingRide}
          >
            🏁 Finalizar Viaje
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-primary border-2 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Car className="h-6 w-6" />
          <span>Viaje Activo</span>
        </CardTitle>
        <CardDescription className="text-white/90">
          {getStatusDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Información del pasajero */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-[#049DD9]">
                <AvatarImage src={passenger.avatarUrl} alt={passenger.name} />
                <AvatarFallback className="bg-gradient-to-br from-[#0477BF] to-[#049DD9] text-white font-bold text-lg">
                  {passenger.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-lg text-gray-900">
                  {passenger.name}
                </p>
                <p className="text-sm text-gray-600">
                  Destino:{" "}
                  <span className="font-medium text-gray-800">{dropoff}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <PriceDisplay amount={fare} label="Tarifa" size="md" variant="highlight" />
            </div>
          </div>
        </div>

        {/* Botón de acción según el estado */}
        {getActionButton()}
      </CardContent>
    </Card>
  );
}
