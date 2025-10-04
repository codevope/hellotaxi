

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  ShieldCheck,
  ShieldX,
  Star,
  XCircle,
  ShieldAlert,
  CreditCard,
  Loader2,
  Save,
  MoreVertical,
  Car,
  User,
  Calendar,
  CalendarCheck,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Driver, MembershipStatus, PaymentModel, Ride, User as AppUser, DocumentName, DocumentStatus, Vehicle, VehicleModel } from '@/lib/types';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDocumentStatus } from '@/lib/document-status';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const statusConfig: Record<Driver['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Disponible', variant: 'default' },
  unavailable: { label: 'No Disponible', variant: 'secondary' },
  'on-ride': { label: 'En Viaje', variant: 'outline' },
};

const documentStatusConfig: Record<Driver['documentsStatus'], {
  label: string;
  color: string;
  icon: JSX.Element;
}> = {
  approved: {
    label: 'Aprobado',
    color: 'text-green-600',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  pending: {
    label: 'Pendiente',
    color: 'text-yellow-600',
    icon: <ShieldAlert className="h-5 w-5" />,
  },
  rejected: {
    label: 'Rechazado',
    color: 'text-red-600',
    icon: <ShieldX className="h-5 w-5" />,
  },
};

const rideStatusConfig: Record<Ride['status'], { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  searching: { label: 'Buscando', variant: 'default' },
  accepted: { label: 'Aceptado', variant: 'default' },
  arrived: { label: 'Ha llegado', variant: 'default' },
  completed: { label: 'Completado', variant: 'secondary' },
  'in-progress': { label: 'En Progreso', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  'counter-offered': { label: 'Contraoferta', variant: 'default' }
};

const paymentModelConfig: Record<PaymentModel, string> = {
  commission: 'Comisión por Viaje',
  membership: 'Membresía Mensual',
};

const getMembershipStatus = (expiryDate?: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    if (!expiryDate) return { label: 'N/A', variant: 'secondary' };
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return { label: 'Vencida', variant: 'destructive' };
    if (diffDays <= 7) return { label: 'Por Vencer', variant: 'outline' };
    return { label: 'Activa', variant: 'default' };
}

type EnrichedRide = Omit<Ride, 'passenger' | 'driver' | 'vehicle'> & { passenger: AppUser, driver: Driver, vehicle?: Vehicle };
type EnrichedDriver = Omit<Driver, 'vehicle'> & { vehicle: Vehicle };


export default function DriverDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  
  const [driver, setDriver] = useState<EnrichedDriver | null>(null);
  const [rides, setRides] = useState<EnrichedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [allVehicleModels, setAllVehicleModels] = useState<VehicleModel[]>([]);

  // State for editable fields
  const [paymentModel, setPaymentModel] = useState<PaymentModel>('commission');
  const [documentsStatus, setDocumentsStatus] = useState<Driver['documentsStatus']>('pending');
  const [individualDocStatuses, setIndividualDocStatuses] = useState<Partial<Record<DocumentName, DocumentStatus>>>({});
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleYear, setVehicleYear] = useState<number>(new Date().getFullYear());
  const [vehicleColor, setVehicleColor] = useState('');


  useEffect(() => {
    if (typeof id !== 'string') return;
    
    async function fetchDriverData() {
      try {
        const [vehicleModelsSnapshot, driverSnap] = await Promise.all([
          getDocs(collection(db, 'vehicleModels')),
          getDoc(doc(db, 'drivers', id as string))
        ]);

        const fetchedVehicleModels = vehicleModelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleModel));
        setAllVehicleModels(fetchedVehicleModels.sort((a,b) => a.name.localeCompare(b.name)));

        if (driverSnap.exists()) {
          const driverData = { id: driverSnap.id, ...driverSnap.data() } as Driver;
          const vehicleSnap = await getDoc(driverData.vehicle as DocumentReference);
          
          if(!vehicleSnap.exists()){
             throw new Error("El vehículo asociado al conductor no fue encontrado.");
          }
          const vehicleData = {id: vehicleSnap.id, ...vehicleSnap.data()} as Vehicle;
          const enrichedDriver = {...driverData, vehicle: vehicleData };

          setDriver(enrichedDriver);
          setPaymentModel(enrichedDriver.paymentModel);
          setDocumentsStatus(enrichedDriver.documentsStatus);
          setVehicleBrand(enrichedDriver.vehicle.brand);
          setVehicleModel(enrichedDriver.vehicle.model);
          setLicensePlate(enrichedDriver.vehicle.licensePlate);
          setVehicleYear(enrichedDriver.vehicle.year);
          setVehicleColor(enrichedDriver.vehicle.color);
          setIndividualDocStatuses(enrichedDriver.documentStatus || {
            license: 'pending',
            insurance: 'pending',
            backgroundCheck: 'pending',
            technicalReview: 'pending',
            dni: 'pending',
            propertyCard: 'pending'
          });


          // Fetch driver's rides
           const ridesQuery = query(
            collection(db, 'rides'),
            where('driver', '==', driverSnap.ref)
          );
          const ridesSnapshot = await getDocs(ridesQuery);
          
          const driverRidesPromises = ridesSnapshot.docs.map(async (rideDoc) => {
              const rideData = { id: rideDoc.id, ...rideDoc.data() } as Ride;
              const passengerSnap = await getDoc(rideData.passenger as DocumentReference);

              if (!passengerSnap.exists()) return null; // Skip if passenger is missing

              const passengerData = passengerSnap.data() as AppUser;
              
              let rideVehicleData: Vehicle | undefined = undefined;
              if (rideData.vehicle) {
                const rideVehicleSnap = await getDoc(rideData.vehicle as DocumentReference);
                if (rideVehicleSnap.exists()) {
                    rideVehicleData = rideVehicleSnap.data() as Vehicle;
                }
              }

              return { ...rideData, driver: driverData, passenger: passengerData, vehicle: rideVehicleData };
          });

          const driverRides = (await Promise.all(driverRidesPromises)).filter(Boolean) as EnrichedRide[];
          setRides(driverRides.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        } else {
          console.error("No such driver!");
        }
      } catch (error) {
        console.error("Error fetching driver data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDriverData();
  }, [id]);


  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-8">
        <h1 className="text-2xl">Conductor no encontrado.</h1>
      </div>
    );
  }
  
  const handleSaveChanges = async () => {
    if (!driver) return;
    setIsUpdating(true);

    try {
      // Validate unique license plate
      if (licensePlate.toUpperCase() !== driver.vehicle.licensePlate.toUpperCase()) {
        const q = query(collection(db, 'vehicles'), where('licensePlate', '==', licensePlate.toUpperCase()));
        const querySnapshot = await getDocs(q);
         const otherVehicle = querySnapshot.docs.find(d => d.id !== driver.vehicle.id);
        if (otherVehicle) {
          toast({
            variant: 'destructive',
            title: 'Placa Duplicada',
            description: 'Esta placa ya está registrada en el sistema para otro vehículo.',
          });
          setIsUpdating(false);
          return;
        }
      }
      
      const driverRef = doc(db, 'drivers', driver.id);
      const vehicleRef = doc(db, 'vehicles', driver.vehicle.id);

      const allDocsApproved = Object.values(individualDocStatuses).every(s => s === 'approved');
      const finalDocumentsStatus = allDocsApproved ? 'approved' : documentsStatus;

      const driverUpdates: Partial<Omit<Driver, 'vehicle'>> = {
        paymentModel: paymentModel,
        documentStatus: individualDocStatuses as Record<DocumentName, DocumentStatus>,
        documentsStatus: finalDocumentsStatus,
      };
       if (paymentModel === 'membership' && !driver.membershipExpiryDate) {
        driverUpdates.membershipExpiryDate = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString();
      }

      
      const vehicleUpdates: Partial<Vehicle> = {
        brand: vehicleBrand,
        model: vehicleModel,
        licensePlate: licensePlate.toUpperCase(),
        year: vehicleYear,
        color: vehicleColor,
      }

      await updateDoc(driverRef, driverUpdates);
      await updateDoc(vehicleRef, vehicleUpdates);
      
      // Update local state to reflect changes immediately
      const updatedDriver = { ...driver, ...driverUpdates, vehicle: {...driver.vehicle, ...vehicleUpdates} };
      setDriver(updatedDriver);
      setDocumentsStatus(finalDocumentsStatus);
      
      toast({
        title: '¡Perfil del Conductor Actualizado!',
        description: 'Los cambios en el perfil del conductor han sido guardados.',
      });
    } catch (error) {
      console.error('Error updating driver:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el perfil del conductor.',
      });
    } finally {
      setIsUpdating(false);
    }
  };


  const handleApproval = async (status: 'approved' | 'rejected') => {
     if (!driver) return;
    setIsUpdating(true);
    const driverRef = doc(db, 'drivers', driver.id);
    try {
      await updateDoc(driverRef, { documentsStatus: status });
      setDriver({ ...driver, documentsStatus: status });
      setDocumentsStatus(status);
      toast({
        title: `Documentos ${status === 'approved' ? 'Aprobados' : 'Rechazados'}`,
        description: `El estado general de la documentación de ${driver.name} se ha actualizado.`,
      });
    } catch (error) {
        console.error('Error updating document status:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo actualizar el estado de los documentos.',
        });
    } finally {
        setIsUpdating(false);
    }
  };

  const handleIndividualDocStatusChange = (docName: DocumentName, status: DocumentStatus) => {
    setIndividualDocStatuses(prev => ({...prev, [docName]: status}));
  };
  
  const getIndividualDocBadge = (docName: DocumentName) => {
    const status = individualDocStatuses[docName] || 'pending';
    const config: Record<DocumentStatus, { label: string; variant: 'default' | 'outline' | 'destructive' }> = {
      approved: { label: 'Aprobado', variant: 'default' },
      pending: { label: 'Pendiente', variant: 'outline' },
      rejected: { label: 'Rechazado', variant: 'destructive' },
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };
  
  const docStatus = documentStatusConfig[documentsStatus];
  const membershipStatus = getMembershipStatus(driver.membershipExpiryDate);


  const driverDocumentDetails: { name: DocumentName; label: string; expiryDate: string }[] = [
    { name: 'dni', label: 'DNI', expiryDate: driver.dniExpiry },
    { name: 'license', label: 'Licencia de Conducir', expiryDate: driver.licenseExpiry },
    { name: 'backgroundCheck', label: 'Certificado de Antecedentes', expiryDate: driver.backgroundCheckExpiry },
  ];

  const vehicleDocumentDetails: { name: DocumentName; label: string; expiryDate?: string, registrationDate?: string }[] = [
    { name: 'propertyCard', label: 'Tarjeta de Propiedad', registrationDate: driver.vehicle.propertyCardRegistrationDate },
    { name: 'insurance', label: 'SOAT / Póliza de Seguro', expiryDate: driver.vehicle.insuranceExpiry },
    { name: 'technicalReview', label: 'Revisión Técnica', expiryDate: driver.vehicle.technicalReviewExpiry },
];

  const availableModels = allVehicleModels.find(b => b.name === vehicleBrand)?.models || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Detalles del Conductor
          </h1>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-8">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={driver.avatarUrl} alt={driver.name} />
                <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle>{driver.name}</CardTitle>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{driver.rating.toFixed(1)} de calificación</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <Badge variant={statusConfig[driver.status].variant}>
                  {statusConfig[driver.status].label}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Miembro desde:</span>
                  <span className="font-medium">Ene 2023</span>
                </div>
                 <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">KYC Verificado:</span>
                  {driver.kycVerified ? (
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Vehículo Asociado</CardTitle>
                <CardDescription>Tipo de servicio: <span className="font-semibold capitalize">{driver.vehicle.serviceType}</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleBrand">Marca</Label>
                  <Select
                    value={vehicleBrand}
                    onValueChange={(value) => {
                      setVehicleBrand(value);
                      setVehicleModel(''); // Reset model when brand changes
                    }}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="vehicleBrand">
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {allVehicleModels.map(brand => (
                        <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vehicleModel">Modelo</Label>
                    <Select
                      value={vehicleModel}
                      onValueChange={setVehicleModel}
                      disabled={isUpdating || !vehicleBrand || availableModels.length === 0}
                    >
                      <SelectTrigger id="vehicleModel">
                        <SelectValue placeholder="Seleccionar modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map(model => (
                           <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="vehicleYear">Año</Label>
                        <Input id="vehicleYear" type="number" value={vehicleYear} onChange={(e) => setVehicleYear(Number(e.target.value))} disabled={isUpdating} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vehicleColor">Color</Label>
                        <Input id="vehicleColor" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} disabled={isUpdating} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="licensePlate">Placa</Label>
                    <Input id="licensePlate" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value.toUpperCase())} disabled={isUpdating} />
                </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Modelo de Pago</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 text-sm">
                    <Select value={paymentModel} onValueChange={(value) => setPaymentModel(value as PaymentModel)} disabled={isUpdating}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar modelo de pago" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="commission">Comisión por Viaje</SelectItem>
                            <SelectItem value="membership">Membresía Mensual</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {paymentModel === 'membership' && (
                        <div className="space-y-2 pt-2">
                           <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Estado Membresía:</span>
                              <Badge variant={membershipStatus.variant}>
                                  {membershipStatus.label}
                              </Badge>
                           </div>
                           {driver.membershipExpiryDate && (
                              <div className="flex justify-between items-center text-xs">
                                 <span className="text-muted-foreground">Vence:</span>
                                 <span>{format(new Date(driver.membershipExpiryDate), 'dd MMM yyyy')}</span>
                              </div>
                           )}
                        </div>
                    )}
                </div>
            </CardContent>
          </Card>

        </div>

        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Verificación de Documentación</CardTitle>
              <CardDescription>
                Revisa el estado individual de cada documento y gestiona la aprobación general del conductor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`flex items-center gap-3 rounded-lg border p-4 ${docStatus.color}`}
              >
                {docStatus.icon}
                <div className="font-semibold">
                  Estado general de aprobación: {docStatus.label}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Documentos del Conductor</h3>
                <ul className="space-y-3">
                  {driverDocumentDetails.map(docDetail => {
                      const statusInfo = getDocumentStatus(docDetail.expiryDate);
                      return (
                         <li key={docDetail.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    <span>{docDetail.label}</span>
                                </div>
                                <div className={cn("flex items-center gap-1.5 text-sm font-medium ml-7", statusInfo.color)}>
                                    {statusInfo.icon}
                                    <span>{statusInfo.label} (Vence: {format(new Date(docDetail.expiryDate), 'dd/MM/yyyy')})</span>
                                </div>
                            </div>
                            <div className='flex items-center gap-2'>
                              {getIndividualDocBadge(docDetail.name)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleIndividualDocStatusChange(docDetail.name, 'approved')}>Aprobar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleIndividualDocStatusChange(docDetail.name, 'rejected')}>Rechazar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleIndividualDocStatusChange(docDetail.name, 'pending')}>Marcar como Pendiente</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                        </li>
                      )
                  })}
                </ul>
              </div>
              
               <div className="space-y-4">
                <h3 className="font-semibold">Documentos del Vehículo</h3>
                <ul className="space-y-3">
                  {vehicleDocumentDetails.map(docDetail => {
                      const statusInfo = docDetail.expiryDate ? getDocumentStatus(docDetail.expiryDate) : null;
                      return (
                         <li key={docDetail.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <Car className="h-5 w-5 text-muted-foreground" />
                                    <span>{docDetail.label}</span>
                                </div>
                                {statusInfo ? (
                                    <div className={cn("flex items-center gap-1.5 text-sm font-medium ml-7", statusInfo.color)}>
                                        {statusInfo.icon}
                                        <span>{statusInfo.label} (Vence: {format(new Date(docDetail.expiryDate!), 'dd/MM/yyyy')})</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-sm font-medium ml-7 text-muted-foreground">
                                        <CalendarCheck className="h-4 w-4" />
                                        {docDetail.registrationDate ? (
                                            <span>Registrado: {format(new Date(docDetail.registrationDate), 'dd/MM/yyyy')}</span>
                                        ) : (
                                            <span>Fecha no registrada</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className='flex items-center gap-2'>
                              {getIndividualDocBadge(docDetail.name)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleIndividualDocStatusChange(docDetail.name, 'approved')}>Aprobar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleIndividualDocStatusChange(docDetail.name, 'rejected')}>Rechazar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleIndividualDocStatusChange(docDetail.name, 'pending')}>Marcar como Pendiente</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                        </li>
                      )
                  })}
                </ul>
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t">
                 <Button onClick={handleSaveChanges} disabled={isUpdating} className="w-full">
                    {isUpdating ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2" />}
                    {isUpdating ? 'Guardando Cambios...' : 'Guardar Todos los Cambios'}
                </Button>
                <div className="flex gap-4">
                    <Button className="w-full" onClick={() => handleApproval('approved')} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="mr-2 animate-spin"/> : <CheckCircle className="mr-2" />}
                    Aprobar Conductor
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={() => handleApproval('rejected')} disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="mr-2 animate-spin"/> : <XCircle className="mr-2" />}
                    Rechazar Conductor
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Historial de Viajes Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {rides.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pasajero</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Tarifa</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rides.map((ride) => (
                      <TableRow key={ride.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={ride.passenger.avatarUrl} alt={ride.passenger.name} />
                                <AvatarFallback>{ride.passenger.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{ride.passenger.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(ride.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-right">S/{ride.fare.toFixed(2)}</TableCell>
                        <TableCell>
                           <Badge variant={rideStatusConfig[ride.status].variant}>
                                {rideStatusConfig[ride.status].label}
                            </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Este conductor aún no ha realizado ningún viaje.
                </p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
