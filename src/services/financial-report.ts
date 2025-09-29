
'use server';

import { collection, getDocs, doc, getDoc, query, where, Timestamp, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Driver, Ride, Settings, Vehicle } from '@/lib/types';
import { getSettings } from './settings-service';

export interface FinancialReportRow {
    driverId: string;
    driverName: string;
    driverAvatarUrl: string;
    paymentModel: 'commission' | 'membership';
    totalRides: number;
    totalFares: number;
    platformEarnings: number;
    averageFarePerRide: number;
    effectiveCommissionRate: number;
    membershipFeeApplied: number;
}

export interface FinancialSummary {
    totalPlatformEarnings: number;
    totalFaresGenerated: number;
    totalRides: number;
    averageEarningsPerRide: number;
    commissionBasedEarnings: number;
    membershipBasedEarnings: number;
    activeDrivers: number;
}


export async function generateFinancialReport(startDate?: Date, endDate?: Date): Promise<{ reportData: FinancialReportRow[]; summary: FinancialSummary }> {
    const settings = await getSettings();

    // 1. Construir consultas con fechas ISO string
    let ridesQuery = query(collection(db, 'rides'), where('status', '==', 'completed'));
    
    if (startDate) {
        ridesQuery = query(ridesQuery, where('date', '>=', startDate.toISOString()));
    }
    if (endDate) {
        // Incluir todo el día final
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        ridesQuery = query(ridesQuery, where('date', '<=', endOfDay.toISOString()));
    }

    // 2. Obtener viajes completados en el período
    const rideSnapshot = await getDocs(ridesQuery);
    const completedRides = rideSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));

    // 3. Agrupar viajes por conductor y obtener datos de conductores únicos
    const driverRideMap = new Map<string, Ride[]>();
    const driverIds = new Set<string>();

    for (const ride of completedRides) {
        if (ride.driver && ride.driver instanceof DocumentReference) {
            const driverId = ride.driver.id;
            driverIds.add(driverId);
            
            if (!driverRideMap.has(driverId)) {
                driverRideMap.set(driverId, []);
            }
            driverRideMap.get(driverId)!.push(ride);
        }
    }

    // 4. Obtener información de conductores que tuvieron viajes
    const reportData: FinancialReportRow[] = [];
    let totalPlatformEarnings = 0;
    let totalFaresGenerated = 0;
    let totalRides = 0;
    let commissionBasedEarnings = 0;
    let membershipBasedEarnings = 0;

    // Para reporte mensual - sin prorrateo, usamos tarifas fijas mensuales

    for (const driverId of driverIds) {
        try {
            // Obtener datos del conductor
            const driverDoc = await getDoc(doc(db, 'drivers', driverId));
            if (!driverDoc.exists()) continue;

            const driverData = { id: driverDoc.id, ...driverDoc.data() } as Driver;
            
            // Obtener datos del vehículo
            let vehicleData: Vehicle | null = null;
            if (driverData.vehicle instanceof DocumentReference) {
                const vehicleDoc = await getDoc(driverData.vehicle);
                if (vehicleDoc.exists()) {
                    vehicleData = vehicleDoc.data() as Vehicle;
                }
            }

            const driverRides = driverRideMap.get(driverId) || [];
            const driverTotalRides = driverRides.length;
            const driverTotalFares = driverRides.reduce((sum, ride) => sum + ride.fare, 0);

            // Calcular ganancias de la plataforma
            let platformEarnings = 0;
            let membershipFeeApplied = 0;
            let effectiveCommissionRate = 0;

            if (driverData.paymentModel === 'commission') {
                // Usar configuración de comisión de settings (asumiendo 20% por defecto)
                const commissionRate = 0.20; // TODO: Obtener de settings
                platformEarnings = driverTotalFares * commissionRate;
                effectiveCommissionRate = commissionRate;
                commissionBasedEarnings += platformEarnings;
            } else if (driverData.paymentModel === 'membership' && vehicleData) {
                // Reporte mensual: usar tarifa fija mensual sin prorrateo
                let monthlyFee = 0;
                switch (vehicleData.serviceType) {
                    case 'economy':
                        monthlyFee = settings.membershipFeeEconomy;
                        break;
                    case 'comfort':
                        monthlyFee = settings.membershipFeeComfort;
                        break;
                    case 'exclusive':
                        monthlyFee = settings.membershipFeeExclusive;
                        break;
                }
                
                // Usar tarifa mensual completa
                membershipFeeApplied = monthlyFee;
                platformEarnings = membershipFeeApplied;
                // Para membresías, la tasa efectiva es 0 ya que es un costo fijo, no porcentual
                effectiveCommissionRate = 0;
                membershipBasedEarnings += platformEarnings;
            }

            const averageFarePerRide = driverTotalRides > 0 ? driverTotalFares / driverTotalRides : 0;

            reportData.push({
                driverId: driverData.id,
                driverName: driverData.name,
                driverAvatarUrl: driverData.avatarUrl,
                paymentModel: driverData.paymentModel,
                totalRides: driverTotalRides,
                totalFares: driverTotalFares,
                platformEarnings,
                averageFarePerRide,
                effectiveCommissionRate,
                membershipFeeApplied,
            });

            // Acumular totales
            totalPlatformEarnings += platformEarnings;
            totalFaresGenerated += driverTotalFares;
            totalRides += driverTotalRides;

        } catch (error) {
            console.error(`Error processing driver ${driverId}:`, error);
        }
    }

    // 5. Crear resumen financiero
    const summary: FinancialSummary = {
        totalPlatformEarnings,
        totalFaresGenerated,
        totalRides,
        averageEarningsPerRide: totalRides > 0 ? totalPlatformEarnings / totalRides : 0,
        commissionBasedEarnings,
        membershipBasedEarnings,
        activeDrivers: driverIds.size,
    };

    // 6. Ordenar por ganancias de plataforma descendente
    reportData.sort((a, b) => b.platformEarnings - a.platformEarnings);

    return { reportData, summary };
}
