'use client';

import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Loader2, DollarSign, Wallet } from 'lucide-react';
import { generateFinancialReport, FinancialReportRow } from '@/services/financial-report';
import { useToast } from '@/hooks/use-toast';

const paymentModelConfig = {
  commission: 'Comisión',
  membership: 'Membresía',
};

export default function FinancialReportTable() {
  const [reportData, setReportData] = useState<FinancialReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await generateFinancialReport();
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
  }, [toast]);

  const totalPlatformEarnings = reportData.reduce((sum, row) => sum + row.platformEarnings, 0);
  const totalFaresGenerated = reportData.reduce((sum, row) => sum + row.totalFares, 0);

  return (
    <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales de la Plataforma</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">S/{totalPlatformEarnings.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Suma de comisiones y membresías</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Volumen Total Transado</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">S/{totalFaresGenerated.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Suma total de todas las tarifas de viajes completados</p>
                </CardContent>
            </Card>
        </div>

        <Card>
        <CardHeader>
            <CardTitle>Desglose por Conductor</CardTitle>
            <CardDescription>Análisis de ingresos generados por cada conductor.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Modelo de Pago</TableHead>
                    <TableHead className="text-right">Viajes Totales</TableHead>
                    <TableHead className="text-right">Total Generado</TableHead>
                    <TableHead className="text-right">Ganancia Plataforma</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {reportData.map((row) => (
                    <TableRow key={row.driverId}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={row.driverAvatarUrl} alt={row.driverName} />
                            <AvatarFallback>{row.driverName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{row.driverName}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">{paymentModelConfig[row.paymentModel]}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{row.totalRides}</TableCell>
                    <TableCell className="text-right">S/{row.totalFares.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">S/{row.platformEarnings.toFixed(2)}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
