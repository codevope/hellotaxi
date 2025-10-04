"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUpDown, Car, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import type { Ride, User, Driver, Vehicle } from "@/lib/types";

type EnrichedRide = Omit<Ride, "driver" | "passenger" | "vehicle"> & {
  driver?: Driver;
  passenger?: User;
  vehicle?: Vehicle;
};

const statusConfig: Record<Ride["status"], { label: string; variant: "secondary" | "default" | "destructive" }> = {
  completed: { label: "Completado", variant: "secondary" },
  "in-progress": { label: "En Progreso", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  searching: { label: "Buscando", variant: "default" },
  accepted: { label: "Aceptado", variant: "default" },
  arrived: { label: "Ha llegado", variant: "default" },
  "counter-offered": { label: "Contraoferta", variant: "default" },
};

export const columns: ColumnDef<EnrichedRide>[] = [
  {
    accessorKey: "passenger",
    id: "passenger",
    header: "Pasajero",
    accessorFn: (row) => row.passenger?.name || "Sin asignar",
    cell: ({ row }) => {
      const passenger = row.original.passenger;
      if (!passenger) return <span className="text-muted-foreground text-xs">No asignado</span>;

      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={passenger.avatarUrl} alt={passenger.name} />
            <AvatarFallback>{passenger.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{passenger.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "driver",
    header: "Conductor",
    cell: ({ row }) => {
      const driver = row.original.driver;
      if (!driver) return <span className="text-muted-foreground text-xs">No asignado</span>;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={driver.avatarUrl} alt={driver.name} />
            <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{driver.name}</span>
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
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div>{format(new Date(row.original.date), "dd/MM/yyyy HH:mm")}</div>
    ),
  },
  {
    accessorKey: "fare",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tarifa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium text-right">
        S/{row.original.fare.toFixed(2)}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const config = statusConfig[row.original.status];
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
];
