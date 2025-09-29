
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Car, Save } from 'lucide-react';
import type { Driver, Vehicle } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DriverVehicleProps {
    driver: Omit<Driver, 'vehicle'> & { vehicle: Vehicle };
    onUpdate: (updatedDriver: Omit<Driver, 'vehicle'> & { vehicle: Vehicle }) => void;
}

export default function DriverVehicle({ driver, onUpdate }: DriverVehicleProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    // Local state for form fields
    const [brand, setBrand] = useState(driver.vehicle.brand);
    const [model, setModel] = useState(driver.vehicle.model);
    const [licensePlate, setLicensePlate] = useState(driver.vehicle.licensePlate);
    const [year, setYear] = useState(driver.vehicle.year);
    const [color, setColor] = useState(driver.vehicle.color);


    const handleSaveChanges = async () => {
        setIsSaving(true);
        const vehicleRef = doc(db, 'vehicles', driver.vehicle.id);
        
        const updates: Partial<Vehicle> = {
            brand,
            model,
            licensePlate,
            year: Number(year),
            color,
        };

        try {
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
                        <Input id="brand" value={brand} onChange={e => setBrand(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="model">Modelo</Label>
                        <Input id="model" value={model} onChange={e => setModel(e.target.value)} />
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

    
