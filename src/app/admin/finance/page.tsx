
'use client';

import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import FinancialReportTable from '@/components/admin/financial-report-table';
import { Loader2, BarChart as BarChartIcon, DollarSign, Wallet, TrendingUp, Users, Car, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateFinancialReport, type FinancialReportRow, type FinancialSummary } from '@/services/financial-report';
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
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // +1 porque getMonth() es 0-indexed
  const [reportData, setReportData] = useState<FinancialReportRow[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        // Calcular primer y último día del mes seleccionado
        const startDate = new Date(selectedYear, selectedMonth - 1, 1); // -1 porque Date() usa meses 0-indexed
        const endDate = new Date(selectedYear, selectedMonth, 0); // Día 0 del siguiente mes = último día del mes actual
        
        const result = await generateFinancialReport(startDate, endDate);
        setReportData(result.reportData);
        setSummary(result.summary);
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
  }, [selectedYear, selectedMonth, toast]);
  
  const totalPlatformEarnings = summary?.totalPlatformEarnings || 0;
  const totalFaresGenerated = summary?.totalFaresGenerated || 0;
  const totalRides = summary?.totalRides || 0;
  const activeDrivers = summary?.activeDrivers || 0;
  
  const topDriversData = reportData
    .slice(0, 5)
    .map(d => ({ name: d.driverName.split(' ')[0], earnings: d.platformEarnings }))
    .reverse();

  // Helper para obtener nombre del mes
  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1];
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl font-headline">
                Reporte Financiero - {getMonthName(selectedMonth)} {selectedYear}
            </h1>
            <p className="text-muted-foreground">Análisis mensual de ingresos de la plataforma y rendimiento de conductores.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = currentDate.getFullYear() - 2 + i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Enero</SelectItem>
              <SelectItem value="2">Febrero</SelectItem>
              <SelectItem value="3">Marzo</SelectItem>
              <SelectItem value="4">Abril</SelectItem>
              <SelectItem value="5">Mayo</SelectItem>
              <SelectItem value="6">Junio</SelectItem>
              <SelectItem value="7">Julio</SelectItem>
              <SelectItem value="8">Agosto</SelectItem>
              <SelectItem value="9">Septiembre</SelectItem>
              <SelectItem value="10">Octubre</SelectItem>
              <SelectItem value="11">Noviembre</SelectItem>
              <SelectItem value="12">Diciembre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos de la Plataforma</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <div className="text-2xl font-bold">Cargando...</div>
                        </div>
                    ) : (
                        <div className="text-2xl font-bold">S/{totalPlatformEarnings.toFixed(2)}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Comisiones + membresías mensuales</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Volumen Total Transado</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <div className="text-2xl font-bold">...</div>
                        </div>
                    ) : (
                        <div className="text-2xl font-bold">S/{totalFaresGenerated.toFixed(2)}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Total de tarifas del período</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Viajes Completados</CardTitle>
                    <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <div className="text-2xl font-bold">...</div>
                        </div>
                    ) : (
                        <div className="text-2xl font-bold">{totalRides}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Viajes del período seleccionado</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conductores Activos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <div className="text-2xl font-bold">...</div>
                        </div>
                    ) : (
                        <div className="text-2xl font-bold">{activeDrivers}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Conductores con viajes completados</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos por Comisión</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <div className="text-2xl font-bold">...</div>
                        </div>
                    ) : (
                        <div className="text-2xl font-bold">S/{(summary?.commissionBasedEarnings || 0).toFixed(2)}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Solo del modelo de comisión</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos por Membresía</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <div className="text-2xl font-bold">...</div>
                        </div>
                    ) : (
                        <div className="text-2xl font-bold">S/{(summary?.membershipBasedEarnings || 0).toFixed(2)}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Tarifas mensuales fijas</p>
                </CardContent>
            </Card>
             <Card className="lg:col-span-1">
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
