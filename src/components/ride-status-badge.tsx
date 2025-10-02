import { Badge } from "@/components/ui/badge";

interface RideStatusBadgeProps {
  status: string;
}

export function RideStatusBadge({ status }: RideStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Buscando conductor",
          className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        };
      case "accepted":
        return {
          label: "Conductor aceptado",
          className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        };
      case "arrived":
        return {
          label: "Conductor en origen",
          className: "bg-green-500/10 text-green-600 border-green-500/20",
        };
      case "in-progress":
        return {
          label: "En camino",
          className: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        };
      case "completed":
        return {
          label: "Completado",
          className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        };
      case "cancelled":
        return {
          label: "Cancelado",
          className: "bg-red-500/10 text-red-600 border-red-500/20",
        };
      default:
        return {
          label: status,
          className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      variant="outline"
      className={`${config.className} font-medium px-3 py-1 text-sm rounded-full`}
    >
      {config.label}
    </Badge>
  );
}
