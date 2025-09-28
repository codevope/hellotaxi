
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, Loader2 } from 'lucide-react';
import type { Driver, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


interface RatingFormProps {
    userToRate: Driver | User;
    isDriver: boolean; // True si el usuario a calificar es un conductor
    onSubmit: (rating: number, comment: string) => void;
    isSubmitting: boolean;
}

export default function RatingForm({ userToRate, isDriver, onSubmit, isSubmitting }: RatingFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        if(rating > 0 && !isSubmitting) {
            onSubmit(rating, comment);
        }
    };

    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="text-center">
                <CardTitle>Califica tu Experiencia</CardTitle>
                <CardDescription>Tu opinión nos ayuda a mejorar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4 justify-center">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={userToRate.avatarUrl} alt={userToRate.name} />
                        <AvatarFallback>{userToRate.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{isDriver ? 'Conductor' : 'Pasajero'}</p>
                        <p className="text-lg">{userToRate.name}</p>
                    </div>
                </div>

                <div className="flex justify-center items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={cn(
                                'h-10 w-10 cursor-pointer transition-colors',
                                (hoverRating >= star || rating >= star)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                            )}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
                
                <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deja un comentario (opcional)..."
                    rows={3}
                />

                <Button onClick={handleSubmit} className="w-full" disabled={rating === 0 || isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Calificación
                </Button>
            </CardContent>
        </Card>
    );
}
