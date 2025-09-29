
'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Ticket, Loader2, Save } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Coupon } from '@/lib/types';

const formSchema = z.object({
  code: z.string().min(5, 'El código debe tener al menos 5 caracteres.').toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().min(1, 'El valor debe ser al menos 1.'),
  expiryDate: z.date({
    required_error: "La fecha de caducidad es requerida.",
  }),
  minSpend: z.coerce.number().optional(),
});

interface PromotionsFormProps {
    coupon?: Coupon | null;
    onFinished?: () => void;
    isDialog?: boolean;
}


export default function PromotionsForm({ coupon, onFinished, isDialog = false }: PromotionsFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!coupon;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: coupon?.code || '',
      discountType: coupon?.discountType || 'percentage',
      value: coupon?.value || 10,
      minSpend: coupon?.minSpend || undefined,
      expiryDate: coupon ? new Date(coupon.expiryDate) : undefined,
    },
  });

  useEffect(() => {
    if (coupon) {
      form.reset({
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        expiryDate: new Date(coupon.expiryDate),
        minSpend: coupon.minSpend,
      });
    } else {
        form.reset({
            code: '',
            discountType: 'percentage',
            value: 10,
            minSpend: undefined,
            expiryDate: undefined
        });
    }
  }, [coupon, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
        if (isEditMode && coupon) {
             const couponRef = doc(db, "coupons", coupon.id);
             const dataToUpdate = {
                ...values,
                expiryDate: values.expiryDate.toISOString(),
             };
             await updateDoc(couponRef, dataToUpdate);
             toast({
                title: '¡Cupón Actualizado!',
                description: `El cupón "${values.code}" ha sido actualizado.`,
            });
        } else {
            const couponRef = doc(db, "coupons", values.code);
            const dataToSet = {
                ...values,
                id: values.code, // Use code as ID and save it in the document
                expiryDate: values.expiryDate.toISOString(),
                status: 'active',
                timesUsed: 0,
                usageLimit: 1, // Default, could be a form field
            };
            await setDoc(couponRef, dataToSet);
            toast({
                title: '¡Cupón Creado!',
                description: `El cupón "${values.code}" ha sido creado exitosamente.`,
            });
        }
        
        if(onFinished) {
            onFinished();
        } else {
            form.reset({
                code: '',
                discountType: 'percentage',
                value: 10,
                minSpend: undefined,
                expiryDate: undefined,
            });
        }

    } catch (error) {
        console.error("Error saving coupon:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo guardar el cupón.',
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  const FormContent = (
    <div className={cn(!isDialog && "space-y-4", isDialog && "pt-4")}>
      <FormField
        control={form.control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Código del Cupón</FormLabel>
            <FormControl>
              <Input placeholder="Ej: VERANO20" {...field} disabled={isEditMode} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

       <FormField
        control={form.control}
        name="discountType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Descuento</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                <SelectItem value="fixed">Monto Fijo (S/)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="value"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Valor del Descuento</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="expiryDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Fecha de Caducidad</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Elige una fecha</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date < new Date() && !isEditMode}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="minSpend"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gasto Mínimo (S/)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Opcional" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={cn(isDialog && 'space-y-4')}>
          {!isDialog ? (
             <Card>
                <CardHeader>
                    <CardTitle>{isEditMode ? "Editar Cupón" : "Crear Nuevo Cupón"}</CardTitle>
                    <CardDescription>
                        Rellena los detalles para generar un nuevo código de descuento.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {FormContent}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Ticket className="mr-2" />}
                    {isEditMode ? "Guardar Cambios" : "Crear Cupón"}
                    </Button>
                </CardFooter>
             </Card>
          ) : (
            <>
              {FormContent}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                Guardar Cambios
              </Button>
            </>
          )}
        </form>
      </Form>
  );
}
