

'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Upload, Car, User, Calendar } from 'lucide-react';
import type { Driver, DocumentName, DocumentStatus, EnrichedDriver } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDocumentStatus } from '@/lib/document-status';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface DriverDocumentsProps {
    driver: EnrichedDriver;
    onUpdate: (updatedDriver: EnrichedDriver) => void;
}

const docNameMap: Record<DocumentName, string> = {
    license: 'Licencia de Conducir',
    insurance: 'SOAT / Póliza de Seguro',
    technicalReview: 'Revisión Técnica',
    backgroundCheck: 'Certificado de Antecedentes',
    dni: 'DNI (Documento Nacional)',
    propertyCard: 'Tarjeta de Propiedad',
};

const individualDocStatusConfig: Record<DocumentStatus, { label: string; variant: 'default' | 'outline' | 'destructive' }> = {
    approved: { label: 'Aprobado', variant: 'default' },
    pending: { label: 'Pendiente', variant: 'outline' },
    rejected: { label: 'Rechazado', variant: 'destructive' },
};

export default function DriverDocuments({ driver, onUpdate }: DriverDocumentsProps) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState<DocumentName | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleUploadClick = (docName: DocumentName) => {
        setIsUploading(docName);
        fileInputRef.current?.click();

        setTimeout(async () => {
            if (!driver) return;
            
            const currentDocumentStatus = driver.documentStatus || {} as Partial<Record<DocumentName, DocumentStatus>>;
            const newDocumentStatus: Record<DocumentName, DocumentStatus> = {
                license: 'pending',
                insurance: 'pending', 
                technicalReview: 'pending',
                backgroundCheck: 'pending',
                dni: 'pending',
                propertyCard: 'pending',
                ...currentDocumentStatus,
                [docName]: 'pending',
            };
            
            const driverRef = doc(db, 'drivers', driver.id);
            try {
                await updateDoc(driverRef, { 
                    documentStatus: newDocumentStatus,
                    documentsStatus: 'pending' // Always set to pending on new upload
                });
                const updatedDriver = { 
                    ...driver, 
                    documentStatus: newDocumentStatus,
                    documentsStatus: 'pending' as const
                };
                onUpdate(updatedDriver);

                toast({
                    title: 'Documento Subido',
                    description: `Tu ${docNameMap[docName]} ha sido enviado para revisión.`,
                });

            } catch (error) {
                console.error("Error updating document status:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo subir el documento.' });
            } finally {
                setIsUploading(null);
            }
        }, 2000); // Simulate 2-second upload
    };
    
    // Separating driver personal documents from vehicle documents
    const personalDocuments: { name: DocumentName; label: string; expiryDate?: string }[] = [
        { name: 'dni', label: 'DNI', expiryDate: driver.dniExpiry },
        { name: 'license', label: 'Licencia de Conducir', expiryDate: driver.licenseExpiry },
        { name: 'backgroundCheck', label: 'Certificado de Antecedentes', expiryDate: driver.backgroundCheckExpiry },
    ];
    
    const vehicleDocuments: { name: DocumentName; label: string; expiryDate?: string, registrationDate?: string }[] = [
        { name: 'propertyCard', label: 'Tarjeta de Propiedad', registrationDate: driver.vehicle.propertyCardRegistrationDate },
        { name: 'insurance', label: 'SOAT / Póliza de Seguro', expiryDate: driver.vehicle.insuranceExpiry },
        { name: 'technicalReview', label: 'Revisión Técnica', expiryDate: driver.vehicle.technicalReviewExpiry },
    ];
    
    return (
        <>
            <input type="file" ref={fileInputRef} className="hidden" />
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Mis Documentos Personales</CardTitle>
                        <CardDescription>
                            Mantén tus documentos personales actualizados para poder recibir viajes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {personalDocuments.map(({ name, label, expiryDate }) => {
                            const status = driver.documentStatus?.[name] || 'pending';
                            const expiryInfo = expiryDate ? getDocumentStatus(expiryDate) : null;
                            return (
                                <Card key={name} className={cn(status === 'rejected' && "border-destructive bg-destructive/5")}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <User className="h-5 w-5" />
                                                    <span>{label}</span>
                                                </CardTitle>
                                                 {expiryDate && (
                                                    <CardDescription className={cn("flex items-center gap-1.5 mt-2", expiryInfo?.color)}>
                                                        {expiryInfo?.icon}
                                                        <span>{expiryInfo?.label} (Vence: {format(new Date(expiryDate), 'dd/MM/yyyy')})</span>
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <Badge variant={individualDocStatusConfig[status].variant}>
                                                {individualDocStatusConfig[status].label}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Button 
                                            className="w-full sm:w-auto"
                                            onClick={() => handleUploadClick(name)}
                                            disabled={isUploading === name}
                                        >
                                            {isUploading === name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                            {status === 'rejected' || status === 'pending' ? 'Volver a Subir' : 'Actualizar'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Documentos de Mi Vehículo</CardTitle>
                        <CardDescription>
                            Estos son los documentos asociados al vehículo con placa <Badge variant="secondary">{driver.vehicle.licensePlate}</Badge>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         {vehicleDocuments.map(({ name, label, expiryDate, registrationDate }) => {
                            const status = driver.documentStatus?.[name] || 'pending';
                            const expiryInfo = expiryDate ? getDocumentStatus(expiryDate) : null;
                            return (
                                <Card key={name} className={cn(status === 'rejected' && "border-destructive bg-destructive/5")}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Car className="h-5 w-5" />
                                                    <span>{label}</span>
                                                </CardTitle>
                                                 {expiryInfo ? (
                                                    <CardDescription className={cn("flex items-center gap-1.5 mt-2", expiryInfo.color)}>
                                                        {expiryInfo.icon}
                                                        <span>{expiryInfo.label} (Vence: {format(new Date(expiryDate!), 'dd/MM/yyyy')})</span>
                                                    </CardDescription>
                                                ) : (
                                                    <CardDescription className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        {registrationDate ? (
                                                            <span>Registrado: {format(new Date(registrationDate), 'dd/MM/yyyy')}</span>
                                                        ) : (
                                                            <span>Fecha no registrada</span>
                                                        )}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <Badge variant={individualDocStatusConfig[status].variant}>
                                                {individualDocStatusConfig[status].label}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Button 
                                            className="w-full sm:w-auto"
                                            onClick={() => handleUploadClick(name)}
                                            disabled={isUploading === name}
                                        >
                                            {isUploading === name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                            {status === 'rejected' || status === 'pending' ? 'Volver a Subir' : 'Actualizar'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
