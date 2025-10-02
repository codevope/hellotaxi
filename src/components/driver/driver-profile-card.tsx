"use client";

import { Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { EnrichedDriver } from "@/lib/types";

interface DriverProfileCardProps {
  driver: EnrichedDriver;
  completedRidesCount: number;
}

export function DriverProfileCard({
  driver,
  completedRidesCount,
}: DriverProfileCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Mi Perfil y Estadísticas</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        {/* Información del Conductor */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">
            Información del Conductor
          </h3>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-[#049DD9]/20">
              <AvatarImage src={driver.avatarUrl} alt={driver.name} />
              <AvatarFallback className="bg-gradient-to-br from-[#0477BF] to-[#049DD9] text-white text-2xl font-bold">
                {driver.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-2xl font-bold text-gray-900">{driver.name}</p>
              <p className="text-muted-foreground capitalize text-sm">
                Servicio: {driver.vehicle.serviceType}
              </p>
            </div>
          </div>

          {/* Vehículo */}
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-base text-gray-700 mb-2">
              🚗 Mi Vehículo
            </h3>
            <p className="text-gray-900 font-medium">
              {driver.vehicle.brand} {driver.vehicle.model}
            </p>
            <p className="font-mono bg-white p-2 rounded-md inline-block mt-2 text-sm font-bold text-[#0477BF] border border-[#049DD9]/30">
              {driver.vehicle.licensePlate}
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Estadísticas</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Viajes Completados */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 text-center shadow-sm">
              <p className="text-4xl font-extrabold text-green-700">
                {completedRidesCount}
              </p>
              <p className="text-sm text-green-600 font-medium mt-1">
                Viajes Completados
              </p>
            </div>

            {/* Calificación */}
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                <p className="text-4xl font-extrabold text-yellow-700">
                  {(driver.rating || 0).toFixed(1)}
                </p>
              </div>
              <p className="text-sm text-yellow-600 font-medium mt-1">
                Tu Calificación
              </p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total de viajes:</span>
                <span className="font-bold text-gray-900">
                  {driver.totalRides || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado de documentos:</span>
                <span
                  className={`font-bold ${
                    driver.documentsStatus === "approved"
                      ? "text-green-600"
                      : driver.documentsStatus === "pending"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {driver.documentsStatus === "approved"
                    ? "✅ Aprobados"
                    : driver.documentsStatus === "pending"
                    ? "⏳ Pendiente"
                    : "❌ Rechazados"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
