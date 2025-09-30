
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { VehicleModel } from '@/lib/types';
import { Loader2, PlusCircle, Trash2, Edit, X } from 'lucide-react';
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

export default function VehicleModelsManager() {
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
        const modelRef = doc(db, 'vehicleModels', editingModel.id);
        await updateDoc(modelRef, { name: brandName, models });
        toast({ title: 'Marca actualizada', description: `La marca "${brandName}" ha sido actualizada.` });
      } else {
        await addDoc(collection(db, 'vehicleModels'), { name: brandName, models });
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Marcas y Modelos de Vehículos</CardTitle>
            <CardDescription>Añade, edita o elimina las marcas y modelos disponibles en la plataforma.</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2" />
            Añadir Marca
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicleModels.map((brand) => (
              <Card key={brand.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{brand.name}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(brand)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar la marca "{brand.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción es permanente y eliminará todos los modelos asociados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteBrand(brand.id)}>Sí, eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex flex-wrap gap-2">
                    {brand.models.length > 0 ? (
                      brand.models.map(model => <Badge key={model} variant="secondary">{model}</Badge>)
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay modelos</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingModel ? `Editar Marca: ${editingModel.name}` : 'Añadir Nueva Marca'}</DialogTitle>
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
                      <Badge key={model} variant="default" className="flex items-center gap-1.5 py-1 text-sm">
                        {model}
                        <button
                          onClick={() => handleRemoveModel(model)}
                          className="rounded-full hover:bg-background/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
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
    </>
  );
}
