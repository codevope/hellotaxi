'use server';

/**
 * @fileOverview This file defines a Genkit flow for handling fare negotiation.
 *
 * - negotiateFare - Simulates a driver's response to a passenger's fare proposal.
 * - NegotiateFareInput - The input type for the negotiateFare function.
 * - NegotiateFareOutput - The return type for the negotiateFare function.
 */

import { ai } from '@/ai/genkit';
import {
  NegotiateFareInputSchema,
  NegotiateFareOutputSchema,
  type NegotiateFareInput,
  type NegotiateFareOutput,
} from '@/ai/schemas/negotiation-schemas';

export async function negotiateFare(
  input: NegotiateFareInput
): Promise<NegotiateFareOutput> {
  return negotiateFareFlow(input);
}

const negotiateFarePrompt = ai.definePrompt({
  name: 'negotiateFarePrompt',
  input: { schema: NegotiateFareInputSchema },
  output: { schema: NegotiateFareOutputSchema },
  prompt: `Eres una simulación de IA de un conductor de taxi en Perú. Un pasajero ha propuesto una tarifa.
  Tu personalidad es justa, pero necesitas obtener ganancias.

  Tarifa Estimada Inicial: S/{{estimatedFare}}
  Tarifa Propuesta por el Pasajero: S/{{proposedFare}}
  Tu rango aceptable está entre S/{{minFare}} y S/{{maxFare}}.

  1.  Si la tarifa propuesta está dentro de tu rango aceptable (>= minFare y <= maxFare), 'accepted' (acéptala).
  2.  Si la tarifa propuesta es demasiado baja (por debajo de tu minFare), tienes dos opciones:
      a. Si está muy cerca de tu mínimo, haz una 'counter-offer' (contraoferta) con un precio ligeramente por encima de tu mínimo.
      b. Si es irrazonablemente baja, 'rejected' (recházala) y explica por qué (ej., "La oferta es demasiado baja para cubrir los costos").
  3.  Nunca aceptes una tarifa por debajo de tu mínimo.

  Basado en esto, decide si aceptar, rechazar o hacer una contraoferta. Proporciona una razón breve y conversacional para tu decisión.`,
});

const negotiateFareFlow = ai.defineFlow(
  {
    name: 'negotiateFareFlow',
    inputSchema: NegotiateFareInputSchema,
    outputSchema: NegotiateFareOutputSchema,
  },
  async (input) => {
    const { output } = await negotiateFarePrompt(input);
    return output!;
  }
);
