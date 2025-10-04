interface PriceDisplayProps {
  amount: number;
  label?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "gradient" | "highlight" | "muted";
  showCurrency?: boolean;
}

export function PriceDisplay({
  amount,
  label,
  size = "md",
  variant = "default",
  showCurrency = true,
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  const labelSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const variantClasses = {
    default: "text-gray-900",
    gradient: "bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] bg-clip-text text-transparent",
    highlight: "text-[#0477BF]",
    muted: "text-gray-600",
  };

  const formatPrice = (value: number) => {
    return value.toFixed(2);
  };

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className={`${labelSizeClasses[size]} text-gray-500 mb-1`}>
          {label}
        </span>
      )}
      <div className="flex items-baseline gap-1">
        {showCurrency && (
          <span
            className={`${
              size === "xl"
                ? "text-2xl"
                : size === "lg"
                ? "text-lg"
                : size === "md"
                ? "text-base"
                : "text-xs"
            } ${variantClasses[variant]} font-semibold`}
          >
            S/
          </span>
        )}
        <span className={`${sizeClasses[size]} ${variantClasses[variant]} font-bold`}>
          {formatPrice(amount)}
        </span>
      </div>
    </div>
  );
}
