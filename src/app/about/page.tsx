'use client';

import AppHeader from '@/components/app-header';
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

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        <section className="bg-secondary">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
              Revolucionando la forma en que te mueves
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Hello Taxi nació de la idea de crear una plataforma de transporte
              más justa, transparente y segura para pasajeros y conductores en
              Perú.
            </p>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold font-headline mb-4">
                  Nuestra Misión
                </h2>
                <p className="text-muted-foreground text-lg mb-4">
                  Nuestra misión es simple: empoderar a nuestros usuarios. Para
                  los pasajeros, significa tener el control sobre la tarifa y
                  viajar con la tranquilidad de que su seguridad es nuestra
                  prioridad. Para los conductores, significa ofrecer un modelo de
                  negocio flexible que maximice sus ganancias y les brinde el
                  respeto que merecen.
                </p>
                <p className="text-muted-foreground text-lg">
                  Creemos en la tecnología como una herramienta para construir
                  comunidades más fuertes y conectadas.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="text-center">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-2">
                      <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Seguridad</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="text-center">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-2">
                      <CircleDollarSign className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Justicia</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="text-center">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-2">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Comunidad</CardTitle>
                  </CardHeader>
                </Card>
                 <Card className="text-center">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-2">
                      <Briefcase className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Flexibilidad</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-secondary">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 font-headline">
              Un Modelo de Negocio para Conductores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Comisión por Viaje</CardTitle>
                  <CardDescription>Ideal para conductores ocasionales</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Paga una pequeña comisión solo por los viajes que realizas.
                    Perfecto si conduces a tiempo parcial o quieres probar la
                    plataforma sin compromisos.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Membresía Mensual</CardTitle>
                  <CardDescription>Maximiza tus ganancias</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    <li>
                      <span className="font-semibold">Económico:</span> S/40 al
                      mes
                    </li>
                    <li>
                      <span className="font-semibold">Confort:</span> S/50 al
                      mes
                    </li>
                    <li>
                      <span className="font-semibold">Exclusivo:</span> S/60 al
                      mes
                    </li>
                  </ul>
                   <p className="mt-4">
                    Paga una tarifa fija y quédate con un mayor porcentaje de cada
                    viaje. Ideal para conductores a tiempo completo.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
