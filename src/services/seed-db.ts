'use server';

import { collection, doc, writeBatch, DocumentReference, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { drivers, users, rides, claims, sosAlerts, notifications, settings, serviceTypes, coupons, specialFareRules, cancellationReasons } from '@/lib/seed-data';

const collectionsToReset = [
    'rides',
    'claims',
    'sosAlerts',
    'drivers',
    'users',
    'notifications',
    'scheduledRides',
    'coupons',
    'specialFareRules'
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
            // It's okay if a collection doesn't exist yet, just log it.
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

  // Create users and store their references in a map by email
  const userRefsByEmail = new Map<string, DocumentReference>();
  users.forEach((userData) => {
    // For idempotency, we create a predictable ID, e.g., from the email.
    // In a real app, you'd let Firestore generate a random ID.
    // For the seed script, this helps avoid duplicates on re-runs.
    const userId = userData.email.replace(/[^a-zA-Z0-9]/g, '_');
    const docRef = doc(db, 'users', userId);
    batch.set(docRef, { ...userData, id: userId });
    userRefsByEmail.set(userData.email, docRef);
  });
  console.log(`${users.length} users (passengers) prepared for batch.`);


  // Create drivers and store their references in a map by name
  const driverRefsByName = new Map<string, DocumentReference>();
  drivers.forEach((driverData) => {
    // Use license plate as a unique ID to ensure idempotency
    const docRef = doc(db, 'drivers', driverData.licensePlate);
    batch.set(docRef, driverData);
    driverRefsByName.set(driverData.name, docRef);
  });
  console.log(`${drivers.length} drivers prepared for batch.`);
  
  // Seed notifications
  notifications.forEach((notificationData, index) => {
    const docRef = doc(db, 'notifications', `notification-${index + 1}`);
    batch.set(docRef, notificationData);
  });
  console.log(`${notifications.length} notifications prepared for batch.`);
  
  // Seed coupons
  coupons.forEach((couponData) => {
    const docRef = doc(db, 'coupons', couponData.code);
    batch.set(docRef, couponData);
  });
  console.log(`${coupons.length} coupons prepared for batch.`);

  // Seed special fare rules
  specialFareRules.forEach((ruleData, index) => {
    const docRef = doc(db, 'specialFareRules', `rule-${index + 1}`);
    batch.set(docRef, ruleData);
  });
  console.log(`${specialFareRules.length} special fare rules prepared for batch.`);

  // Seed app settings
  const settingsDocRef = doc(db, 'appSettings', 'main');
  batch.set(settingsDocRef, { ...settings, serviceTypes, cancellationReasons });
  console.log('App settings prepared for batch.');


  // --- PHASE 2: Seed dependent collections using the created references ---

  // Seed rides and store their references
  const rideRefsById = new Map<string, DocumentReference>();
  rides.forEach((rideData, index) => {
    const { driverName, passengerEmail, ...rest } = rideData;
    const driverRef = driverRefsByName.get(driverName);
    const passengerRef = userRefsByEmail.get(passengerEmail);
    const rideId = `ride-${index + 1}`;

    if (driverRef && passengerRef) {
      const docRef = doc(db, 'rides', rideId);
      batch.set(docRef, {
        ...rest,
        driver: driverRef,
        passenger: passengerRef,
      });
      rideRefsById.set(rideId, docRef);
    }
  });
  console.log(`${rides.length} rides prepared for batch.`);


  // Seed claims
  claims.forEach((claimData, index) => {
    const { claimantEmail, rideId, ...rest } = claimData;
    const claimantRef = userRefsByEmail.get(claimantEmail);
    const rideRef = rideRefsById.get(rideId);


    if (claimantRef && rideRef) {
        const docRef = doc(db, 'claims', `claim-${index + 1}`);
        batch.set(docRef, { ...rest, rideId: rideRef.id, claimant: claimantRef });
    }
  });
  console.log(`${claims.length} claims prepared for batch.`);


  // Seed SOS alerts
  sosAlerts.forEach((alertData, index) => {
    const { driverName, passengerEmail, rideId, ...rest } = alertData;
    const driverRef = driverRefsByName.get(driverName);
    const passengerRef = userRefsByEmail.get(passengerEmail);
    const rideRef = rideRefsById.get(rideId);


    if (driverRef && passengerRef && rideRef) {
        const docRef = doc(db, 'sosAlerts', `sos-${index + 1}`);
        batch.set(docRef, {
            ...rest,
            driver: driverRef,
            passenger: passengerRef,
            rideId: rideRef.id,
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

    
