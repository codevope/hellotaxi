'use client';

import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { seedDatabase, resetAndSeedDatabase } from '@/services/seed-db';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


export default function AdminSeedPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      await seedDatabase();
      toast({
        title: "Base de datos inicializada",
        description: "Los datos de prueba se han cargado correctamente."
      });
    } catch (error) {
      console.error('Error seeding database:', error);
      toast({
        variant: 'destructive',
        title: "Error al inicializar",
        description: "No se pudieron cargar los datos de prueba."
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
        await resetAndSeedDatabase();
        toast({
            title: "¡Base de Datos Reiniciada!",
            description: "La base de datos ha sido borrada y poblada con datos de prueba.",
        });
    } catch (error) {
        console.error("Error resetting database:", error);
        toast({
            variant: "destructive",
            title: "Error al Reiniciar",
            description: "No se pudo reiniciar la base de datos.",
        });
    } finally {
        setIsResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl font-headline">
                Inicializar Base de Datos
            </h1>
            <p className="text-muted-foreground">Cargar datos de prueba para desarrollo y testing.</p>
          </div>
        </div>
      </div>
      
      <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Operaciones de Base de Datos
            </CardTitle>
            <CardDescription>
                Acciones de mantenimiento para la base de datos de ejemplo. Estas acciones son destructivas y requieren confirmación.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isSeeding || isResetting}>
                        {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2" />}
                        Poblar Datos
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Poblar la base de datos?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción añadirá los datos de prueba a las colecciones existentes. No eliminará datos. ¿Estás seguro de que quieres continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSeedDatabase}>Sí, poblar datos</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isSeeding || isResetting}>
                        {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2" />}
                        Reiniciar Base de Datos
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                         <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción es irreversible. Eliminará todas las colecciones de usuarios, conductores, viajes, etc., y las reemplazará con los datos de prueba iniciales.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetDatabase} className="bg-destructive hover:bg-destructive/90">Sí, reiniciar todo</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
    </div>
  );
}
