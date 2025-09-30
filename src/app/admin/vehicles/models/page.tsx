
'use client';

import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { VehicleModel } from '@/lib/types';
import { Loader2, PlusCircle, MoreVertical, Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export default function VehicleModelsPage() {
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null);
  const [brandName, setBrandName] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [newModel, setNewModel] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'vehicleModels'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleModel));
      setVehicleModels(data.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching vehicle models:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los modelos de vehículos.' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const resetDialog = () => {
    setIsDialogOpen(false);
    setEditingModel(null);
    setBrandName('');
    setModels([]);
    setNewModel('');
    setIsSaving(false);
  };

  const handleOpenDialog = (model: VehicleModel | null = null) => {
    if (model) {
      setEditingModel(model);
      setBrandName(model.name);
      setModels(model.models);
    } else {
      setEditingModel(null);
      setBrandName('');
      setModels([]);
    }
    setIsDialogOpen(true);
  };
  
  const handleAddModel = () => {
    if (newModel.trim() && !models.includes(newModel.trim())) {
      setModels([...models, newModel.trim()]);
      setNewModel('');
    }
  };

  const handleRemoveModel = (modelToRemove: string) => {
    setModels(models.filter(model => model !== modelToRemove));
  };
  
  const handleSaveChanges = async () => {
    if (!brandName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'El nombre de la marca no puede estar vacío.' });
      return;
    }
    setIsSaving(true);
    try {
      if (editingModel) {
        // Update existing brand
        const modelRef = doc(db, 'vehicleModels', editingModel.id);
        await updateDoc(modelRef, { name: brandName, models: models });
        toast({ title: 'Marca actualizada', description: `La marca "${brandName}" ha sido actualizada.` });
      } else {
        // Create new brand
        await addDoc(collection(db, 'vehicleModels'), { name: brandName, models: models });
        toast({ title: 'Marca creada', description: `La marca "${brandName}" ha sido creada.` });
      }
      resetDialog();
    } catch (error) {
      console.error("Error saving vehicle model:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la marca.' });
      setIsSaving(false);
    }
  };

  const handleDeleteBrand = async (modelId: string) => {
    try {
      await deleteDoc(doc(db, 'vehicleModels', modelId));
      toast({ title: 'Marca Eliminada', description: 'La marca ha sido eliminada correctamente.' });
    } catch (error) {
       console.error("Error deleting brand:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la marca.' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl font-headline">Gestión de Modelos de Vehículos</h1>
            <p className="text-muted-foreground">Añade o edita las marcas y modelos disponibles en la plataforma.</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2" />
          Añadir Marca
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marcas y Modelos Registrados</CardTitle>
          <CardDescription>Esta es la lista central de vehículos que los conductores pueden seleccionar.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelos Disponibles</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleModels.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-bold text-lg">{brand.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2 max-w-lg">
                        {brand.models.map(model => <Badge key={model} variant="secondary">{model}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro de que quieres eliminar la marca "{brand.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción es permanente y eliminará todos los modelos asociados a esta marca.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBrand(brand.id)}>Sí, eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(brand)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingModel ? 'Editar Marca' : 'Añadir Nueva Marca'}</DialogTitle>
            <DialogDescription>
              Gestiona el nombre de la marca y la lista de modelos asociados.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="brandName">Nombre de la Marca</Label>
              <Input
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ej: Toyota"
              />
            </div>
            <div className="space-y-2">
              <Label>Modelos</Label>
              <div className="p-4 border rounded-lg min-h-[100px]">
                {models.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {models.map(model => (
                      <Badge key={model} variant="default" className="flex items-center gap-1">
                        {model}
                        <button onClick={() => handleRemoveModel(model)}><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Añade modelos a esta marca.</p>
                )}
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="newModel">Añadir Modelo</Label>
                <Input
                  id="newModel"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddModel())}
                  placeholder="Ej: Yaris"
                />
              </div>
              <Button type="button" onClick={handleAddModel}>Añadir</Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingModel ? 'Guardar Cambios' : 'Crear Marca'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
