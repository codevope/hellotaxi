'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Activity, Car, CircleDollarSign, Users } from 'lucide-react';
import RealtimeMap from './realtime-map';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Driver, Ride, User } from '@/lib/types';

const chartData = [
  { month: 'Enero', total: Math.floor(Math.random() * 2000) + 1000 },
  { month: 'Febrero', total: Math.floor(Math.random() * 2000) + 1000 },
  { month: 'Marzo', total: Math.floor(Math.random() * 2000) + 1000 },
  { month: 'Abril', total: Math.floor(Math.random() * 2000) + 1000 },
  { month: 'Mayo', total: Math.floor(Math.random() * 2000) + 1000 },
  { month: 'Junio', total: Math.floor(Math.random() * 2000) + 1000 },
];

const chartConfig = {
  total: {
    label: 'Ingresos',
    color: 'hsl(var(--chart-1))',
  },
};

type EnrichedRide = Omit<Ride, 'driver' | 'passenger'> & { driver: Driver; passenger: User };

async function getRides(): Promise<EnrichedRide[]> {
  const ridesCol = collection(db, 'rides');
  const rideSnapshot = await getDocs(ridesCol);
  const ridesList = rideSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));

  const enrichedRides: EnrichedRide[] = [];

  for (const ride of ridesList) {
    let driver: Driver | null = null;
    let passenger: User | null = null;

    if (ride.driver && typeof ride.driver.path === 'string') {
        const driverSnap = await getDoc(doc(db, ride.driver.path));
        if (driverSnap.exists()) {
            driver = { id: driverSnap.id, ...driverSnap.data() } as Driver;
        }
    }

    if (ride.passenger && typeof ride.passenger.path === 'string') {
        const passengerSnap = await getDoc(doc(db, ride.passenger.path));
        if (passengerSnap.exists()) {
            passenger = { id: passengerSnap.id, ...passengerSnap.data() } as User;
        }
    }
    
    if (driver && passenger) {
        enrichedRides.push({ ...ride, driver, passenger });
    }
  }

  return enrichedRides;
}

export default function AdminDashboard() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rides, setRides] = useState<EnrichedRide[]>([]);

  const totalRevenue = rides.reduce((acc, ride) => acc + ride.fare, 0);
  const totalRides = rides.length;
  const activeDrivers = drivers.filter(
    (d) => d.status === 'available' || d.status === 'on-ride'
  ).length;

    useEffect(() => {
        async function loadData() {
            const driversCol = collection(db, 'drivers');
            const driverSnapshot = await getDocs(driversCol);
            const driverList = driverSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Driver);
            setDrivers(driverList);

            const fetchedRides = await getRides();
            setRides(fetchedRides.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        loadData();
    }, []);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/{totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% desde el mes pasado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viajes Totales</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalRides}</div>
            <p className="text-xs text-muted-foreground">
              +180.1% desde el mes pasado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conductores Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{activeDrivers}</div>
            <p className="text-xs text-muted-foreground">
              de {drivers.length} en total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Actividad del Servidor
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Normal</div>
            <p className="text-xs text-muted-foreground">
              Última revisión: hace 2 minutos
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-8">
        <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-lg border">
          <RealtimeMap />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Ingresos</CardTitle>
              <CardDescription>
                Ingresos mensuales de los últimos 6 meses.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={8} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Viajes Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Tarifa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rides.slice(0, 5).map((ride) => (
                    <TableRow key={ride.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={ride.driver.avatarUrl} />
                            <AvatarFallback>
                              {ride.driver.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {ride.driver.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ride.status === 'completed'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {ride.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        S/{ride.fare.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
