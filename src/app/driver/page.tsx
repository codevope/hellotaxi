
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import { Briefcase, TrendingUp, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function DriverPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl text-center">
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

        <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl mt-16 text-center">
          <Card>
            <CardHeader>
                <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-2">
                    <Briefcase className="h-6 w-6" />
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
          <Card>
            <CardHeader>
                <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-2">
                    <TrendingUp className="h-6 w-6" />
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
          <Card>
            <CardHeader>
                 <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-2">
                    <ShieldCheck className="h-6 w-6" />
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
      </main>
    </div>
  );
}
