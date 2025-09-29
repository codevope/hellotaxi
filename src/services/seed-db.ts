
'use server';

import { collection, doc, writeBatch, DocumentReference, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { drivers, users, rides, claims, sosAlerts, notifications, settings, serviceTypes, coupons, specialFareRules, cancellationReasons, peakTimeRules, vehicles } from '@/lib/seed-data';

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
    'vehicles', // Add new collection to reset
];


/**
 * Deletes all documents from the specified collections.
 */
async function clearCollections() {
    console.log('Clearing transactional collections...');
    const batch = writeBatch(db);

    for (const collectionName of collectionsToReset) {
        const collectionRef = collection(db, collectionName);
        try {
            const querySnapshot = await getDocs(collectionRef);
            console.log(`Found ${querySnapshot.docs.length} documents in ${collectionName} to delete.`);
            querySnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
        } catch (error) {
            if (error instanceof Error && 'code' in error && (error as {code: string}).code === 'permission-denied') {
                console.warn(`Could not query collection ${collectionName} due to permissions. Skipping.`);
            } else {
                 console.warn(`Could not query collection ${collectionName}. It might not exist. Skipping.`);
            }
        }
    }
    
    await batch.commit();
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
  users.forEach((userData) => {
    const userId = userData.email.replace(/[^a-zA-Z0-9]/g, '_');
    const docRef = doc(db, 'users', userId);
    batch.set(docRef, { ...userData, id: userId });
    userRefsByEmail.set(userData.email, docRef);
  });
  console.log(`${users.length} users prepared for batch.`);
  
  // Seed Vehicles and store references by license plate
  const vehicleRefsByPlate = new Map<string, DocumentReference>();
  vehicles.forEach((vehicleData) => {
      const vehicleId = vehicleData.licensePlate;
      const docRef = doc(db, 'vehicles', vehicleId);
      const vehicleWithId = { ...vehicleData, id: vehicleId, driverId: '' }; // driverId will be updated later
      batch.set(docRef, vehicleWithId);
      vehicleRefsByPlate.set(vehicleId, docRef);
  });
  console.log(`${vehicles.length} vehicles prepared for batch.`);

  const driverRefsByName = new Map<string, DocumentReference>();
  drivers.forEach((driverData) => {
    const driverId = driverData.name.toLowerCase().replace(' ', '-');
    const docRef = doc(db, 'drivers', driverId);
    const vehicleRef = vehicleRefsByPlate.get(driverData.licensePlate);
    if (!vehicleRef) {
        console.error(`Vehicle with plate ${driverData.licensePlate} not found for driver ${driverData.name}`);
        return;
    }
    const { licensePlate, ...driverWithoutPlate } = driverData;
    batch.set(docRef, { ...driverWithoutPlate, id: driverId, vehicle: vehicleRef });
    driverRefsByName.set(driverData.name, docRef);

    // Also update driverId in the vehicle document
    batch.update(vehicleRef, { driverId: driverId });
  });
  console.log(`${drivers.length} drivers prepared for batch.`);
  
  notifications.forEach((notificationData, index) => {
    const id = `notification-${index + 1}`;
    const docRef = doc(db, 'notifications', id);
    batch.set(docRef, { ...notificationData, id });
  });
  console.log(`${notifications.length} notifications prepared for batch.`);
  
  coupons.forEach((couponData) => {
    const docRef = doc(db, 'coupons', couponData.code);
    batch.set(docRef, { ...couponData, id: couponData.code });
  });
  console.log(`${coupons.length} coupons prepared for batch.`);

  specialFareRules.forEach((ruleData, index) => {
    const id = `rule-${index + 1}`;
    const docRef = doc(db, 'specialFareRules', id);
    batch.set(docRef, { ...ruleData, id });
  });
  console.log(`${specialFareRules.length} special fare rules prepared for batch.`);

  const settingsDocRef = doc(db, 'appSettings', 'main');
  batch.set(settingsDocRef, { id: 'main', ...settings, serviceTypes, cancellationReasons, specialFareRules, peakTimeRules });
  console.log('App settings prepared for batch.');


  // --- PHASE 2: Seed dependent collections using the created references ---
  const rideRefsById = new Map<string, DocumentReference>();
  rides.forEach((rideData, index) => {
    const { driverName, passengerEmail, ...rest } = rideData;
    const driverRef = driverRefsByName.get(driverName);
    const passengerRef = userRefsByEmail.get(passengerEmail);
    const driver = drivers.find(d => d.name === driverName);
    const vehicleRef = driver ? vehicleRefsByPlate.get(driver.licensePlate) : null;
    const rideId = `ride-${index + 1}`;

    if (driverRef && passengerRef && vehicleRef) {
      const docRef = doc(db, 'rides', rideId);
      batch.set(docRef, {
        ...rest,
        id: rideId,
        driver: driverRef,
        passenger: passengerRef,
        vehicle: vehicleRef
      });
      rideRefsById.set(rideId, docRef);
    }
  });
  console.log(`${rides.length} rides prepared for batch.`);

  claims.forEach((claimData, index) => {
    const { claimantEmail, rideId, ...rest } = claimData;
    const claimantRef = userRefsByEmail.get(claimantEmail);
    const claimId = `claim-${index + 1}`;

    if (claimantRef) {
        const docRef = doc(db, 'claims', claimId);
        batch.set(docRef, { ...rest, id: claimId, rideId: rideId, claimant: claimantRef });
    }
  });
  console.log(`${claims.length} claims prepared for batch.`);

  sosAlerts.forEach((alertData, index) => {
    const { driverName, passengerEmail, rideId, ...rest } = alertData;
    const driverRef = driverRefsByName.get(driverName);
    const passengerRef = userRefsByEmail.get(passengerEmail);
    const sosId = `sos-${index + 1}`;

    if (driverRef && passengerRef) {
        const docRef = doc(db, 'sosAlerts', sosId);
        batch.set(docRef, {
            ...rest,
            id: sosId,
            driver: driverRef,
            passenger: passengerRef,
            rideId: rideId,
        });
    }
  });
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
