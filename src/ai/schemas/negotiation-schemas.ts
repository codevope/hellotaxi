import { z } from 'genkit';

export const NegotiateFareInputSchema = z.object({
  estimatedFare: z.number().describe('La tarifa estimada inicialmente.'),
  proposedFare: z.number().describe("La tarifa propuesta por el pasajero."),
  minFare: z.number().describe('La tarifa mínima aceptable para el conductor.'),
  maxFare: z.number().describe('La tarifa máxima aceptable para el conductor.'),
});
export type NegotiateFareInput = z.infer<typeof NegotiateFareInputSchema>;

export const NegotiateFareOutputSchema = z.object({
  decision: z
    .enum(['accepted', 'rejected', 'counter-offer'])
    .describe("La decisión del conductor sobre la tarifa propuesta (aceptada, rechazada, contraoferta)."),
  counterFare: z
    .number()
    .optional()
    .describe(
      'La contraoferta de tarifa, si la decisión es "counter-offer".'
    ),
  reason: z
    .string()
    .describe('Una breve explicación de la decisión por parte del conductor.'),
});
export type NegotiateFareOutput = z.infer<typeof NegotiateFareOutputSchema>;
