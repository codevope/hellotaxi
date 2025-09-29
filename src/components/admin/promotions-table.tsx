
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import type { Coupon } from '@/lib/types';
import { Loader2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import PromotionsForm from './promotions-form';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


const statusConfig = {
  active: { label: 'Activo', variant: 'default' as const },
  expired: { label: 'Expirado', variant: 'secondary' as const },
  disabled: { label: 'Desactivado', variant: 'destructive' as const },
};


export default function PromotionsTable() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const couponsCol = collection(db, 'coupons');
    const unsubscribe = onSnapshot(couponsCol, (querySnapshot) => {
        const couponsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
        const sortedList = couponsList.sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime());
        setCoupons(sortedList);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching coupons:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleStatus = async (coupon: Coupon) => {
    const newStatus = coupon.status === 'active' ? 'disabled' : 'active';
    const couponRef = doc(db, 'coupons', coupon.id);
    try {
      await updateDoc(couponRef, { status: newStatus });
      toast({
        title: '¡Estado Actualizado!',
        description: `El cupón "${coupon.code}" ahora está ${newStatus === 'active' ? 'activo' : 'desactivado'}.`,
      });
    } catch (error) {
       console.error("Error updating coupon status:", error);
       toast({
         variant: 'destructive',
         title: 'Error',
         description: 'No se pudo actualizar el estado del cupón.',
       });
    }
  }
  
  const handleEditClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsEditOpen(true);
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Cupones Existentes</CardTitle>
          <CardDescription>
              Un registro de todos los códigos promocionales creados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
          ) : (
          <ScrollArea className="h-[500px]">
              <Table>
              <TableHeader>
                  <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Caducidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {coupons.map((coupon) => (
                  <TableRow key={coupon.id} className={cn(coupon.status !== 'active' && 'text-muted-foreground')}>
                      <TableCell>
                          <div className="font-medium text-primary">{coupon.code}</div>
                          {coupon.minSpend && (
                              <div className="text-xs">
                                  Gasto mín: S/{coupon.minSpend}
                              </div>
                          )}
                      </TableCell>
                      <TableCell>
                          <div className='font-semibold'>
                              {coupon.discountType === 'percentage'
                                  ? `${coupon.value}%`
                                  : `S/${coupon.value.toFixed(2)}`
                              }
                          </div>
                      </TableCell>
                      <TableCell>
                          {format(new Date(coupon.expiryDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                          <Badge variant={statusConfig[coupon.status].variant}>
                              {statusConfig[coupon.status].label}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                              </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleEditClick(coupon)}>
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem 
                                            onSelect={(e) => e.preventDefault()} 
                                            className={cn(coupon.status === 'active' ? "text-destructive" : "text-green-600")}
                                        >
                                            {coupon.status === 'active' ? 'Desactivar' : 'Activar'}
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción cambiará el estado del cupón "{coupon.code}" a <span className="font-bold">{coupon.status === 'active' ? 'desactivado' : 'activo'}</span>.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleToggleStatus(coupon)}>Sí, continuar</AlertDialogAction>
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
          </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Editar Cupón</DialogTitle>
              </DialogHeader>
              <PromotionsForm coupon={selectedCoupon} onFinished={() => setIsEditOpen(false)} isDialog={true} />
          </DialogContent>
      </Dialog>
    </>
  );
}
