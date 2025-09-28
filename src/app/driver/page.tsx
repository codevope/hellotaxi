'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import { Briefcase, TrendingUp, ShieldCheck, CheckCircle, Bell, Users, Wallet, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function DriverPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <AppHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="text-center py-16 md:py-24">
            <div className="container">
                <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4">
                    Gana dinero a tu manera
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    Únete a la comunidad de conductores de Hello Taxi y sé tu propio
                    jefe. Horarios flexibles, ganancias competitivas y el control en
                    tus manos.
                </p>
                <Button size="lg" className="font-bold text-lg" asChild>
                    <Link href="/driver/register">¡Regístrate Ahora!</Link>
                </Button>
            </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 bg-card">
            <div className="container">
                 <h2 className="text-3xl font-bold text-center mb-12 font-headline">
                    Ventajas de Conducir con Nosotros
                </h2>
                <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl mx-auto text-center">
                <Card className="border-0 shadow-none">
                    <CardHeader>
                        <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4">
                            <Briefcase className="h-8 w-8" />
                        </div>
                    <CardTitle>Tú Tienes el Control</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <p>
                        Elige si prefieres un modelo de comisión por viaje o una
                        membresía mensual fija. Sin tarifas ocultas.
                    </p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-none">
                    <CardHeader>
                        <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4">
                            <TrendingUp className="h-8 w-8" />
                        </div>
                    <CardTitle>Maximiza tus Ganancias</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <p>
                        Aprovecha las horas de mayor demanda y nuestras bajas tasas
                        de servicio para llevarte más dinero a casa.
                    </p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-none">
                    <CardHeader>
                        <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                    <CardTitle>Soporte y Seguridad</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <p>
                        Contamos con un equipo de soporte 24/7 y herramientas de
                        seguridad en la app para protegerte en cada viaje.
                    </p>
                    </CardContent>
                </Card>
                </div>
            </div>
        </section>

         {/* Requirements Section */}
        <section className="py-16 md:py-24">
            <div className="container grid md:grid-cols-2 gap-12 items-center p-8">
                 <div>
                    <h2 className="text-3xl font-bold font-headline mb-4">Requisitos para Unirte</h2>
                    <p className="text-muted-foreground text-lg mb-6">
                        Para garantizar la seguridad y calidad de nuestro servicio, solicitamos a nuestros conductores cumplir con los siguientes requisitos básicos.
                    </p>
                    <ul className="space-y-4 text-lg">
                        <li className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-primary" />
                            <span>Ser mayor de 18 años.</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-primary" />
                            <span>Licencia de conducir vigente.</span>
                        </li>
                         <li className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-primary" />
                            <span>SOAT y Revisión Técnica al día.</span>
                        </li>
                         <li className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-primary" />
                            <span>Vehículo del 2010 en adelante, en buen estado.</span>
                        </li>
                         <li className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-primary" />
                            <span>Certificado de antecedentes penales.</span>
                        </li>
                         <li className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-primary" />
                            <span>Smartphone con conexión a internet.</span>
                        </li>
                    </ul>
                </div>
                <div className="flex items-center justify-center">
                    <img src="/img/sedan.png" alt="Sedan moderno" className="rounded-lg shadow-xl" />
                </div>
            </div>
        </section>
        
        {/* How it works for drivers */}
         <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 font-headline">
              ¿Cómo Funciona para Conductores?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center p-6">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Bell className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Recibe Solicitudes</h3>
                <p className="text-muted-foreground">
                  Ponte en estado "Disponible" y empezarás a recibir solicitudes de viaje de pasajeros cercanos a ti.
                </p>
              </div>
              <div className="flex flex-col items-center p-6">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Acepta y Conduce</h3>
                <p className="text-muted-foreground">
                  Acepta la tarifa propuesta por el pasajero y dirígete al punto de recojo. La app te guiará.
                </p>
              </div>
              <div className="flex flex-col items-center p-6">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Wallet className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Completa y Gana</h3>
                <p className="text-muted-foreground">
                  Finaliza el viaje en el destino y recibe tus ganancias directamente en tu cuenta.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24">
            <div className="container max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-8 font-headline">Preguntas Frecuentes</h2>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-lg">¿Cómo y cuándo recibiré mis pagos?</AccordionTrigger>
                        <AccordionContent className="text-base">
                        Los pagos se procesan semanalmente y se depositan directamente en la cuenta bancaria que registres. Podrás ver un desglose detallado de tus ganancias en tu panel de conductor.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger className="text-lg">¿Qué sucede si un pasajero cancela un viaje?</AccordionTrigger>
                        <AccordionContent className="text-base">
                        Entendemos que las cancelaciones ocurren. Si un pasajero cancela después de que ya has comenzado a dirigirte hacia el punto de recojo, recibirás una pequeña compensación por tu tiempo y combustible.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger className="text-lg">¿Cómo funciona el sistema de calificación?</AccordionTrigger>
                        <AccordionContent className="text-base">
                        Después de cada viaje, tanto tú como el pasajero pueden calificarse mutuamente. Mantener una calificación alta es importante, ya que te da acceso a más solicitudes de viaje y mejores beneficios en la plataforma.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger className="text-lg">¿Puedo conducir para diferentes tipos de servicio?</AccordionTrigger>
                        <AccordionContent className="text-base">
                        Dependiendo de las características de tu vehículo (modelo, año, estado), podrías calificar para conducir en las categorías 'Confort' o 'Exclusivo', lo que te permite acceder a tarifas más altas.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>

      </main>
    </div>
  );
}
