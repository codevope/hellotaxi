
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ShieldCheck, ShieldAlert, ShieldX, Upload } from 'lucide-react';
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
        // Simulate file picker opening
        fileInputRef.current?.click();

        // Simulate file upload and update
        setTimeout(async () => {
            if (!driver) return;
            
            const currentDocumentStatus = driver.documentStatus || {} as Partial<Record<DocumentName, DocumentStatus>>;
            const newDocumentStatus: Record<DocumentName, DocumentStatus> = {
                license: currentDocumentStatus.license || 'pending',
                insurance: currentDocumentStatus.insurance || 'pending',
                technicalReview: currentDocumentStatus.technicalReview || 'pending',
                backgroundCheck: currentDocumentStatus.backgroundCheck || 'pending',
                [docName]: 'pending',
            };

            const allPendingOrApproved = Object.values(newDocumentStatus).every(s => s === 'pending' || s === 'approved');
            const anyRejected = Object.values(newDocumentStatus).some(s => s === 'rejected');
            
            let newOverallStatus: Driver['documentsStatus'] = 'pending';
            if (anyRejected) {
                newOverallStatus = 'rejected';
            } else if (Object.values(newDocumentStatus).every(s => s === 'approved')) {
                newOverallStatus = 'approved';
            }
            
            const driverRef = doc(db, 'drivers', driver.id);
            try {
                await updateDoc(driverRef, { 
                    documentStatus: newDocumentStatus,
                    documentsStatus: newOverallStatus
                });
                const updatedDriver = { 
                    ...driver, 
                    documentStatus: newDocumentStatus,
                    documentsStatus: newOverallStatus
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

    const documentDetails: { name: DocumentName, label: string, expiryDate?: string }[] = [
        { name: 'license', label: 'Licencia de Conducir', expiryDate: driver.licenseExpiry },
        { name: 'insurance', label: 'SOAT / Póliza de Seguro', expiryDate: driver.insuranceExpiry },
        { name: 'technicalReview', label: 'Revisión Técnica', expiryDate: driver.technicalReviewExpiry },
        { name: 'backgroundCheck', label: 'Certificado de Antecedentes', expiryDate: driver.backgroundCheckExpiry },
    ];
    
    return (
        <>
            <input type="file" ref={fileInputRef} className="hidden" />
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Documentos</CardTitle>
                    <CardDescription>
                        Mantén tus documentos actualizados para poder recibir viajes. Los documentos serán revisados por nuestro equipo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {documentDetails.map(({ name, label, expiryDate }) => {
                        const status = driver.documentStatus?.[name] || 'pending';
                        const expiryInfo = expiryDate ? getDocumentStatus(expiryDate) : null;
                        return (
                            <Card key={name} className={cn(status === 'rejected' && "border-destructive bg-destructive/5")}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
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
                                        {isUploading === name ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="mr-2 h-4 w-4" />
                                        )}
                                        {status === 'rejected' || status === 'pending' ? 'Volver a Subir Documento' : 'Actualizar Documento'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </CardContent>
            </Card>
        </>
    );
}
