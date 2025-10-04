
'use server';

/**
 * @fileOverview Flujo para procesar una calificación de usuario (conductor o pasajero).
 *
 * - processRating - Calcula la nueva calificación promedio y analiza el sentimiento del comentario.
 * - ProcessRatingInput - El tipo de entrada para el flujo.
 * - ProcessRatingOutput - El tipo de salida para el flujo.
 */

import { ai } from '@/ai/genkit';
import {
  ProcessRatingInputSchema,
  ProcessRatingOutputSchema,
  type ProcessRatingInput,
  type ProcessRatingOutput,
} from '@/ai/schemas/rating-schemas';
import { doc, runTransaction, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';

const analyzeAndCorrectCommentPrompt = ai.definePrompt({
    name: 'analyzeAndCorrectCommentPrompt',
    input: { schema: z.object({ comment: z.string() }) },
    output: { schema: z.object({ 
        sentiment: z.enum(['positive', 'negative', 'neutral']),
        correctedComment: z.string().describe("El comentario original con la ortografía y gramática corregidas.") 
    }) },
    prompt: `Analiza el sentimiento del siguiente comentario y clasifícalo como 'positive', 'negative', o 'neutral'. Además, corrige cualquier error de ortografía o gramática en el comentario, pero manteniendo el tono y la intención original del usuario.
    
    Comentario original: "{{comment}}"
    
    Devuelve tanto el sentimiento como el comentario corregido.`,
});


export async function processRating(
  input: ProcessRatingInput
): Promise<ProcessRatingOutput> {
  return processRatingFlow(input);
}

const processRatingFlow = ai.defineFlow(
  {
    name: 'processRatingFlow',
    inputSchema: ProcessRatingInputSchema,
    outputSchema: ProcessRatingOutputSchema,
  },
  async (input) => {
    const { ratedUserId, rating, comment, isDriver } = input;
    const collectionName = isDriver ? 'drivers' : 'users';
    const userDocRef = doc(db, collectionName, ratedUserId);
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let finalComment = comment;

    const reviewData: {
        rating: number;
        comment?: string;
        sentiment: 'positive' | 'negative' | 'neutral';
        createdAt: string;
    } = {
        rating,
        sentiment: 'neutral', // Default sentiment
        createdAt: new Date().toISOString(),
    };
    
    if (comment && comment.trim().length > 0) {
        // Analizar sentimiento y corregir comentario solo si existe
        const analysisResult = await analyzeAndCorrectCommentPrompt({ comment });
        if (analysisResult.output) {
            reviewData.sentiment = analysisResult.output.sentiment;
            // Usar el comentario corregido por la IA
            finalComment = analysisResult.output.correctedComment;
        }
    }

    if (finalComment && finalComment.trim().length > 0) {
        reviewData.comment = finalComment;
    }


    // Guardar siempre la calificación en la subcolección, con o sin comentario
    const reviewsColRef = collection(userDocRef, 'reviews');
    await addDoc(reviewsColRef, reviewData);

    // Actualizar la calificación promedio del usuario en una transacción
    const newAverageRating = await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
            throw new Error(`El documento con ID ${ratedUserId} no existe en la colección ${collectionName}.`);
        }

        const userData = userDoc.data();
        const currentRating = userData.rating || 0;
        // En un sistema real, se contaría el número de calificaciones. Aquí lo simulamos.
        const totalRatings = (userData.totalRides || userData.totalRatings || 0); 
        
        // Calcular nuevo promedio. Si es la primera calificación, es simplemente la calificación.
        const newAverage = totalRatings > 0 
            ? (currentRating * totalRatings + rating) / (totalRatings + 1)
            : rating;
            
        // El total de calificaciones/viajes se incrementa en otros lugares.
        // Aquí solo actualizamos el promedio.
        transaction.update(userDocRef, { rating: newAverage });

        return newAverage;
    });

    return {
      success: true,
      newAverageRating: parseFloat(newAverageRating.toFixed(2)),
    };
  }
);
