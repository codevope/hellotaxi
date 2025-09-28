
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  CircleDollarSign,
  Star,
  MapPin,
  MessagesSquare,
  Car,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function HomePage() {
  const mapImageUrl =
    PlaceHolderImages.find((img) => img.id === 'map')?.imageUrl ||
    'https://picsum.photos/seed/map/1200/800';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center text-center text-white">
          <Image
            src="/img/bg-hero.jpg"
            alt="Vista de la ciudad desde un coche"
            fill
            className="absolute inset-0 z-0 object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50 z-10"></div>
          <div className="relative z-20 p-4 flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 text-white drop-shadow-lg">
              Tu Viaje, Tu Tarifa, Tu Ciudad
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mb-8 text-gray-200 drop-shadow-md">
              Experimenta la libertad de negociar tu tarifa y viaja con
              conductores de confianza. Rápido, seguro y justo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="font-bold text-lg px-8 py-6">
                <Link href="/ride">Empezar a Viajar</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-16 lg:py-24 bg-secondary">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 font-headline">
              ¿Cómo Funciona?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <MapPin className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Elige tu Ruta</h3>
                <p className="text-muted-foreground">
                  Ingresa tu punto de recojo y tu destino en el mapa.
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <MessagesSquare className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Negocia tu Tarifa</h3>
                <p className="text-muted-foreground">
                  Acepta el precio sugerido o haz tu propia oferta al conductor.
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Car className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Viaja Seguro</h3>
                <p className="text-muted-foreground">
                  Un conductor verificado aceptará tu viaje y te llevará a tu
                  destino.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 font-headline">
              ¿Por qué elegir Hello Taxi?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <CircleDollarSign className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Negociación Justa
                  </h3>
                  <p className="text-muted-foreground">
                    Ofrece tu propio precio o acepta la tarifa sugerida. Tú
                    tienes el control de lo que pagas por tu viaje.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Seguridad Primero
                  </h3>
                  <p className="text-muted-foreground">
                    Todos nuestros conductores pasan por un riguroso proceso de
                    verificación y cuentas con un botón de pánico SOS.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Calidad Garantizada
                  </h3>
                  <p className="text-muted-foreground">
                    Elige entre diferentes tipos de servicio y califica a tu
                    conductor para ayudarnos a mantener la calidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Driver CTA Section */}
        <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              ¿Eres Conductor? Únete a Nosotros
            </h2>
            <p className="text-lg max-w-2xl mx-auto mb-8">
              Sé tu propio jefe, elige tus horarios y maximiza tus ganancias.
              Ofrecemos comisiones bajas y un modelo de suscripción flexible.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="font-bold text-lg px-8 py-6"
            >
              <Link href="/driver">Conviértete en Conductor</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-secondary border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4 text-primary">
             <Car className="h-7 w-7" />
            <h1 className="text-2xl font-bold font-headline">Hello Taxi</h1>
          </Link>
          <p>
            &copy; {new Date().getFullYear()} Hello Taxi. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
