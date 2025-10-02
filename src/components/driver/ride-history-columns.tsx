"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUpDown, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/price-display";
import { RideStatusBadge } from "@/components/ride-status-badge";
import type { Ride, User, EnrichedDriver } from "@/lib/types";

// EnrichedRide type for history table
type EnrichedRide = Omit<Ride, "passenger" | "driver"> & {
  passenger: User;
  driver: EnrichedDriver;
};

export const columns: ColumnDef<EnrichedRide>[] = [
  {
    accessorKey: "passenger",
    header: "Pasajero",
    cell: ({ row }) => {
      const passenger = row.original.passenger;
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0477BF] to-[#049DD9] text-xs font-bold text-white">
            {typeof passenger === "object" && passenger?.name
              ? passenger.name.charAt(0).toUpperCase()
              : "?"}
          </div>
          <span className="font-medium">
            {typeof passenger === "object" && passenger?.name
              ? passenger.name
              : "Desconocido"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "route",
    header: "Ruta",
    cell: ({ row }) => {
      return (
        <div className="space-y-2 min-w-[200px]">
          {/* Punto de Recojo */}
          <div className="flex items-start gap-2">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600">
              <div className="h-2 w-2 rounded-full bg-white"></div>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Origen
              </p>
              <p className="text-xs text-gray-700">{row.original.pickup}</p>
            </div>
          </div>
          {/* Línea conectora */}
          <div className="ml-2 h-4 w-0.5 bg-gradient-to-b from-emerald-400 to-[#049DD9]"></div>
          {/* Destino */}
          <div className="flex items-start gap-2">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#049DD9] to-[#0477BF]">
              <MapPin className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0477BF]">
                Destino
              </p>
              <p className="text-xs text-gray-700">{row.original.dropoff}</p>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-[#049DD9]/10"
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {format(new Date(row.original.date), "dd/MM/yyyy", { locale: es })}
          <div className="text-xs text-gray-500">
            {format(new Date(row.original.date), "HH:mm", { locale: es })}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "fare",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-[#049DD9]/10"
        >
          Tarifa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <PriceDisplay
          amount={row.original.fare}
          size="sm"
          variant="highlight"
        />
      );
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      return <RideStatusBadge status={row.original.status} />;
    },
  },
];
