
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

export default function HomePage() {

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
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E4CA6]/70 via-[#0477BF]/60 to-[#049DD9]/50 z-10"></div>
          <div className="relative z-20 p-4 flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 text-white drop-shadow-lg">
              Tu Viaje, Tu Tarifa, Tu Ciudad
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mb-8 text-gray-100 drop-shadow-md">
              Experimenta la libertad de negociar tu tarifa y viaja con
              conductores de confianza. Rápido, seguro y justo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="font-bold text-lg px-8 py-6 bg-gradient-to-r from-[#05C7F2] to-[#049DD9] hover:from-[#049DD9] hover:to-[#0477BF] border-0 shadow-xl">
                <Link href="/ride">Empezar a Viajar</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[#F2F2F2] via-white to-[#F2F2F2]/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12 font-headline bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] bg-clip-text text-transparent">
              ¿Cómo Funciona?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="group flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-[#05C7F2]/20">
                <div className="p-6 bg-gradient-to-br from-[#05C7F2]/10 to-[#049DD9]/10 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-12 w-12 text-[#049DD9]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E4CA6]">1. Elige tu Ruta</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ingresa tu punto de recojo y tu destino en el mapa.
                </p>
              </div>
              <div className="group flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-[#0477BF]/20">
                <div className="p-6 bg-gradient-to-br from-[#0477BF]/10 to-[#2E4CA6]/10 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessagesSquare className="h-12 w-12 text-[#0477BF]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E4CA6]">2. Negocia tu Tarifa</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Acepta el precio sugerido o haz tu propia oferta al conductor.
                </p>
              </div>
              <div className="group flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-[#2E4CA6]/20">
                <div className="p-6 bg-gradient-to-br from-[#2E4CA6]/10 to-[#0477BF]/10 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Car className="h-12 w-12 text-[#2E4CA6]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E4CA6]">3. Viaja Seguro</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Un conductor verificado aceptará tu viaje y te llevará a tu
                  destino.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold font-headline mb-4 bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] bg-clip-text text-transparent">
                Nuestros Servicios
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Elige el servicio que mejor se adapte a tus necesidades y presupuesto
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Economy Service */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0477BF] to-[#049DD9] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500"></div>
                <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-[#049DD9]/20 dark:border-[#049DD9]/30">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0477BF] to-[#049DD9]"></div>
                  
                  <div className="p-8">
                    <div className="relative h-32 mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#049DD9]/10 to-[#05C7F2]/10 dark:from-[#049DD9]/20 dark:to-[#05C7F2]/20 rounded-xl"></div>
                      <Image
                        src="/img/hatchback.png"
                        alt="Servicio Economy - Hatchback"
                        width={120}
                        height={80}
                        className="relative z-10 object-contain filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2 text-[#0477BF] dark:text-[#049DD9]">Economy</h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        La opción más <span className="font-semibold text-[#0477BF]">económica</span> para viajes cotidianos. 
                        Eficiencia y ahorro garantizados.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#0477BF] rounded-full"></div>
                        <span>Vehículos compactos y eficientes</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#0477BF] rounded-full"></div>
                        <span>Aire acondicionado estándar</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#0477BF] rounded-full"></div>
                        <span>Tarifas ultra competitivas</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#0477BF] rounded-full"></div>
                        <span>Capacidad: 1-3 pasajeros</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-[#049DD9]/20 dark:border-[#049DD9]/30">
                      <p className="text-xs text-center text-muted-foreground">
                        Perfecto para trayectos urbanos
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comfort Service */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500"></div>
                <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-[#2E4CA6]/20 dark:border-[#2E4CA6]/30">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2E4CA6] to-[#0477BF]"></div>
                  
                  <div className="p-8">
                    <div className="relative h-32 mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#2E4CA6]/10 to-[#0477BF]/10 dark:from-[#2E4CA6]/20 dark:to-[#0477BF]/20 rounded-xl"></div>
                      <Image
                        src="/img/sedan.png"
                        alt="Servicio Comfort - Sedan"
                        width={140}
                        height={90}
                        className="relative z-10 object-contain filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2 text-[#2E4CA6] dark:text-[#0477BF]">Comfort</h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        El equilibrio perfecto entre <span className="font-semibold text-[#2E4CA6]">comodidad y precio</span>. 
                        Ideal para viajes de negocios.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#2E4CA6] rounded-full"></div>
                        <span>Sedanes espaciosos y elegantes</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#2E4CA6] rounded-full"></div>
                        <span>Asientos ergonómicos premium</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#2E4CA6] rounded-full"></div>
                        <span>WiFi gratuito disponible</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#2E4CA6] rounded-full"></div>
                        <span>Capacidad: 1-4 pasajeros</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-[#2E4CA6]/20 dark:border-[#2E4CA6]/30">
                      <p className="text-xs text-center text-muted-foreground">
                        Recomendado para trayectos largos
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exclusive Service */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#049DD9] to-[#05C7F2] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500"></div>
                <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-[#05C7F2]/20 dark:border-[#05C7F2]/30">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#049DD9] to-[#05C7F2]"></div>
                  
                  <div className="p-8">
                    <div className="relative h-32 mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#049DD9]/10 to-[#05C7F2]/10 dark:from-[#049DD9]/20 dark:to-[#05C7F2]/20 rounded-xl"></div>
                      <Image
                        src="/img/suv.png"
                        alt="Servicio Exclusivo - SUV"
                        width={160}
                        height={100}
                        className="relative z-10 object-contain filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2 text-[#049DD9] dark:text-[#05C7F2]">Exclusivo</h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        La experiencia <span className="font-semibold text-[#049DD9]">premium definitiva</span>. 
                        Lujo y confort sin compromisos.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#049DD9] rounded-full"></div>
                        <span>SUVs de alta gama y lujo</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#049DD9] rounded-full"></div>
                        <span>Asientos de cuero premium</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#049DD9] rounded-full"></div>
                        <span>Amenities y refreshments</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#049DD9] rounded-full"></div>
                        <span>Capacidad: 1-6 pasajeros</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-[#05C7F2]/20 dark:border-[#05C7F2]/30">
                      <p className="text-xs text-center text-muted-foreground">
                        Para ocasiones especiales
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16 font-headline bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] bg-clip-text text-transparent">
              ¿Por qué elegir Hello Taxi?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="group flex items-start gap-6 p-6 rounded-2xl hover:bg-gradient-to-br hover:from-[#05C7F2]/5 hover:to-[#049DD9]/5 transition-all duration-500 hover:shadow-lg">
                <div className="p-4 bg-gradient-to-br from-[#05C7F2]/10 to-[#049DD9]/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <CircleDollarSign className="h-10 w-10 text-[#049DD9]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-[#2E4CA6]">
                    Negociación Justa
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Ofrece tu propio precio o acepta la tarifa sugerida. Tú
                    tienes el control de lo que pagas por tu viaje.
                  </p>
                </div>
              </div>
              <div className="group flex items-start gap-6 p-6 rounded-2xl hover:bg-gradient-to-br hover:from-[#0477BF]/5 hover:to-[#2E4CA6]/5 transition-all duration-500 hover:shadow-lg">
                <div className="p-4 bg-gradient-to-br from-[#0477BF]/10 to-[#2E4CA6]/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="h-10 w-10 text-[#0477BF]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-[#2E4CA6]">
                    Seguridad Primero
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Todos nuestros conductores pasan por un riguroso proceso de
                    verificación y cuentas con un botón de pánico SOS.
                  </p>
                </div>
              </div>
              <div className="group flex items-start gap-6 p-6 rounded-2xl hover:bg-gradient-to-br hover:from-[#2E4CA6]/5 hover:to-[#0477BF]/5 transition-all duration-500 hover:shadow-lg">
                <div className="p-4 bg-gradient-to-br from-[#2E4CA6]/10 to-[#0477BF]/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-10 w-10 text-[#2E4CA6]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-[#2E4CA6]">
                    Calidad Garantizada
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Elige entre diferentes tipos de servicio y califica a tu
                    conductor para ayudarnos a mantener la calidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Driver CTA Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[#2E4CA6] via-[#0477BF] to-[#049DD9] text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#2E4CA6]/90 to-[#049DD9]/90"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#05C7F2]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#049DD9]/10 rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 font-headline">
              ¿Eres Conductor? Únete a Nosotros
            </h2>
            <p className="text-lg lg:text-xl max-w-3xl mx-auto mb-8 text-gray-100 leading-relaxed">
              Sé tu propio jefe, elige tus horarios y maximiza tus ganancias.
              Ofrecemos comisiones bajas y un modelo de suscripción flexible.
            </p>
            <Button
              asChild
              size="lg"
              className="font-bold text-lg px-10 py-6 bg-white text-[#2E4CA6] hover:bg-[#F2F2F2] hover:text-[#0477BF] border-0 shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Link href="/driver">Conviértete en Conductor</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-gradient-to-br from-[#F2F2F2] to-white dark:from-slate-900 dark:to-slate-800 border-t border-[#05C7F2]/20">
        <div className="container mx-auto text-center">
          <Link href="/" className="flex items-center justify-center gap-3 mb-6 group">
            <div className="p-2 bg-gradient-to-br from-[#049DD9]/10 to-[#05C7F2]/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Car className="h-8 w-8 text-[#049DD9]" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold font-headline bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] bg-clip-text text-transparent">
              Hello Taxi
            </h1>
          </Link>
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Hello Taxi. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
