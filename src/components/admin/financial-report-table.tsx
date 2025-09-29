
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Loader2 } from 'lucide-react';
import type { FinancialReportRow } from '@/services/financial-report';

const paymentModelConfig = {
  commission: 'Comisión',
  membership: 'Membresía',
};

interface FinancialReportTableProps {
    reportData: FinancialReportRow[];
    loading: boolean;
}

export default function FinancialReportTable({ reportData, loading }: FinancialReportTableProps) {
  
  return (
    <Card>
    <CardHeader>
        <CardTitle>Desglose Mensual por Conductor</CardTitle>
        <CardDescription>Ingresos mensuales generados por cada conductor. Las membresías son tarifas fijas mensuales.</CardDescription>
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
                <TableHead className="text-right">Promedio por Viaje</TableHead>
                <TableHead className="text-right">Modelo de Ingreso</TableHead>
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
                <TableCell className="text-right">S/{row.averageFarePerRide.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                    {row.paymentModel === 'commission' 
                        ? `${(row.effectiveCommissionRate * 100).toFixed(1)}%`
                        : 'Membresía Fija'
                    }
                </TableCell>
                <TableCell className="text-right font-bold text-primary">S/{row.platformEarnings.toFixed(2)}</TableCell>
                </TableRow>
            ))}
             {reportData.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                        No se encontraron datos para el periodo seleccionado.
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        )}
    </CardContent>
    </Card>
  );
}
