
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ShieldCheck,
  CircleDollarSign,
  Users,
  Briefcase,
} from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <>
        {/* Hero Section */}
        <section className="relative h-[60vh] flex items-center justify-center text-center text-white">
          <Image
            src="/img/bg-hero.jpg"
            alt="Sobre HelloTaxi"
            fill
            className="absolute inset-0 z-0 object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E4CA6]/80 via-[#0477BF]/70 to-[#049DD9]/60 z-10"></div>
          <div className="relative z-20 p-4 flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-white drop-shadow-lg">
              Revolucionando la Forma en que Te Mueves
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-100 drop-shadow-md">
              HelloTaxi nació de la idea de crear una plataforma de transporte
              más justa, transparente y segura para pasajeros y conductores en
              Perú.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[#F2F2F2] via-white to-[#F2F2F2]/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold font-headline mb-6 text-[#2E4CA6]">
                  Nuestra Misión
                </h2>
                <p className="text-[#0477BF] text-lg mb-6">
                  Nuestra misión es simple: empoderar a nuestros usuarios. Para
                  los pasajeros, significa tener el control sobre la tarifa y
                  viajar con la tranquilidad de que su seguridad es nuestra
                  prioridad. Para los conductores, significa ofrecer un modelo de
                  negocio flexible que maximice sus ganancias y les brinde el
                  respeto que merecen.
                </p>
                <p className="text-[#0477BF] text-lg">
                  Creemos en la tecnología como una herramienta para construir
                  comunidades más fuertes y conectadas.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Card className="text-center border-none shadow-lg bg-white hover:shadow-xl transition-all duration-300 group">
                  <CardHeader>
                    <div className="mx-auto bg-gradient-to-br from-[#05C7F2] to-[#049DD9] text-white rounded-full p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-[#2E4CA6]">Seguridad</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="text-center border-none shadow-lg bg-white hover:shadow-xl transition-all duration-300 group">
                  <CardHeader>
                    <div className="mx-auto bg-gradient-to-br from-[#049DD9] to-[#0477BF] text-white rounded-full p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                      <CircleDollarSign className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-[#2E4CA6]">Justicia</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="text-center border-none shadow-lg bg-white hover:shadow-xl transition-all duration-300 group">
                  <CardHeader>
                    <div className="mx-auto bg-gradient-to-br from-[#0477BF] to-[#2E4CA6] text-white rounded-full p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-[#2E4CA6]">Comunidad</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="text-center border-none shadow-lg bg-white hover:shadow-xl transition-all duration-300 group">
                  <CardHeader>
                    <div className="mx-auto bg-gradient-to-br from-[#2E4CA6] to-[#05C7F2] text-white rounded-full p-4 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Briefcase className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-[#2E4CA6]">Flexibilidad</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Business Models Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-headline text-[#2E4CA6]">
              Modelos de Negocio para Conductores
            </h2>
            <p className="text-center text-[#0477BF] mb-12 max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tu estilo de trabajo y maximiza tus ganancias
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="border-none shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="mx-auto bg-gradient-to-br from-[#05C7F2] to-[#049DD9] text-white rounded-full p-4 w-fit mb-4">
                    <CircleDollarSign className="h-10 w-10" />
                  </div>
                  <CardTitle className="text-[#2E4CA6] text-xl">Comisión por Viaje</CardTitle>
                  <CardDescription className="text-[#0477BF]">Ideal para conductores ocasionales</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-[#0477BF]">
                    Paga una pequeña comisión solo por los viajes que realizas.
                    Perfecto si conduces a tiempo parcial o quieres probar la
                    plataforma sin compromisos.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="mx-auto bg-gradient-to-br from-[#0477BF] to-[#2E4CA6] text-white rounded-full p-4 w-fit mb-4">
                    <Briefcase className="h-10 w-10" />
                  </div>
                  <CardTitle className="text-[#2E4CA6] text-xl">Membresía Mensual</CardTitle>
                  <CardDescription className="text-[#0477BF]">Maximiza tus ganancias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#F2F2F2] to-white rounded-lg">
                      <span className="font-semibold text-[#2E4CA6]">Económico:</span>
                      <span className="text-[#0477BF] font-bold">S/40 al mes</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#F2F2F2] to-white rounded-lg">
                      <span className="font-semibold text-[#2E4CA6]">Confort:</span>
                      <span className="text-[#0477BF] font-bold">S/50 al mes</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#F2F2F2] to-white rounded-lg">
                      <span className="font-semibold text-[#2E4CA6]">Exclusivo:</span>
                      <span className="text-[#0477BF] font-bold">S/60 al mes</span>
                    </div>
                  </div>
                  <p className="text-[#0477BF] text-center">
                    Paga una tarifa fija y quédate con un mayor porcentaje de cada
                    viaje. Ideal para conductores a tiempo completo.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
    </>
  );
}
