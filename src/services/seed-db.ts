
'use server';

import { collection, doc, writeBatch, DocumentReference, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { drivers, users, rides, claims, sosAlerts, notifications, settings, serviceTypes, coupons, specialFareRules, cancellationReasons, peakTimeRules, vehicles, vehicleModels } from '@/lib/seed-data';

const collectionsToReset = [
    'rides',
    'claims',
    'sosAlerts',
    'drivers',
    'users',
    'notifications',
    'scheduledRides',
    'coupons',
    'specialFareRules',
    'vehicles',
    'vehicleModels',
];


/**
 * Deletes all documents from the specified collections.
 */
async function clearCollections() {
    console.log('Clearing transactional collections...');

    for (const collectionName of collectionsToReset) {
        const collectionRef = collection(db, collectionName);
        try {
            const querySnapshot = await getDocs(collectionRef);
            if (querySnapshot.empty) {
                continue;
            }
            // Cannot use batch for more than 500 operations. Delete one by one.
            for (const doc of querySnapshot.docs) {
                await deleteDoc(doc.ref);
            }
             console.log(`Deleted ${querySnapshot.docs.length} documents from ${collectionName}.`);
        } catch (error) {
            console.warn(`Could not query or delete from collection ${collectionName}. It might not exist or be protected by rules. Skipping.`);
        }
    }
    
    console.log('Transactional collections cleared.');
}

/**
 * Seeds the Firestore database with initial data.
 * This function is idempotent, meaning it can be run multiple times without creating duplicate data.
 * It uses a write batch to perform all writes as a single atomic operation.
 */
export async function seedDatabase() {
  const batch = writeBatch(db);
  console.log('Starting to seed database...');

  // --- PHASE 1: Seed independent collections and get their references ---
  const userRefsByEmail = new Map<string, DocumentReference>();
  for (const userData of users) {
    const userRef = doc(collection(db, 'users'));
    batch.set(userRef, { ...userData, id: userRef.id });
    userRefsByEmail.set(userData.email, userRef);
  }
  console.log(`${users.length} users prepared for batch.`);
  
  const vehicleRefsByPlate = new Map<string, DocumentReference>();
  for (const vehicleData of vehicles) {
      const vehicleRef = doc(collection(db, 'vehicles'));
      batch.set(vehicleRef, { ...vehicleData, id: vehicleRef.id, driverId: '' }); // driverId will be updated later
      vehicleRefsByPlate.set(vehicleData.licensePlate, vehicleRef);
  }
  console.log(`${vehicles.length} vehicles prepared for batch.`);

  const driverRefsByName = new Map<string, DocumentReference>();
  for (const driverData of drivers) {
    const driverRef = doc(collection(db, 'drivers'));
    const vehicleRef = vehicleRefsByPlate.get(driverData.licensePlate);
    if (!vehicleRef) {
        console.error(`Vehicle with plate ${driverData.licensePlate} not found for driver ${driverData.name}`);
        continue;
    }
    const { licensePlate, ...driverWithoutPlate } = driverData;
    const driverDataWithId = { ...driverWithoutPlate, id: driverRef.id, vehicle: vehicleRef };
    batch.set(driverRef, driverDataWithId);
    driverRefsByName.set(driverData.name, driverRef);

    // Update the vehicle with its assigned driver's ID
    batch.update(vehicleRef, { driverId: driverRef.id });
  }
  console.log(`${drivers.length} drivers prepared for batch.`);
  
  for (const notificationData of notifications) {
    const notificationRef = doc(collection(db, 'notifications'));
    batch.set(notificationRef, { ...notificationData, id: notificationRef.id });
  }
  console.log(`${notifications.length} notifications prepared for batch.`);
  
  for (const couponData of coupons) {
    const couponRef = doc(collection(db, 'coupons'));
    batch.set(couponRef, { ...couponData, id: couponRef.id });
  }
  console.log(`${coupons.length} coupons prepared for batch.`);

  for (const ruleData of specialFareRules) {
    const ruleRef = doc(collection(db, 'specialFareRules'));
    batch.set(ruleRef, { ...ruleData, id: ruleRef.id });
  }
  console.log(`${specialFareRules.length} special fare rules prepared for batch.`);

  for (const modelData of vehicleModels) {
    const modelRef = doc(collection(db, 'vehicleModels'));
    batch.set(modelRef, { ...modelData, id: modelRef.id });
  }
  console.log(`${vehicleModels.length} vehicle models prepared for batch.`);

  const settingsDocRef = doc(db, 'appSettings', 'main');
  batch.set(settingsDocRef, { id: 'main', ...settings, serviceTypes, cancellationReasons, specialFareRules, peakTimeRules });
  console.log('App settings prepared for batch.');


  // --- PHASE 2: Seed dependent collections using the created references ---
  for (const rideData of rides) {
    const { driverName, passengerEmail, ...rest } = rideData;
    const driverRef = driverRefsByName.get(driverName);
    const passengerRef = userRefsByEmail.get(passengerEmail);
    const driver = drivers.find(d => d.name === driverName);
    const vehicleRef = driver ? vehicleRefsByPlate.get(driver.licensePlate) : null;
    
    if (driverRef && passengerRef && vehicleRef) {
      const rideRef = doc(collection(db, 'rides'));
      batch.set(rideRef, {
        ...rest,
        id: rideRef.id,
        driver: driverRef,
        passenger: passengerRef,
        vehicle: vehicleRef
      });
    }
  }
  console.log(`${rides.length} rides prepared for batch.`);

  for (const claimData of claims) {
    const { claimantEmail, ...rest } = claimData;
    const claimantRef = userRefsByEmail.get(claimantEmail);

    if (claimantRef) {
        const claimRef = doc(collection(db, 'claims'));
        batch.set(claimRef, { ...rest, id: claimRef.id, claimant: claimantRef });
    }
  }
  console.log(`${claims.length} claims prepared for batch.`);
  
  for (const alertData of sosAlerts) {
    const { driverName, passengerEmail, ...rest } = alertData;
    const driverRef = driverRefsByName.get(driverName);
    const passengerRef = userRefsByEmail.get(passengerEmail);

    if (driverRef && passengerRef) {
        const alertRef = doc(collection(db, 'sosAlerts'));
        batch.set(alertRef, {
            ...rest,
            id: alertRef.id,
            driver: driverRef,
            passenger: passengerRef,
        });
    }
  }
  console.log(`${sosAlerts.length} SOS alerts prepared for batch.`);


  // Commit the batch
  await batch.commit();
  console.log('Database seeded successfully!');
}


/**
 * Clears transactional collections and then seeds the database with fresh data.
 * Keeps the 'appSettings' collection intact.
 */
export async function resetAndSeedDatabase() {
    await clearCollections();
    await seedDatabase();
}
