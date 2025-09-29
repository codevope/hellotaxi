
'use client';

import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import FinancialReportTable from '@/components/admin/financial-report-table';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, BarChart as BarChartIcon, DollarSign, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { generateFinancialReport, type FinancialReportRow } from '@/services/financial-report';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';


const chartConfig = {
  earnings: {
    label: 'Ingresos',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;


export default function AdminFinancePage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [reportData, setReportData] = useState<FinancialReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const data = await generateFinancialReport(date?.from, date?.to);
        setReportData(data);
      } catch (error) {
        console.error("Error generating financial report:", error);
        toast({
          variant: 'destructive',
          title: "Error al generar el reporte",
          description: "No se pudieron cargar los datos financieros. Inténtalo de nuevo."
        });
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [date, toast]);
  
  const totalPlatformEarnings = reportData.reduce((sum, row) => sum + row.platformEarnings, 0);
  const totalFaresGenerated = reportData.reduce((sum, row) => sum + row.totalFares, 0);
  
  const topDriversData = reportData
    .slice(0, 5)
    .map(d => ({ name: d.driverName.split(' ')[0], earnings: d.platformEarnings }))
    .reverse();


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl font-headline">
                Reporte Financiero
            </h1>
            <p className="text-muted-foreground">Analiza los ingresos de la plataforma y el rendimiento de los conductores.</p>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Elige una fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos de la Plataforma</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">S/{totalPlatformEarnings.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Suma de comisiones y membresías en el periodo</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Volumen Total Transado</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">S/{totalFaresGenerated.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Suma de todas las tarifas de viajes completados</p>
                </CardContent>
            </Card>
             <Card className="lg:col-span-2">
                 <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><BarChartIcon className="h-5 w-5" />Top 5 Conductores por Ingresos</CardTitle>
                 </CardHeader>
                 <CardContent className="h-48">
                    {loading ? (
                         <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ): (
                         <ChartContainer config={chartConfig} className="w-full h-full">
                            <BarChart accessibilityLayer data={topDriversData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={60} />
                                <ChartTooltip
                                    cursor={{fill: 'hsl(var(--muted))'}}
                                    content={<ChartTooltipContent 
                                        formatter={(value) => `S/${Number(value).toFixed(2)}`}
                                        labelFormatter={(label) => `Ingresos de ${label}`}
                                    />}
                                />
                                <Bar dataKey="earnings" fill="var(--color-earnings)" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ChartContainer>
                    )}
                 </CardContent>
            </Card>
        </div>


      <FinancialReportTable reportData={reportData} loading={loading} />
      
    </div>
  );
}
