import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, CircleDollarSign, Star } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function HomePage() {
  const mapImageUrl =
    PlaceHolderImages.find((img) => img.id === 'map')?.imageUrl ||
    'https://picsum.photos/seed/map/1200/800';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative h-[60vh] flex items-center justify-center text-center text-white">
          <Image
            src={mapImageUrl}
            alt="Mapa de la ciudad"
            fill
            className="absolute inset-0 z-0 object-cover opacity-40"
            data-ai-hint="city map"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10"></div>
          <div className="relative z-20 p-4 flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 text-foreground">
              Tu Viaje, Tu Tarifa, Tu Ciudad
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mb-8 text-muted-foreground">
              Experimenta la libertad de negociar tu tarifa y viaja con
              conductores de confianza. Rápido, seguro y justo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="font-bold">
                <Link href="/ride">Empezar a Viajar</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="font-bold">
                <Link href="/driver">Conviértete en Conductor</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 font-headline">
              ¿Por qué elegir Hello Taxi?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <CircleDollarSign className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Negocia tu Tarifa</h3>
                <p className="text-muted-foreground">
                  Ofrece tu propio precio o acepta la tarifa sugerida. Tú tienes
                  el control de lo que pagas por tu viaje.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <ShieldCheck className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Seguridad Primero</h3>
                <p className="text-muted-foreground">
                  Todos nuestros conductores pasan por un riguroso proceso de
                  verificación. Además, cuentas con un botón de pánico SOS en
                  cada viaje.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Star className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Calidad Garantizada</h3>
                <p className="text-muted-foreground">
                  Elige entre diferentes tipos de servicio y califica a tu
                  conductor al final del viaje para ayudarnos a mantener la
                  calidad.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 bg-secondary text-secondary-foreground">
        <div className="container mx-auto text-center">
            <p>&copy; {new Date().getFullYear()} Hello Taxi. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
