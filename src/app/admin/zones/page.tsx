

'use client';

import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { SpecialFareRule } from '@/lib/types';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SpecialFareRuleForm from '@/components/admin/special-fare-rule-form';

export default function AdminZonesPage() {
  const [rules, setRules] = useState<SpecialFareRule[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<SpecialFareRule | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const rulesCol = collection(db, 'specialFareRules');
    const unsubscribe = onSnapshot(
      rulesCol,
      (querySnapshot) => {
        const fetchedRules = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as SpecialFareRule)
        );
        setRules(fetchedRules);
        setIsFetching(false);
      },
      (error) => {
        console.error("Error fetching special fare rules:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las reglas de tarifas.' });
        setIsFetching(false);
      }
    );
    return () => unsubscribe();
  }, [toast]);

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'specialFareRules', id));
      toast({ title: 'Regla Eliminada', description: 'La regla de tarifa ha sido eliminada.' });
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la regla.' });
    }
  };
  
  const handleEditClick = (rule: SpecialFareRule) => {
      setSelectedRule(rule);
      setIsDialogOpen(true);
  }
  
  const handleAddClick = () => {
      setSelectedRule(null);
      setIsDialogOpen(true);
  }
  
  const onFormFinished = () => {
      setIsDialogOpen(false);
      setSelectedRule(null);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Gestión de Tarifas Especiales
          </h1>
        </div>
         <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2" />
            Añadir Nueva Regla
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reglas de Tarifas Activas</CardTitle>
          <CardDescription>Lista de todos los periodos con recargos especiales por fecha.</CardDescription>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Recargo</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{`${format(new Date(rule.startDate), 'dd/MM/yy')} - ${format(
                      new Date(rule.endDate),
                      'dd/MM/yy'
                    )}`}</TableCell>
                    <TableCell className="font-semibold text-primary">{rule.surcharge}%</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditClick(rule)}>
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                            Eliminar
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción eliminará permanentemente la regla "{rule.name}".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteRule(rule.id)}>Sí, eliminar</AlertDialogAction>
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
      
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{selectedRule ? "Editar Regla de Tarifa" : "Añadir Nueva Regla de Tarifa"}</DialogTitle>
              </DialogHeader>
              <SpecialFareRuleForm rule={selectedRule} onFinished={onFormFinished} />
          </DialogContent>
      </Dialog>

    </div>
  );
}
