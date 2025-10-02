
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/app-header';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleIcon } from '@/components/google-icon';
import Link from 'next/link';

function DriverRegistrationContent() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateUserRole } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleRegistration = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      await updateUserRole('driver');
      toast({
        title: '¡Felicidades, ahora eres conductor!',
        description:
          'Se ha creado tu perfil de conductor. Serás redirigido a tu panel.',
      });
      router.push('/driver');
    } catch (error) {
      console.error('Error al registrar como conductor:', error);
      toast({
        variant: 'destructive',
        title: 'Error en el registro',
        description:
          'No se pudo completar tu registro. Por favor, inténtalo de nuevo.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <main className="flex-1 flex flex-col items-center py-16 md:py-24 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">
              Completa tu Registro de Conductor
            </CardTitle>
            <CardDescription className="text-center">
              Estás a un solo paso de unirte a nuestra flota de conductores.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-muted-foreground">
              Al hacer clic en el botón, se creará tu perfil de conductor. Más
              adelante, deberás completar la verificación de tus documentos
              desde tu panel de control.
            </p>
            <Button
              onClick={handleRegistration}
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Convertirme en Conductor
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function DriverRegistrationPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <main className="flex-1 flex flex-col items-center justify-center text-center p-8 py-16 md:py-24">
          <Card className="max-w-md p-8">
            <CardHeader>
              <CardTitle>Inicia Sesión para Registrarte</CardTitle>
              <CardDescription>
                Para poder registrarte como conductor, primero debes iniciar
                sesión.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg">
                <Link href="/login">
                  <LogIn className="mr-2" />
                  Ir a Iniciar Sesión
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return <DriverRegistrationContent />;
}
