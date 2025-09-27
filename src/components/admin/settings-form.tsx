
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Database, Trash2, PlusCircle } from 'lucide-react';
import { getSettings } from '@/services/settings-service';
import { seedDatabase, resetAndSeedDatabase } from '@/services/seed-db';
import { useEffect, useState } from 'react';
import type { Settings, CancellationReason } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SettingsForm() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [password, setPassword] = useState('');
  const [actionToConfirm, setActionToConfirm] = useState<'seed' | 'reset' | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const appSettings = await getSettings();
        setSettings(appSettings);
      } catch (error) {
        console.error("Error loading settings:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar los ajustes de la aplicación.',
        });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [toast]);


  const handleSaveChanges = () => {
    toast({
      title: '¡Cambios Guardados!',
      description: 'La configuración de la aplicación ha sido actualizada (simulación).',
    });
  };

  const handleConfirmAction = async () => {
    if (!password || !actionToConfirm) return;

    if (actionToConfirm === 'seed') {
        setIsSeeding(true);
        try {
          await seedDatabase();
          toast({
            title: '¡Base de Datos Poblada!',
            description: 'Los datos de ejemplo se han insertado correctamente en Firestore.',
          });
        } catch (error) {
           console.error("Error seeding database:", error);
           toast({
              variant: 'destructive',
              title: 'Error al Poblar la BD',
              description: 'Ocurrió un error. Revisa la consola para más detalles.',
           });
        } finally {
          setIsSeeding(false);
        }
    } else if (actionToConfirm === 'reset') {
        setIsResetting(true);
         try {
          await resetAndSeedDatabase();
          toast({
            title: '¡Base de Datos Reiniciada!',
            description: 'Los datos de ejemplo han sido borrados y reinsertados.',
          });
        } catch (error) {
           console.error("Error resetting database:", error);
           toast({
              variant: 'destructive',
              title: 'Error al Reiniciar la BD',
              description: 'Ocurrió un error. Revisa la consola para más detalles.',
           });
        } finally {
          setIsResetting(false);
        }
    }
    
    setActionToConfirm(null);
    setPassword('');
  };

  const handleAddCancellationReason = () => {
    if (settings) {
      const newReason: CancellationReason = { code: '', reason: '' };
      setSettings({
        ...settings,
        cancellationReasons: [...settings.cancellationReasons, newReason]
      });
    }
  };

  const handleRemoveCancellationReason = (index: number) => {
    if (settings) {
      const updatedReasons = [...settings.cancellationReasons];
      updatedReasons.splice(index, 1);
      setSettings({ ...settings, cancellationReasons: updatedReasons });
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
     return <p className="text-destructive">No se pudo cargar la configuración.</p>
  }


  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-5">

        {/* Columna Izquierda: Ajustes Principales */}
        <div className="lg:col-span-3 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Cálculo de Tarifas de Viaje</CardTitle>
              <CardDescription>Define los costos base para el cálculo de todas las tarifas.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="baseFare">Tarifa Base (S/)</Label>
                  <Input id="baseFare" defaultValue={settings.baseFare.toFixed(2)} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="perKmFare">Tarifa por Km (S/)</Label>
                  <Input id="perKmFare" defaultValue={settings.perKmFare.toFixed(2)} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="perMinuteFare">Tarifa por Minuto (S/)</Label>
                  <Input id="perMinuteFare" defaultValue={settings.perMinuteFare.toFixed(2)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Parámetros Operativos</CardTitle>
                <CardDescription>Ajusta los multiplicadores y parámetros generales de la app.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                 <div>
                    <h3 className="text-lg font-medium mb-4">Multiplicadores de Servicio</h3>
                    {settings.serviceTypes.map((service) => (
                        <div key={service.id} className="space-y-2 mb-4">
                        <Label htmlFor={`multiplier-${service.id}`}>Multiplicador {service.name}</Label>
                        <Input id={`multiplier-${service.id}`} defaultValue={service.multiplier} />
                        </div>
                    ))}
                </div>
                 <div>
                    <h3 className="text-lg font-medium mb-4">Configuración General</h3>
                    <div className="space-y-2 mb-4">
                        <Label htmlFor="negotiationRange">Rango de Negociación (%)</Label>
                        <Input id="negotiationRange" defaultValue={settings.negotiationRange}/>
                    </div>
                     <div className="space-y-2 mb-4">
                        <Label htmlFor="mapCenterLat">Latitud del Centro del Mapa</Label>
                        <Input id="mapCenterLat" defaultValue={settings.mapCenterLat}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="mapCenterLng">Longitud del Centro del Mapa</Label>
                        <Input id="mapCenterLng" defaultValue={settings.mapCenterLng}/>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Ajustes Secundarios y Acciones */}
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Reglas de Horas Punta</span>
                        <Button variant="ghost" size="icon"><PlusCircle className="h-5 w-5" /></Button>
                    </CardTitle>
                    <CardDescription>Define recargos automáticos para periodos de alta demanda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {settings.peakTimeRules.map((rule, index) => (
                    <div key={rule.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                            <Label htmlFor={`peak-name-${index}`} className="font-medium">{rule.name}</Label>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor={`peak-start-${index}`}>Hora Inicio</Label>
                                <Input id={`peak-start-${index}`} type="time" defaultValue={rule.startTime} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`peak-end-${index}`}>Hora Fin</Label>
                                <Input id={`peak-end-${index}`} type="time" defaultValue={rule.endTime} />
                            </div>
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor={`peak-surcharge-${index}`}>Recargo (%)</Label>
                            <Input id={`peak-surcharge-${index}`} type="number" defaultValue={rule.surcharge} />
                        </div>
                    </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
      
       <Card>
          <CardHeader>
             <CardTitle className="flex items-center justify-between">
                <span>Motivos de Cancelación</span>
                <Button variant="outline" size="sm" onClick={handleAddCancellationReason}>
                    <PlusCircle className="mr-2 h-4 w-4" />Añadir Motivo
                </Button>
            </CardTitle>
            <CardDescription>Define los motivos que los usuarios pueden seleccionar al cancelar un viaje.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.cancellationReasons.map((reason, index) => (
                <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                    <div className="flex-1 grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor={`reason-code-${index}`}>Código Interno (ID)</Label>
                            <Input id={`reason-code-${index}`} defaultValue={reason.code} placeholder="Ej: DRIVER_LATE" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor={`reason-text-${index}`}>Texto para el Usuario</Label>
                            <Input id={`reason-text-${index}`} defaultValue={reason.reason} placeholder="Ej: El conductor se demora mucho" />
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveCancellationReason(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
          </CardContent>
      </Card>

      <Card>
         <CardHeader>
            <CardTitle>Operaciones de Base de Datos</CardTitle>
            <CardDescription>Acciones de mantenimiento para la base de datos de ejemplo. Estas acciones son destructivas y requieren confirmación.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <h4 className="font-semibold">Poblar Base de Datos</h4>
                    <p className="text-sm text-muted-foreground">Inserta los datos de ejemplo.</p>
                </div>
                <Button variant="outline" onClick={() => setActionToConfirm('seed')} disabled={isSeeding}>
                    {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2" />}
                    Poblar
                </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50 bg-destructive/5">
                 <div>
                    <h4 className="font-semibold text-destructive">Reiniciar Base de Datos</h4>
                    <p className="text-sm text-muted-foreground">Borra y reinserta todos los datos.</p>
                 </div>
                <Button variant="destructive" onClick={() => setActionToConfirm('reset')} disabled={isResetting}>
                    {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2" />}
                    Reiniciar
                </Button>
            </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4">
            <Button onClick={handleSaveChanges} size="lg">
              <Save className="mr-2" />
              Guardar Todos los Cambios
            </Button>
        </div>


      <AlertDialog open={!!actionToConfirm} onOpenChange={(open) => !open && setActionToConfirm(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmación de Seguridad Requerida</AlertDialogTitle>
                <AlertDialogDescription>
                    Para proceder con la acción de '{actionToConfirm === 'seed' ? 'Poblar' : 'Reiniciar'} Base de Datos', por favor, ingresa tu contraseña de administrador. Esta es una medida de seguridad para prevenir acciones accidentales.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input 
                    id="password" 
                    type="password" 
                    placeholder="Introduce tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPassword('')}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmAction} disabled={!password || isSeeding || isResetting}>
                    {(isSeeding || isResetting) && <Loader2 className="mr-2 animate-spin"/>}
                    Confirmar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </div>
  );
}
