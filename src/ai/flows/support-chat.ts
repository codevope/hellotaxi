"use server";

/**
 * @fileOverview This file defines a Genkit flow for an AI support agent.
 *
 * - supportChat - Responds to user queries about the app.
 * - SupportChatInput - The input type for the supportChat function.
 * - SupportChatOutput - The return type for the supportChat function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const SupportChatInputSchema = z.object({
  query: z.string().describe("La pregunta del usuario."),
  history: z
    .array(z.object({ query: z.string(), response: z.string() }))
    .optional()
    .describe("El historial de la conversación."),
});
export type SupportChatInput = z.infer<typeof SupportChatInputSchema>;

const SupportChatOutputSchema = z.object({
  response: z.string().describe("La respuesta del asistente de IA."),
});
export type SupportChatOutput = z.infer<typeof SupportChatOutputSchema>;

export async function supportChat(
  input: SupportChatInput
): Promise<SupportChatOutput> {
  return supportChatFlow(input);
}

const supportChatPrompt = ai.definePrompt({
  name: "supportChatPrompt",
  input: { schema: SupportChatInputSchema },
  output: { schema: SupportChatOutputSchema },
  prompt: `Eres un asistente de soporte de IA para la aplicación "Hello Taxi". Tu tono debe ser amigable, servicial y conciso.
  
  Tu objetivo es responder a las preguntas del usuario sobre cómo usar la aplicación y sus características.

  Aquí tienes información clave sobre la app:
  - **Negociación de Tarifas:** El usuario puede proponer una tarifa. Un conductor simulado por IA aceptará, rechazará o hará una contraoferta.
  - **Tipos de Servicio:** Ofrecemos 'Económico' (estándar), 'Confort' (más espacioso) y 'Exclusivo' (lujo).
  - **Botón de Pánico (SOS):** En caso de emergencia durante un viaje, el usuario puede presionar el botón SOS. Se notificará a una central de seguridad.
  - **Agendamiento:** Los usuarios pueden reservar viajes para una fecha y hora futuras.
  - **Calificaciones:** Al final del viaje, el usuario puede calificar al conductor.

  {{#if history}}
  Este es el historial de la conversación hasta ahora. Úsalo para mantener el contexto.
  {{#each history}}
  Usuario: {{query}}
  Asistente: {{response}}
  {{/each}}
  {{/if}}

  Pregunta del Usuario: {{query}}

  Basado en la información anterior, responde a la pregunta del usuario. Si no sabes la respuesta, di amablemente que no tienes esa información.`,
});

const supportChatFlow = ai.defineFlow(
  {
    name: "supportChatFlow",
    inputSchema: SupportChatInputSchema,
    outputSchema: SupportChatOutputSchema,
  },
  async (input) => {
    const { output } = await supportChatPrompt(input);
    return output!;
  }
);
