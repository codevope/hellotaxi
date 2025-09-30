

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Car, Save } from 'lucide-react';
import type { Driver, Vehicle, VehicleModel } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DriverVehicleProps {
    driver: Omit<Driver, 'vehicle'> & { vehicle: Vehicle };
    onUpdate: (updatedDriver: Omit<Driver, 'vehicle'> & { vehicle: Vehicle }) => void;
}

export default function DriverVehicle({ driver, onUpdate }: DriverVehicleProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [allVehicleModels, setAllVehicleModels] = useState<VehicleModel[]>([]);
    
    // Local state for form fields
    const [brand, setBrand] = useState(driver.vehicle.brand);
    const [model, setModel] = useState(driver.vehicle.model);
    const [licensePlate, setLicensePlate] = useState(driver.vehicle.licensePlate);
    const [year, setYear] = useState(driver.vehicle.year);
    const [color, setColor] = useState(driver.vehicle.color);
    
    useEffect(() => {
        async function fetchVehicleModels() {
            const snapshot = await getDocs(collection(db, 'vehicleModels'));
            const models = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleModel));
            setAllVehicleModels(models.sort((a,b) => a.name.localeCompare(b.name)));
        }
        fetchVehicleModels();
    }, []);


    const handleSaveChanges = async () => {
        setIsSaving(true);
        
        try {
            // Validate unique license plate if it has changed
            if (licensePlate.toUpperCase() !== driver.vehicle.licensePlate.toUpperCase()) {
                const q = query(collection(db, 'vehicles'), where('licensePlate', '==', licensePlate.toUpperCase()));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    toast({
                        variant: 'destructive',
                        title: 'Placa Duplicada',
                        description: 'Esta placa ya está registrada en el sistema. Por favor, utiliza una diferente.',
                    });
                    setIsSaving(false);
                    return;
                }
            }
            
            const vehicleRef = doc(db, 'vehicles', driver.vehicle.id);
            const updates: Partial<Vehicle> = {
                brand,
                model,
                licensePlate: licensePlate.toUpperCase(),
                year: Number(year),
                color,
            };

            await updateDoc(vehicleRef, updates);
            const updatedVehicle = { ...driver.vehicle, ...updates };
            const updatedDriver = { ...driver, vehicle: updatedVehicle };
            onUpdate(updatedDriver); // Update parent state
            
            toast({
                title: '¡Vehículo Actualizado!',
                description: 'La información de tu vehículo ha sido guardada.',
            });
        } catch (error) {
            console.error("Error updating vehicle:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la información del vehículo.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const availableModels = allVehicleModels.find(b => b.name === brand)?.models || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Información de tu Vehículo</CardTitle>
                <CardDescription>
                    Mantén los datos de tu vehículo actualizados. Estos son los datos que verán los pasajeros.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="brand">Marca</Label>
                        <Select value={brand} onValueChange={value => { setBrand(value); setModel(''); }}>
                            <SelectTrigger id="brand">
                                <SelectValue placeholder="Selecciona una marca" />
                            </SelectTrigger>
                            <SelectContent>
                                {allVehicleModels.map(brand => (
                                    <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="model">Modelo</Label>
                        <Select value={model} onValueChange={setModel} disabled={!brand || availableModels.length === 0}>
                            <SelectTrigger id="model">
                                <SelectValue placeholder="Selecciona un modelo" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableModels.map(model => (
                                     <SelectItem key={model} value={model}>{model}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid sm:grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="licensePlate">Placa</Label>
                        <Input id="licensePlate" value={licensePlate} onChange={e => setLicensePlate(e.target.value.toUpperCase())} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="year">Año</Label>
                        <Input id="year" type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        <Input id="color" value={color} onChange={e => setColor(e.target.value)} />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar Cambios
                </Button>
            </CardFooter>
        </Card>
    );
}

    

    
