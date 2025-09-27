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
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Calendar,
  BarChart,
  Star,
  Hash,
  Home,
  Phone,
  ShieldPlus,
  Save,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { User, Ride } from '@/lib/types';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
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
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const rideStatusConfig = {
  completed: { label: 'Completado', variant: 'secondary' },
  'in-progress': { label: 'En Progreso', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { appUser: adminUser } = useAuth();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (typeof id !== 'string') return;

    async function fetchData() {
      try {
        // Fetch user data
        const userDocRef = doc(db, 'users', id);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = { id: userSnap.id, ...userSnap.data() } as User;
          setUser(userData);
          setName(userData.name);
          setPhone(userData.phone || '');
          setAddress(userData.address || '');

          // Fetch user's rides
          const ridesQuery = query(
            collection(db, 'rides'),
            where('passenger', '==', userDocRef)
          );
          const ridesSnapshot = await getDocs(ridesQuery);
          const userRides = ridesSnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Ride)
          );
          setRides(userRides.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } else {
          console.error('No such user!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleMakeAdmin = async () => {
    if (!user) return;
    setIsUpdating(true);
    const userRef = doc(db, 'users', user.id);
    try {
      await updateDoc(userRef, { isAdmin: true });
      setUser({ ...user, isAdmin: true });
      toast({
        title: '¡Usuario ahora es Administrador!',
        description: `${user.name} ha sido promovido a administrador.`,
      });
    } catch (error) {
      console.error('Error making user admin:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo promover al usuario.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsUpdating(true);
    const userRef = doc(db, 'users', user.id);
    try {
      await updateDoc(userRef, {
        name: name,
        phone: phone,
        address: address,
      });
      setUser({ ...user, name, phone, address });
      toast({
        title: '¡Perfil Actualizado!',
        description: 'Los datos del usuario han sido actualizados.',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el perfil.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl">Usuario no encontrado.</h1>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Detalles del Usuario
          </h1>
        </div>
        {adminUser?.isAdmin && !user.isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isUpdating}>
                <ShieldPlus className="mr-2 h-4 w-4" />
                Hacer Administrador
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Hacer a {user.name} un administrador?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción le dará acceso completo al panel de
                  administración. No se puede deshacer fácilmente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleMakeAdmin}>
                  Sí, hacer admin
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-8">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle>{name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              {user.isAdmin && (
                <CardDescription className="font-bold text-primary">
                  Administrador
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Miembro desde{' '}
                    {format(new Date(user.signupDate), "MMMM 'de' yyyy", {
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveChanges}
                disabled={isUpdating}
                className="w-full"
              >
                <Save className="mr-2" />
                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas y Actividad</CardTitle>
              <CardDescription>
                Resumen del comportamiento del usuario en la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{user.totalRides || 0}</p>
                  <p className="text-sm text-muted-foreground">
                    Viajes Totales
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold flex items-center justify-center gap-1">
                    <Star className="h-7 w-7 text-yellow-400 fill-yellow-400" />
                    {(user.rating || 0).toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">Calificación</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold capitalize">
                    {user.status || 'active'}
                  </p>
                  <p className="text-sm text-muted-foreground">Estado</p>
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
                      <TableHead>Ruta</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Tarifa</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rides.map((ride) => (
                      <TableRow key={ride.id}>
                        <TableCell className="font-medium">
                          <div className="truncate max-w-xs">{ride.pickup} &rarr; {ride.dropoff}</div>
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
                  Este usuario aún no ha realizado ningún viaje.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
