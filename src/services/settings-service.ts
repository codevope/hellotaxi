import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Settings, SpecialFareRule, PeakTimeRule, CancellationReason, ServiceTypeConfig } from '@/lib/types';
import { cache } from 'react';

// Default service types as a fallback
export const defaultServiceTypes: ServiceTypeConfig[] = [
  { id: 'economy', name: 'Económico', description: 'Vehículos estándar para el día a día', multiplier: 1.0 },
  { id: 'comfort', name: 'Confort', description: 'Vehículos más nuevos y espaciosos', multiplier: 1.3 },
  { id: 'exclusive', name: 'Exclusivo', description: 'La mejor flota y los mejores conductores', multiplier: 1.8 },
];

// Default peak time rules as a fallback
const defaultPeakTimeRules: PeakTimeRule[] = [
    { id: 'peak1', name: 'Hora Punta Tarde', startTime: '16:00', endTime: '19:00', surcharge: 25 },
    { id: 'peak2', name: 'Horario Nocturno', startTime: '23:00', endTime: '05:00', surcharge: 35 },
];

const defaultCancellationReasons: CancellationReason[] = [
    { code: 'DRIVER_LATE', reason: 'El conductor se demora mucho' },
    { code: 'DRIVER_REQUEST', reason: 'El conductor pidió que cancelara' },
    { code: 'NO_LONGER_NEEDED', reason: 'Ya no necesito el viaje' },
    { code: 'PICKUP_ISSUE', reason: 'Problema con el punto de recojo' },
    { code: 'OTHER', reason: 'Otro motivo' },
];

// Default settings, in case the document doesn't exist in Firestore
const defaultSettings: Omit<Settings, 'specialFareRules'> = {
    id: 'main',
    baseFare: 3.5,
    perKmFare: 1.0,
    perMinuteFare: 0.20,
    negotiationRange: 15, // en porcentaje
    locationUpdateInterval: 15, // en segundos
    mapCenterLat: -6.7713, // Chiclayo, Perú
    mapCenterLng: -79.8442, // Chiclayo, Perú
    membershipFeeEconomy: 40,
    membershipFeeComfort: 50,
    membershipFeeExclusive: 60,
    serviceTypes: defaultServiceTypes,
    cancellationReasons: defaultCancellationReasons,
    peakTimeRules: defaultPeakTimeRules,
};

/**
 * Fetches application settings from Firestore.
 * Caches the result to avoid multiple fetches within the same request.
 * If no settings are found in Firestore, returns default settings.
 */
export const getSettings = cache(async (): Promise<Settings> => {
  try {
    const settingsDocRef = doc(db, 'appSettings', 'main');
    const specialFaresColRef = collection(db, 'specialFareRules');

    const [settingsSnap, specialFaresSnap] = await Promise.all([
        getDoc(settingsDocRef),
        getDocs(specialFaresColRef),
    ]);

    const specialFareRules = specialFaresSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpecialFareRule));
    
    if (settingsSnap.exists()) {
      const dbSettings = settingsSnap.data();
      // Combine with defaults to ensure all keys are present
      return { 
          ...defaultSettings, 
          ...dbSettings, 
          // Ensure nested arrays from DB override default if they exist
          serviceTypes: dbSettings.serviceTypes || defaultSettings.serviceTypes,
          peakTimeRules: dbSettings.peakTimeRules || defaultSettings.peakTimeRules,
          cancellationReasons: dbSettings.cancellationReasons || defaultSettings.cancellationReasons,
          specialFareRules 
        } as Settings;
    } else {
      console.warn("Settings document not found in Firestore, using default settings.");
      return { ...defaultSettings, specialFareRules };
    }
  } catch (error) {
    console.error("Error fetching settings from Firestore:", error);
    // Return default settings as a fallback in case of an error
    return { ...defaultSettings, specialFareRules: [] };
  }
});
