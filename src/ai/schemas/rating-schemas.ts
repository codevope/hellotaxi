import { z } from 'genkit';

export const ProcessRatingInputSchema = z.object({
  ratedUserId: z.string().describe('El ID del usuario (conductor o pasajero) que está siendo calificado.'),
  rating: z.number().min(1).max(5).describe('La calificación en estrellas, de 1 a 5.'),
  comment: z.string().optional().describe('El comentario opcional dejado por el calificador.'),
  isDriver: z.boolean().describe('Indica si el usuario calificado es un conductor.'),
});
export type ProcessRatingInput = z.infer<typeof ProcessRatingInputSchema>;

export const ProcessRatingOutputSchema = z.object({
  success: z.boolean().describe('Indica si la calificación se procesó correctamente.'),
  newAverageRating: z.number().describe('La nueva calificación promedio del usuario.'),
});
export type ProcessRatingOutput = z.infer<typeof ProcessRatingOutputSchema>;
