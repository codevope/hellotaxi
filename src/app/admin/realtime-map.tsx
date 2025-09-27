'use client';

import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function RealtimeMap() {
    const mapImageUrl = PlaceHolderImages.find((img) => img.id === 'map')?.imageUrl || 'https://picsum.photos/seed/map/1200/800';

  return (
      <div className="relative w-full h-full bg-gray-300 rounded-lg overflow-hidden">
        <Image
            src={mapImageUrl}
            alt="Mapa de marcador de posición"
            fill
            className="object-cover"
            data-ai-hint="city map"
        />
         <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
      </div>
  );
}
