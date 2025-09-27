'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Loader2, Star, ShieldX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/lib/types';
import Link from 'next/link';
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
import { cn } from '@/lib/utils';

async function getUsers(): Promise<User[]> {
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('role', '==', 'passenger'));
  const userSnapshot = await getDocs(q);
  const userList = userSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as User
  );
  return userList;
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadUsers() {
      try {
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const handleToggleBlockUser = async (user: User) => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    const userRef = doc(db, 'users', user.id);

    try {
      await updateDoc(userRef, { status: newStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      toast({
        title: `Usuario ${newStatus === 'blocked' ? 'Bloqueado' : 'Desbloqueado'}`,
        description: `${user.name} ha sido ${newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'} correctamente.`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado del usuario.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Usuarios (Pasajeros)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead>Viajes Totales</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className={cn(user.status === 'blocked' && 'bg-destructive/10')}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'blocked' ? 'destructive' : 'secondary'} className="capitalize">
                      {user.status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.signupDate).toLocaleDateString('es-PE')}
                  </TableCell>
                  <TableCell>{user.totalRides || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{(user.rating || 0).toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}`}>
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className={cn(user.status === 'blocked' ? 'text-green-600' : 'text-red-600')}
                              onSelect={(e) => e.preventDefault()}
                            >
                              {user.status === 'blocked' ? 'Desbloquear Usuario' : 'Bloquear Usuario'}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Estás seguro de que quieres {user.status === 'blocked' ? 'desbloquear' : 'bloquear'} a {user.name}?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {user.status === 'blocked' 
                                  ? 'Esta acción permitirá que el usuario vuelva a acceder a la aplicación.' 
                                  : 'Esta acción impedirá que el usuario acceda a la aplicación.'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className={cn(user.status !== 'blocked' && "bg-destructive hover:bg-destructive/90")}
                                onClick={() => handleToggleBlockUser(user)}
                              >
                                Sí, {user.status === 'blocked' ? 'desbloquear' : 'bloquear'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
