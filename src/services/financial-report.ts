
'use server';

import { collection, getDocs, doc, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Driver, Ride, Settings } from '@/lib/types';
import { getSettings } from './settings-service';

export interface FinancialReportRow {
    driverId: string;
    driverName: string;
    driverAvatarUrl: string;
    paymentModel: 'commission' | 'membership';
    totalRides: number;
    totalFares: number;
    platformEarnings: number;
}


export async function generateFinancialReport(startDate?: Date, endDate?: Date): Promise<FinancialReportRow[]> {
    const settings = await getSettings();

    // 1. Fetch all drivers and completed rides within the date range
    const driversCol = collection(db, 'drivers');
    
    let ridesQuery = query(collection(db, 'rides'), where('status', '==', 'completed'));
    
    if (startDate) {
        ridesQuery = query(ridesQuery, where('date', '>=', startDate.toISOString()));
    }
    if (endDate) {
        // Adjust end date to include the whole day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        ridesQuery = query(ridesQuery, where('date', '<=', endOfDay.toISOString()));
    }

    const [driverSnapshot, rideSnapshot] = await Promise.all([
        getDocs(driversCol),
        getDocs(ridesQuery)
    ]);

    const drivers = driverSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
    const completedRides = rideSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
    
    // 2. Group rides by driver
    const ridesByDriver = new Map<string, Ride[]>();
    for (const ride of completedRides) {
        // The driver is a DocumentReference, so we need its ID
        const driverId = ride.driver.id;
        if (!ridesByDriver.has(driverId)) {
            ridesByDriver.set(driverId, []);
        }
        ridesByDriver.get(driverId)!.push(ride);
    }
    
    // 3. Calculate report for each driver
    const report: FinancialReportRow[] = [];

    for (const driver of drivers) {
        const driverRides = ridesByDriver.get(driver.id) || [];
        const totalRides = driverRides.length;
        
        if (totalRides === 0) continue; // Only include drivers with rides in the period

        const totalFares = driverRides.reduce((sum, ride) => sum + ride.fare, 0);
        
        let platformEarnings = 0;
        if (driver.paymentModel === 'commission') {
            // Assume a 20% commission for this model
            platformEarnings = totalFares * 0.20;
        } else if (driver.paymentModel === 'membership') {
            // Use the monthly membership fee from settings, but consider it for the whole period for simplicity.
            // A real-world app would prorate this or check if a payment was made in the period.
            switch (driver.serviceType) {
                case 'economy':
                    platformEarnings = settings.membershipFeeEconomy;
                    break;
                case 'comfort':
                    platformEarnings = settings.membershipFeeComfort;
                    break;
                case 'exclusive':
                    platformEarnings = settings.membershipFeeExclusive;
                    break;
            }
        }

        report.push({
            driverId: driver.id,
            driverName: driver.name,
            driverAvatarUrl: driver.avatarUrl,
            paymentModel: driver.paymentModel,
            totalRides,
            totalFares,
            platformEarnings,
        });
    }

    return report.sort((a,b) => b.platformEarnings - a.platformEarnings);
}
