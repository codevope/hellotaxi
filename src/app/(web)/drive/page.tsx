'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, TrendingUp, ShieldCheck, CheckCircle, Bell, Users, Wallet, HelpCircle, Car, MapPin, Clock, Star } from 'lucide-react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';

export default function DriverPage() {
  return (
    <>
        {/* Hero Section */}
        <section className="relative h-[35vh] flex items-center justify-center text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E4CA6]/80 via-[#0477BF]/70 to-[#049DD9]/60 z-10"></div>
          <div className="relative z-20 p-4 flex flex-col items-center">
            <h1 className="text-3xl md:text-5xl font-bold font-headline mb-4 text-white drop-shadow-lg">
              Gana Dinero a Tu Manera
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mb-8 text-gray-100 drop-shadow-md">
              Únete a la comunidad de conductores de HelloTaxi. Horarios flexibles, 
              ganancias competitivas y el control en tus manos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="font-bold text-lg px-8 py-6 bg-gradient-to-r from-[#05C7F2] to-[#049DD9] hover:from-[#049DD9] hover:to-[#0477BF] border-0 shadow-xl">
                <Link href="/driver/register">¡Regístrate Ahora!</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 lg:py-16 bg-gradient-to-br from-[#F2F2F2] via-white to-[#F2F2F2]/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-headline text-[#2E4CA6]">
              Ventajas de Conducir con Nosotros
            </h2>
            <p className="text-center text-[#0477BF] mb-10 max-w-2xl mx-auto">
              Descubre por qué miles de conductores eligen HelloTaxi como su plataforma de trabajo
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="border-none shadow-lg bg-white hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className="mx-auto bg-gradient-to-br from-[#05C7F2] to-[#049DD9] text-white rounded-full p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-[#2E4CA6]">Tú Tienes el Control</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-[#0477BF]">
                    Elige si prefieres un modelo de comisión por viaje o una
                    membresía mensual fija. Sin tarifas ocultas.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-white hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className="mx-auto bg-gradient-to-br from-[#049DD9] to-[#0477BF] text-white rounded-full p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-[#2E4CA6]">Ganancias Competitivas</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-[#0477BF]">
                    Tarifas justas con la posibilidad de negociar. Recibe bonos
                    por excelente servicio y mantén el 85% o más de tus ganancias.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-white hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className="mx-auto bg-gradient-to-br from-[#0477BF] to-[#2E4CA6] text-white rounded-full p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-[#2E4CA6]">Seguridad Garantizada</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-[#0477BF]">
                    Verificación completa de conductores y pasajeros. Seguro de
                    accidentes incluido y soporte 24/7.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-headline text-[#2E4CA6]">
              ¿Cómo Funciona?
            </h2>
            <p className="text-center text-[#0477BF] mb-12 max-w-2xl mx-auto">
              Comienza a ganar dinero en unos simples pasos
            </p>
            <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="text-center group">
                <div className="mx-auto bg-gradient-to-br from-[#05C7F2] to-[#049DD9] text-white rounded-full p-6 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h3 className="font-semibold mb-2 text-[#2E4CA6]">1. Regístrate</h3>
                <p className="text-sm text-[#0477BF]">
                  Completa tu perfil y sube tus documentos
                </p>
              </div>
              <div className="text-center group">
                <div className="mx-auto bg-gradient-to-br from-[#049DD9] to-[#0477BF] text-white rounded-full p-6 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Car className="h-10 w-10" />
                </div>
                <h3 className="font-semibold mb-2 text-[#2E4CA6]">2. Verifica tu Vehículo</h3>
                <p className="text-sm text-[#0477BF]">
                  Proceso rápido de verificación vehicular
                </p>
              </div>
              <div className="text-center group">
                <div className="mx-auto bg-gradient-to-br from-[#0477BF] to-[#2E4CA6] text-white rounded-full p-6 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-10 w-10" />
                </div>
                <h3 className="font-semibold mb-2 text-[#2E4CA6]">3. Conecta</h3>
                <p className="text-sm text-[#0477BF]">
                  Activa tu disponibilidad y recibe solicitudes
                </p>
              </div>
              <div className="text-center group">
                <div className="mx-auto bg-gradient-to-br from-[#2E4CA6] to-[#05C7F2] text-white rounded-full p-6 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="h-10 w-10" />
                </div>
                <h3 className="font-semibold mb-2 text-[#2E4CA6]">4. Gana</h3>
                <p className="text-sm text-[#0477BF]">
                  Recibe pagos semanales directos a tu cuenta
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[#F2F2F2] via-white to-[#F2F2F2]/50">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 font-headline text-[#2E4CA6]">
                  Requisitos Mínimos
                </h2>
                <p className="text-lg text-[#0477BF] mb-8">
                  Para formar parte de nuestra comunidad de conductores, asegúrate de cumplir con estos requisitos básicos:
                </p>
                <div className="space-y-4">
                  {[
                    'Licencia de conducir vigente (A-IIb o superior)',
                    'Vehículo modelo 2015 o superior',
                    'SOAT y revisión técnica al día',
                    'Smartphone con GPS',
                    'Mayor de 21 años',
                    'Antecedentes penales y policiales limpios'
                  ].map((requirement, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-[#05C7F2] flex-shrink-0" />
                      <span className="text-[#0477BF]">{requirement}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-100">
                <h3 className="text-2xl font-bold mb-6 text-[#2E4CA6]">¿Cumples los Requisitos?</h3>
                <p className="text-[#0477BF] mb-6">
                  ¡Perfecto! Estás a un paso de comenzar a generar ingresos con HelloTaxi.
                </p>
                <Button asChild className="w-full bg-gradient-to-r from-[#05C7F2] to-[#049DD9] hover:from-[#049DD9] hover:to-[#0477BF] border-0 text-lg py-6">
                  <Link href="/driver/register">Comenzar Registro</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-headline text-[#2E4CA6]">
              Preguntas Frecuentes
            </h2>
            <p className="text-center text-[#0477BF] mb-12 max-w-2xl mx-auto">
              Resuelve tus dudas sobre ser conductor partner de HelloTaxi
            </p>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible>
                <AccordionItem value="earnings" className="border-b border-gray-200">
                  <AccordionTrigger className="text-[#2E4CA6] hover:text-[#0477BF]">
                    ¿Cuánto puedo ganar como conductor?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#0477BF]">
                    Tus ganancias dependen de varios factores como las horas que conduzcas, 
                    la demanda en tu zona y el modelo de pago que elijas. En promedio, 
                    nuestros conductores ganan entre S/. 80-150 por día trabajando 8 horas.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="payment" className="border-b border-gray-200">
                  <AccordionTrigger className="text-[#2E4CA6] hover:text-[#0477BF]">
                    ¿Cómo y cuándo recibo mis pagos?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#0477BF]">
                    Los pagos se realizan semanalmente todos los miércoles mediante 
                    transferencia bancaria directa. Puedes revisar tus ganancias en 
                    tiempo real desde la app del conductor.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="schedule" className="border-b border-gray-200">
                  <AccordionTrigger className="text-[#2E4CA6] hover:text-[#0477BF]">
                    ¿Puedo elegir mis propios horarios?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#0477BF]">
                    ¡Absolutamente! Una de las principales ventajas es la flexibilidad total. 
                    Tú decides cuándo, dónde y por cuánto tiempo quieres trabajar. 
                    Puedes conectarte y desconectarte cuando gustes.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="support" className="border-b border-gray-200">
                  <AccordionTrigger className="text-[#2E4CA6] hover:text-[#0477BF]">
                    ¿Qué soporte ofrecen a los conductores?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#0477BF]">
                    Ofrecemos soporte 24/7 vía chat, teléfono y email. También contamos 
                    con centros de atención presencial, capacitaciones gratuitas y un 
                    equipo dedicado para resolver cualquier inconveniente.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="vehicle" className="border-b border-gray-200">
                  <AccordionTrigger className="text-[#2E4CA6] hover:text-[#0477BF]">
                    ¿Qué tipo de vehículos aceptan?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#0477BF]">
                    Aceptamos sedanes, hatchbacks y SUVs modelo 2015 o superior. 
                    El vehículo debe estar en buenas condiciones, con documentos al día 
                    y pasar nuestra inspección de seguridad.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
    </>
  );
}