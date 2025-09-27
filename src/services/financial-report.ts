'use server';

import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
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


export async function generateFinancialReport(): Promise<FinancialReportRow[]> {
    const settings = await getSettings();

    // 1. Fetch all drivers and rides
    const driversCol = collection(db, 'drivers');
    const ridesCol = collection(db, 'rides');

    const [driverSnapshot, rideSnapshot] = await Promise.all([
        getDocs(driversCol),
        getDocs(query(ridesCol, where('status', '==', 'completed')))
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
        const totalFares = driverRides.reduce((sum, ride) => sum + ride.fare, 0);
        
        let platformEarnings = 0;
        if (driver.paymentModel === 'commission') {
            // Assume a 20% commission for this model
            platformEarnings = totalFares * 0.20;
        } else if (driver.paymentModel === 'membership') {
            // Use the membership fee from settings based on the driver's service type
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
