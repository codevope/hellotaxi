'use server';

/**
 * @fileOverview This file defines a Genkit flow for assisting an admin in resolving a user claim.
 *
 * - assistClaimResolution - Generates a suggested response based on claim details.
 * - AssistClaimResolutionInput - The input type for the function.
 * - AssistClaimResolutionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssistClaimResolutionInputSchema = z.object({
  reason: z.string().describe('El motivo principal del reclamo.'),
  details: z.string().describe('La descripción detallada del problema proporcionada por el usuario.'),
});
export type AssistClaimResolutionInput = z.infer<typeof AssistClaimResolutionInputSchema>;

const AssistClaimResolutionOutputSchema = z.object({
  suggestedResponse: z.string().describe('Un borrador de respuesta sugerido para que el administrador lo use o modifique.'),
});
export type AssistClaimResolutionOutput = z.infer<typeof AssistClaimResolutionOutputSchema>;

export async function assistClaimResolution(
  input: AssistClaimResolutionInput
): Promise<AssistClaimResolutionOutput> {
  return assistClaimResolutionFlow(input);
}

const assistClaimResolutionPrompt = ai.definePrompt({
  name: 'assistClaimResolutionPrompt',
  input: { schema: AssistClaimResolutionInputSchema },
  output: { schema: AssistClaimResolutionOutputSchema },
  prompt: `Eres un agente experto de soporte al cliente para la aplicación "Hello Taxi". Tu tarea es ayudar a un administrador a resolver un reclamo de un usuario.
  
  Analiza el siguiente reclamo y redacta un borrador de respuesta claro, empático y orientado a la solución. La respuesta debe ser para uso interno del administrador, para que él la revise y, si es necesario, la envíe al cliente.

  **Detalles del Reclamo:**
  - **Motivo:** {{reason}}
  - **Descripción del Usuario:** "{{details}}"

  **Instrucciones para tu respuesta:**
  1.  **Analiza la Situación:** Comprende la naturaleza del problema (ej., objeto olvidado, problema de tarifa, mala conducta del conductor).
  2.  **Propón Pasos a Seguir:** Sugiere los próximos pasos que el administrador debería tomar (ej., "Contactar al conductor para localizar el objeto", "Verificar el desglose de la tarifa del viaje", "Revisar el historial de calificaciones del conductor").
  3.  **Redacta una Nota Interna:** Escribe un borrador de la nota o respuesta que el administrador guardará en el sistema. Debe ser concisa y profesional. Si es una acción a tomar, descríbela. Si es una comunicación para el cliente, usa un tono amigable y resolutivo.

  Genera la respuesta sugerida en el campo 'suggestedResponse'.`,
});

const assistClaimResolutionFlow = ai.defineFlow(
  {
    name: 'assistClaimResolutionFlow',
    inputSchema: AssistClaimResolutionInputSchema,
    outputSchema: AssistClaimResolutionOutputSchema,
  },
  async (input) => {
    const { output } = await assistClaimResolutionPrompt(input);
    return output!;
  }
);
