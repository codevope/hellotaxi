import { Star } from "lucide-react";

interface DriverRatingProps {
  rating: number;
  totalRides?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function DriverRating({
  rating,
  totalRides,
  size = "md",
  showLabel = true,
}: DriverRatingProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-yellow-500";
    if (rating >= 4.0) return "text-yellow-400";
    if (rating >= 3.5) return "text-orange-400";
    return "text-orange-500";
  };

  return (
    <div className="flex items-center gap-1">
      <Star
        className={`${getRatingColor(rating)} fill-current`}
        size={iconSizes[size]}
      />
      <span className={`${sizeClasses[size]} font-semibold text-gray-900`}>
        {rating.toFixed(1)}
      </span>
      {showLabel && totalRides !== undefined && (
        <span className={`${sizeClasses[size]} text-gray-500`}>
          ({totalRides} {totalRides === 1 ? "viaje" : "viajes"})
        </span>
      )}
    </div>
  );
}
