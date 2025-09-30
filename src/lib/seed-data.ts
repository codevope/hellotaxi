

// This file contains the initial data to seed the Firestore database.

import type { Driver, User, Ride, Claim, SOSAlert, Notification, Settings, ServiceTypeConfig, Coupon, SpecialFareRule, CancellationReason, PeakTimeRule, Location, Vehicle, VehicleModel } from '@/lib/types';

const defaultAvatar = '/img/avatar.png';


// ================================================================= //
//                      VEHICLE BRANDS & MODELS                      //
// ================================================================= //
export const vehicleModels: Omit<VehicleModel, 'id'>[] = [
    {
        name: 'Toyota',
        models: ['Yaris', 'Etios', 'Avanza', 'Corolla', 'Raize']
    },
    {
        name: 'Kia',
        models: ['Picanto', 'Soluto', 'Rio', 'Cerato', 'Seltos']
    },
    {
        name: 'Hyundai',
        models: ['Grand i10', 'Accent', 'Verna', 'Creta']
    },
    {
        name: 'Chevrolet',
        models: ['Sail', 'Onix', 'Joy', 'Tracker']
    },
     {
        name: 'Suzuki',
        models: ['Swift', 'Dzire', 'Baleno', 'Ertiga']
    },
     {
        name: 'Nissan',
        models: ['V-Drive', 'Versa', 'Sentra', 'Kicks']
    }
];


// ================================================================= //
//                            VEHICLES                               //
// ================================================================= //
export const vehicles: Omit<Vehicle, 'id' | 'driverId'>[] = [
    {
        brand: 'Toyota',
        model: 'Yaris',
        licensePlate: 'ABC-123',
        serviceType: 'economy',
        year: 2018,
        color: 'Gris',
        insuranceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        technicalReviewExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        propertyCardRegistrationDate: new Date('2018-05-10').toISOString(),
        status: 'active',
    },
    {
        brand: 'Kia',
        model: 'Sportage',
        licensePlate: 'DEF-456',
        serviceType: 'comfort',
        year: 2022,
        color: 'Negro',
        insuranceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        technicalReviewExpiry: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(), // Expires soon
        propertyCardRegistrationDate: new Date('2022-01-15').toISOString(),
        status: 'active',
    },
    {
        brand: 'Hyundai',
        model: 'Accent',
        licensePlate: 'GHI-789',
        serviceType: 'economy',
        year: 2020,
        color: 'Blanco',
        insuranceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        technicalReviewExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        propertyCardRegistrationDate: new Date('2020-03-20').toISOString(),
        status: 'in_review',
    },
    {
        brand: 'Audi',
        model: 'A4',
        licensePlate: 'JKL-012',
        serviceType: 'exclusive',
        year: 2023,
        color: 'Azul',
        insuranceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(), // Expired
        technicalReviewExpiry: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(), // Expired
        propertyCardRegistrationDate: new Date('2023-08-01').toISOString(),
        status: 'inactive',
    }
];


const driverLocations: Record<string, Omit<Location, 'id'>> = {
    "juan-perez": { lat: -12.085, lng: -77.030, address: 'Cerca a Real Plaza Salaverry' },
    "maria-rodriguez": { lat: -12.105, lng: -77.035, address: 'Cerca al Óvalo de Miraflores' },
    "carlos-gomez": { lat: -12.115, lng: -77.020, address: 'Cerca al Parque de Barranco' },
    "ana-torres": { lat: -12.090, lng: -77.050, address: 'Cerca al Golf de San Isidro' },
};

// ================================================================= //
//                            DRIVERS                                //
// ================================================================= //
export const drivers: (Omit<Driver, 'id' | 'vehicle'> & {licensePlate: string})[] = [
  {
    name: 'Juan Perez',
    avatarUrl: defaultAvatar,
    rating: 4.8,
    licensePlate: 'ABC-123', // This will be used to link the vehicle
    status: 'available',
    documentsStatus: 'approved',
    kycVerified: true,
    licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
    dniExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 8)).toISOString(),
    backgroundCheckExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString(),
    paymentModel: 'commission',
    membershipStatus: 'active',
    membershipExpiryDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
    documentStatus: {
        license: 'approved',
        insurance: 'approved',
        technicalReview: 'approved',
        backgroundCheck: 'approved',
        dni: 'approved',
        propertyCard: 'approved',
    },
    location: { id: 'loc-juan', ...driverLocations['juan-perez'] }
  },
  {
    name: 'Maria Rodriguez',
    avatarUrl: defaultAvatar,
    rating: 4.9,
    licensePlate: 'DEF-456',
    status: 'unavailable',
    documentsStatus: 'approved',
    kycVerified: true,
    licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString(),
    dniExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString(),
    backgroundCheckExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 4)).toISOString(),
    paymentModel: 'membership',
    membershipStatus: 'active',
    membershipExpiryDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
    documentStatus: {
        license: 'approved',
        insurance: 'approved',
        technicalReview: 'approved',
        backgroundCheck: 'approved',
        dni: 'approved',
        propertyCard: 'approved',
    },
    location: { id: 'loc-maria', ...driverLocations['maria-rodriguez'] }
  },
  {
    name: 'Carlos Gomez',
    avatarUrl: defaultAvatar,
    rating: 4.7,
    licensePlate: 'GHI-789',
    status: 'available',
    documentsStatus: 'pending',
    kycVerified: false,
    licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    dniExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 7)).toISOString(),
    backgroundCheckExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
    paymentModel: 'membership',
    membershipStatus: 'pending',
    membershipExpiryDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), // Expired
     documentStatus: {
        license: 'pending',
        insurance: 'pending',
        technicalReview: 'pending',
        backgroundCheck: 'pending',
        dni: 'pending',
        propertyCard: 'pending'
    },
    location: { id: 'loc-carlos', ...driverLocations['carlos-gomez'] }
  },
   {
    name: 'Ana Torres',
    avatarUrl: defaultAvatar,
    rating: 5.0,
    licensePlate: 'JKL-012',
    status: 'available',
    documentsStatus: 'rejected',
    kycVerified: false,
    licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
    dniExpiry: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(), // Expired
    backgroundCheckExpiry: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString(), // Expired
    paymentModel: 'commission',
    membershipStatus: 'expired',
    membershipExpiryDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString(), // Expired long ago
     documentStatus: {
        license: 'approved',
        insurance: 'rejected',
        technicalReview: 'rejected',
        backgroundCheck: 'rejected',
        dni: 'rejected',
        propertyCard: 'approved'
    },
    location: { id: 'loc-ana', ...driverLocations['ana-torres'] }
  },
];


// ================================================================= //
//                             USERS                                 //
// ================================================================= //
export const users: (Omit<User, 'id'>)[] = [
    {
        name: 'Lucia Fernandez',
        email: 'lucia.f@example.com',
        avatarUrl: defaultAvatar,
        role: 'passenger',
        signupDate: '2025-01-15T10:00:00Z',
        totalRides: 25,
        rating: 4.9,
        phone: '+51 999 888 777',
        address: 'Av. Larco 123, Miraflores'
    },
    {
        name: 'Miguel Castro',
        email: 'miguel.c@example.com',
        avatarUrl: defaultAvatar,
        role: 'passenger',
        signupDate: '2025-03-20T14:30:00Z',
        totalRides: 12,
        rating: 4.7,
        phone: '+51 911 222 333',
        address: 'Calle Las Begonias 456, San Isidro'
    },
     {
        name: 'Sofia Vargas',
        email: 'sofia.v@example.com',
        avatarUrl: defaultAvatar,
        role: 'passenger',
        signupDate: '2025-05-10T09:00:00Z',
        totalRides: 5,
        rating: 5.0,
        phone: '',
        address: ''
    }
];


// ================================================================= //
//                             RIDES                                 //
// ================================================================= //
export const rides: (Omit<Ride, 'id' | 'driver' | 'passenger' | 'vehicle'> & { driverName: string, passengerEmail: string })[] = [
    {
        pickup: 'Av. Pardo 560, Miraflores',
        dropoff: 'Jirón de la Unión 899, Lima',
        date: '2025-09-26T14:30:00Z',
        fare: 25.50,
        driverName: 'Maria Rodriguez',
        passengerEmail: 'lucia.f@example.com',
        status: 'completed',
        serviceType: 'comfort',
        paymentMethod: 'yape'
    },
    {
        pickup: 'Aeropuerto Jorge Chávez',
        dropoff: 'Parque Kennedy, Miraflores',
        date: '2025-09-25T18:00:00Z',
        fare: 45.00,
        driverName: 'Ana Torres',
        passengerEmail: 'miguel.c@example.com',
        status: 'completed',
        serviceType: 'exclusive',
        paymentMethod: 'yape',
        peakTime: true,
    },
    {
        pickup: 'Real Plaza Salaverry',
        dropoff: 'Estadio Nacional',
        date: '2025-09-24T20:00:00Z',
        fare: 18.00,
        driverName: 'Juan Perez',
        passengerEmail: 'lucia.f@example.com',
        status: 'completed',
        serviceType: 'economy',
        paymentMethod: 'cash',
        assignmentTimestamp: '2025-09-24T19:58:00Z',
        peakTime: true,
    },
     {
        pickup: 'Plaza de Armas de Barranco',
        dropoff: 'CC Jockey Plaza',
        date: '2025-09-23T11:00:00Z',
        fare: 30.00,
        driverName: 'Juan Perez',
        passengerEmail: 'sofia.v@example.com',
        status: 'cancelled',
        cancellationReason: { code: 'NO_SHOW', reason: 'El pasajero no se presentó' },
        cancelledBy: 'driver',
        serviceType: 'economy',
        paymentMethod: 'plin'
    },
    {
        pickup: 'Museo de la Nación',
        dropoff: 'Parque de la Amistad, Surco',
        date: '2025-09-22T15:00:00Z',
        fare: 22.00,
        driverName: 'Maria Rodriguez',
        passengerEmail: 'miguel.c@example.com',
        status: 'cancelled',
        cancellationReason: { code: 'DRIVER_LATE', reason: 'El conductor se demora mucho en llegar' },
        cancelledBy: 'passenger',
        serviceType: 'comfort',
        paymentMethod: 'plin'
    }
];

// ================================================================= //
//                             CLAIMS                                //
// ================================================================= //
export const claims: (Omit<Claim, 'id' | 'claimant'> & { rideId: string, claimantEmail: string })[] = [
    {
        rideId: 'ride-2', 
        claimantEmail: 'miguel.c@example.com',
        date: '2025-10-25T19:00:00Z',
        reason: 'Objeto Olvidado',
        details: 'Olvidé mi billetera en el asiento trasero del vehículo.',
        status: 'open',
    },
    {
        rideId: 'ride-1', 
        claimantEmail: 'lucia.f@example.com',
        date: '2025-10-26T15:00:00Z',
        reason: 'Problema con la Tarifa',
        details: 'El conductor cobró un monto diferente al acordado.',
        status: 'in-progress',
        adminResponse: 'Hemos contactado al conductor para aclarar el monto. Se procederá con el reembolso de la diferencia. Disculpe las molestias.',
    },
];

// ================================================================= //
//                           SOS ALERTS                              //
// ================================================================= //
export const sosAlerts: (Omit<SOSAlert, 'id' | 'driver' | 'passenger'> & { rideId: string, driverName: string, passengerEmail: string })[] = [
    {
        rideId: 'ride-3', 
        passengerEmail: 'lucia.f@example.com',
        driverName: 'Juan Perez',
        date: '2025-10-24T20:15:00Z',
        status: 'pending',
        triggeredBy: 'passenger',
    }
];

// ================================================================= //
//                         NOTIFICATIONS                             //
// ================================================================= //
export const notifications: Omit<Notification, 'id'>[] = [
    {
        title: '¡Promoción de Octubre!',
        message: 'Disfruta de un 20% de descuento en todos tus viajes este fin de semana.',
        date: '2025-10-20T10:00:00Z',
        target: 'all-passengers',
        status: 'sent',
    },
    {
        title: 'Actualización de App para Conductores',
        message: 'Hemos lanzado una nueva versión con mejoras de rendimiento. Por favor, actualiza tu aplicación.',
        date: '2025-10-18T15:00:00Z',
        target: 'all-drivers',
        status: 'sent',
    }
];

// ================================================================= //
//                             COUPONS                               //
// ================================================================= //
export const coupons: Omit<Coupon, 'id'>[] = [
    {
        code: 'BIENVENIDO10',
        discountType: 'percentage',
        value: 10,
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        status: 'active',
        minSpend: 20,
        usageLimit: 1,
        timesUsed: 0,
    },
    {
        code: 'TAXIFREE',
        discountType: 'fixed',
        value: 15,
        expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
        status: 'active',
        minSpend: 30,
        usageLimit: 100,
        timesUsed: 42,
    },
     {
        code: 'VERANO2023',
        discountType: 'percentage',
        value: 20,
        expiryDate: new Date('2025-03-31').toISOString(),
        status: 'expired',
        minSpend: 0,
        usageLimit: 500,
        timesUsed: 500,
    }
];


// =.================================================================ //
//                         APP CONFIGURATION                         //
// ================================================================= //
export const serviceTypes: ServiceTypeConfig[] = [
  { id: 'economy', name: 'Económico', description: 'Vehículos estándar para el día a día', multiplier: 1.0 },
  { id: 'comfort', name: 'Confort', description: 'Vehículos más nuevos y espaciosos', multiplier: 1.3 },
  { id: 'exclusive', name: 'Exclusivo', description: 'La mejor flota y los mejores conductores', multiplier: 1.8 },
];

export const specialFareRules: Omit<SpecialFareRule, 'id'>[] = [
    { name: 'Fiestas Patrias', startDate: new Date(new Date().getFullYear(), 6, 28).toISOString(), endDate: new Date(new Date().getFullYear(), 6, 29).toISOString(), surcharge: 50 },
    { name: 'Navidad', startDate: new Date(new Date().getFullYear(), 11, 24).toISOString(), endDate: new Date(new Date().getFullYear(), 11, 25).toISOString(), surcharge: 75 },
]

export const cancellationReasons: CancellationReason[] = [
    { code: 'DRIVER_LATE', reason: 'El conductor se demora mucho' },
    { code: 'DRIVER_REQUEST', reason: 'El conductor pidió que cancelara' },
    { code: 'NO_LONGER_NEEDED', reason: 'Ya no necesito el viaje' },
    { code: 'PICKUP_ISSUE', reason: 'Problema con el punto de recojo' },
    { code: 'OTHER', reason: 'Otro motivo' },
];

export const peakTimeRules: PeakTimeRule[] = [
    { id: 'peak1', name: 'Hora Punta Tarde', startTime: '16:00', endTime: '19:00', surcharge: 25 },
    { id: 'peak2', name: 'Horario Nocturno', startTime: '23:00', endTime: '05:00', surcharge: 35 },
];


// ================================================================= //
//                           SETTINGS                                //
// ================================================================= //
export const settings: Omit<Settings, 'id' | 'serviceTypes' | 'cancellationReasons' | 'specialFareRules' | 'peakTimeRules'> = {
    baseFare: 3.5,
    perKmFare: 1.0,
    perMinuteFare: 0.20,
    negotiationRange: 15, // en porcentaje
    locationUpdateInterval: 15, // en segundos
    mapCenterLat: -12.08, 
    mapCenterLng: -77.05, 
    membershipFeeEconomy: 40,
    membershipFeeComfort: 50,
    membershipFeeExclusive: 60,
};
