import { z } from "genkit";
import type { FareBreakdown } from "@/lib/types";

export const FareBreakdownSchema = z.object({
  baseFare: z.number(),
  distanceCost: z.number(),
  durationCost: z.number(),
  serviceMultiplier: z.number(),
  serviceCost: z.number(),
  peakSurcharge: z.number(),
  specialDaySurcharge: z.number(),
  couponDiscount: z.number(),
  subtotal: z.number(),
  total: z.number(),
});

export const EstimateRideFareInputSchema = z.object({
  distanceKm: z.number().describe("La distancia del viaje en kilómetros."),
  durationMinutes: z.number().describe("La duración del viaje en minutos."),
  peakTime: z
    .boolean()
    .describe("Si el viaje es durante horas punta (mayor demanda)."),
  serviceType: z
    .enum(["economy", "comfort", "exclusive"])
    .describe("El tipo de servicio de viaje seleccionado."),
  rideDate: z
    .string()
    .optional()
    .describe(
      "La fecha del viaje en formato ISO para verificar tarifas especiales."
    ),
});
export type EstimateRideFareInput = z.infer<typeof EstimateRideFareInputSchema>;

export const EstimateRideFareOutputSchema = z.object({
  estimatedFare: z
    .number()
    .describe("La tarifa estimada para el viaje en la moneda local (Soles)."),
  breakdown: FareBreakdownSchema.describe(
    "Un desglose detallado de cómo se calculó la tarifa."
  ),
});

export type EstimateRideFareOutput = {
  estimatedFare: number;
  breakdown: FareBreakdown;
};
