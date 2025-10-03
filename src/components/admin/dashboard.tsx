
"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Activity, Car, CircleDollarSign, Users, Loader2 } from "lucide-react";
import RealtimeMap from "./realtime-map";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  DocumentReference,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Driver, Ride, User } from "@/lib/types";

const chartConfig = {
  total: {
    label: "Ingresos",
    color: "hsl(var(--chart-1))",
  },
};

type EnrichedRide = Omit<Ride, "driver" | "passenger"> & {
  driver: Driver;
  passenger: User;
};

interface AdminDashboardProps {
  selectedYear: number;
  selectedMonth: number;
}

// --- OPTIMIZED DATA FETCHING ---

async function getRidesForMonth(
  year: number,
  month: number,
  driversMap: Map<string, Driver>,
  usersMap: Map<string, User>
): Promise<EnrichedRide[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const ridesQuery = query(
    collection(db, "rides"),
    where("status", "==", "completed"),
    where("date", ">=", startDate.toISOString()),
    where("date", "<=", endDate.toISOString())
  );

  const rideSnapshot = await getDocs(ridesQuery);
  const ridesList = rideSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Ride)
  );

  const enrichedRides: EnrichedRide[] = [];
  for (const ride of ridesList) {
    const driverId = (ride.driver as DocumentReference)?.id;
    const passengerId = (ride.passenger as DocumentReference)?.id;

    const driver = driverId ? driversMap.get(driverId) : undefined;
    const passenger = passengerId ? usersMap.get(passengerId) : undefined;

    if (driver && passenger) {
      enrichedRides.push({ ...ride, driver, passenger });
    }
  }

  return enrichedRides;
}

async function getMonthlyRevenueChart(
  year: number,
  month: number,
  driversMap: Map<string, Driver>,
  usersMap: Map<string, User>
) {
  const chartData = [];
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  for (let i = 5; i >= 0; i--) {
    let targetMonth = month - i;
    let targetYear = year;
    if (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    const monthRides = await getRidesForMonth(targetYear, targetMonth, driversMap, usersMap);
    const total = monthRides.reduce((acc, ride) => acc + ride.fare, 0);

    chartData.push({
      month: months[targetMonth - 1],
      total: Math.round(total),
    });
  }

  return chartData;
}


// --- COMPONENT ---

export default function AdminDashboard({
  selectedYear,
  selectedMonth,
}: AdminDashboardProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rides, setRides] = useState<EnrichedRide[]>([]);
  const [chartData, setChartData] = useState<
    Array<{ month: string; total: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  const totalRevenue = rides.reduce((acc, ride) => acc + ride.fare, 0);
  const totalRides = rides.length;
  const activeDrivers = drivers.filter(
    (d) => d.status === "available" || d.status === "on-ride"
  ).length;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Step 1: Fetch all drivers and users and store them in maps for efficient lookup.
        const [driverSnapshot, userSnapshot] = await Promise.all([
          getDocs(collection(db, "drivers")),
          getDocs(collection(db, "users"))
        ]);

        const driverList = driverSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Driver)
        );
        setDrivers(driverList);
        
        const driversMap = new Map<string, Driver>(driverList.map(d => [d.id, d]));
        const usersMap = new Map<string, User>(userSnapshot.docs.map(u => [u.id, { id: u.id, ...u.data() } as User]));

        // Step 2: Fetch rides for the selected month using the maps.
        const fetchedRides = await getRidesForMonth(
          selectedYear,
          selectedMonth,
          driversMap,
          usersMap
        );
        setRides(
          fetchedRides.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );

        // Step 3: Fetch chart data, also using the maps.
        const fetchedChartData = await getMonthlyRevenueChart(
          selectedYear,
          selectedMonth,
          driversMap,
          usersMap
        );
        setChartData(fetchedChartData);
        
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedYear, selectedMonth]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="text-2xl font-bold">...</div>
              </div>
            ) : (
              <div className="text-2xl font-bold">
                S/{totalRevenue.toFixed(2)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Período seleccionado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Viajes del Mes
            </CardTitle>
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
            <p className="text-xs text-muted-foreground">Viajes completados</p>
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
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="text-2xl font-bold">...</div>
              </div>
            ) : (
              <div className="text-2xl font-bold">{activeDrivers}</div>
            )}
            <p className="text-xs text-muted-foreground">
              de {loading ? "..." : drivers.length} en total
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
                Evolución de ingresos de los 6 meses hasta el período
                seleccionado.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Viajes Recientes del Mes</CardTitle>
              <CardDescription>
                Últimos 5 viajes completados en el período seleccionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : rides.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-sm text-muted-foreground">
                    No hay viajes en este período
                  </div>
                </div>
              ) : (
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
                              ride.status === "completed"
                                ? "secondary"
                                : "default"
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    