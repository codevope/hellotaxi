
'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Loader2, Save } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SpecialFareRule } from '@/lib/types';
import { DateRange } from 'react-day-picker';

const formSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  surcharge: z.coerce.number().min(1, 'El recargo debe ser de al menos 1%.').max(200, 'El recargo no puede superar el 200%.'),
  dateRange: z
    .object({
      from: z.date({ required_error: 'La fecha de inicio es requerida.' }),
      to: z.date({ required_error: 'La fecha de fin es requerida.' }),
    })
    .refine((data) => data.to >= data.from, {
      message: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
      path: ['to'],
    }),
});

interface SpecialFareRuleFormProps {
  rule?: SpecialFareRule | null;
  onFinished: () => void;
}

export default function SpecialFareRuleForm({ rule, onFinished }: SpecialFareRuleFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!rule;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      surcharge: 25,
      dateRange: undefined,
    },
  });

  useEffect(() => {
    if (rule) {
      form.reset({
        name: rule.name,
        surcharge: rule.surcharge,
        dateRange: {
          from: new Date(rule.startDate),
          to: new Date(rule.endDate),
        },
      });
    } else {
      form.reset({
        name: '',
        surcharge: 25,
        dateRange: undefined,
      });
    }
  }, [rule, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      if (isEditMode && rule) {
        const ruleRef = doc(db, 'specialFareRules', rule.id);
        const dataToSave = {
            id: rule.id,
            name: values.name,
            surcharge: values.surcharge,
            startDate: values.dateRange.from.toISOString(),
            endDate: values.dateRange.to.toISOString(),
        };
        await updateDoc(ruleRef, dataToSave);
        toast({ title: '¡Regla Actualizada!', description: `La regla "${values.name}" ha sido actualizada.` });
      } else {
        const newRuleRef = doc(collection(db, 'specialFareRules'));
        const dataToSave = {
            id: newRuleRef.id,
            name: values.name,
            surcharge: values.surcharge,
            startDate: values.dateRange.from.toISOString(),
            endDate: values.dateRange.to.toISOString(),
        };
        await setDoc(newRuleRef, dataToSave);
        toast({ title: '¡Regla Creada!', description: `La regla "${values.name}" ha sido creada.` });
      }

      onFinished();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la regla.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Evento</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Navidad 2024" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Rango de Fechas</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      id="date"
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value?.from && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value?.from ? (
                        field.value.to ? (
                          <>
                            {format(field.value.from, 'LLL dd, y')} - {format(field.value.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(field.value.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Selecciona un rango de fechas</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={field.value?.from}
                    selected={{ from: field.value?.from!, to: field.value?.to }}
                    onSelect={field.onChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="surcharge"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Porcentaje de Recargo (%)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
          {isEditMode ? 'Guardar Cambios' : 'Crear Regla'}
        </Button>
      </form>
    </Form>
  );
}
