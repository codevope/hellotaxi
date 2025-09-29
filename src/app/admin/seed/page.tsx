'use client';

import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminSeedPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSeedDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to seed database');
      }
      
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
      setLoading(false);
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
      
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Datos de Prueba
            </CardTitle>
            <CardDescription>
              Esto creará datos de ejemplo incluyendo usuarios, conductores, vehículos y viajes para poder probar el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Advertencia
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Esta acción eliminará los datos existentes y los reemplazará con datos de prueba. 
                    Solo usar en entornos de desarrollo.
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleSeedDatabase} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inicializando...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Inicializar Base de Datos
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}