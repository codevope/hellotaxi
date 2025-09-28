
// This file contains the initial data to seed the Firestore database.

import type { Driver, User, Ride, Claim, SOSAlert, Notification, Settings, ServiceTypeConfig, Coupon, SpecialFareRule, CancellationReason, PeakTimeRule } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const getImageUrl = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

// ================================================================= //
//                            DRIVERS                                //
// ================================================================= //
export const drivers: Omit<Driver, 'id'>[] = [
  {
    name: 'Juan Perez',
    avatarUrl: getImageUrl('driver1'),
    rating: 4.8,
    vehicleBrand: 'Toyota',
    vehicleModel: 'Yaris',
    licensePlate: 'ABC-123',
    status: 'available',
    documentsStatus: 'approved',
    kycVerified: true,
    licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
    insuranceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    technicalReviewExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    backgroundCheckExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString(),
    paymentModel: 'commission',
    membershipStatus: 'active',
    serviceType: 'economy',
    documentStatus: {
        license: 'approved',
        insurance: 'approved',
        technicalReview: 'approved',
        backgroundCheck: 'approved'
    }
  },
  {
    name: 'Maria Rodriguez',
    avatarUrl: getImageUrl('driver2'),
    rating: 4.9,
    vehicleBrand: 'Kia',
    vehicleModel: 'Sportage',
    licensePlate: 'DEF-456',
    status: 'unavailable',
    documentsStatus: 'approved',
    kycVerified: true,
    licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString(),
    insuranceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    technicalReviewExpiry: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(), // Expires soon
    backgroundCheckExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 4)).toISOString(),
    paymentModel: 'membership',
    membershipStatus: 'active',
    serviceType: 'comfort',
    documentStatus: {
        license: 'approved',
        insurance: 'approved',
        technicalReview: 'approved',
        backgroundCheck: 'approved'
    }
  },
  {
    name: 'Carlos Gomez',
    avatarUrl: getImageUrl('driver3'),
    rating: 4.7,
    vehicleBrand: 'Hyundai',
    vehicleModel: 'Accent',
    licensePlate: 'GHI-789',
    status: 'available',
    documentsStatus: 'pending',
    kycVerified: false,
    licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    insuranceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    technicalReviewExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    backgroundCheckExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
    paymentModel: 'membership',
    membershipStatus: 'pending',
    serviceType: 'economy',
     documentStatus: {
        license: 'pending',
        insurance: 'pending',
        technicalReview: 'pending',
        backgroundCheck: 'pending'
    }
  },
   {
    name: 'Ana Torres',
    avatarUrl: getImageUrl('driver4'),
    rating: 5.0,
    vehicleBrand: 'Audi',
    vehicleModel: 'A4',
    licensePlate: 'JKL-012',
    status: 'available',
    documentsStatus: 'rejected',
    kycVerified: false,
    licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
    insuranceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(), // Expired
    technicalReviewExpiry: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(), // Expired
    backgroundCheckExpiry: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString(), // Expired
    paymentModel: 'commission',
    membershipStatus: 'expired',
    serviceType: 'exclusive',
     documentStatus: {
        license: 'approved',
        insurance: 'rejected',
        technicalReview: 'rejected',
        backgroundCheck: 'rejected'
    }
  },
];


// ================================================================= //
//                             USERS                                 //
// ================================================================= //
export const users: (Omit<User, 'id'>)[] = [
    {
        name: 'Lucia Fernandez',
        email: 'lucia.f@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        role: 'passenger',
        signupDate: '2023-01-15T10:00:00Z',
        totalRides: 25,
        rating: 4.9,
        phone: '+51 999 888 777',
        address: 'Av. Larco 123, Miraflores'
    },
    {
        name: 'Miguel Castro',
        email: 'miguel.c@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
        role: 'passenger',
        signupDate: '2023-03-20T14:30:00Z',
        totalRides: 12,
        rating: 4.7,
        phone: '+51 911 222 333',
        address: 'Calle Las Begonias 456, San Isidro'
    },
     {
        name: 'Sofia Vargas',
        email: 'sofia.v@example.com',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
        role: 'passenger',
        signupDate: '2023-05-10T09:00:00Z',
        totalRides: 5,
        rating: 5.0,
        phone: '',
        address: ''
    },
    {
        name: 'Viktor Olivares',
        email: 'viktorolivares@gmail.com',
        avatarUrl: '', // Can be empty, will be filled by Google Sign-In
        role: 'passenger',
        signupDate: new Date().toISOString(),
        totalRides: 0,
        rating: 5.0,
        phone: '',
        address: '',
        isAdmin: true,
    }
];


// ================================================================= //
//                             RIDES                                 //
// ================================================================= //
export const rides: (Omit<Ride, 'id' | 'driver' | 'passenger'> & { driverName: string, passengerEmail: string })[] = [
    {
        pickup: 'Av. Pardo 560, Miraflores',
        dropoff: 'Jirón de la Unión 899, Lima',
        date: '2023-10-26T14:30:00Z',
        fare: 25.50,
        driverName: 'Maria Rodriguez',
        passengerEmail: 'lucia.f@example.com',
        status: 'completed',
        serviceType: 'comfort',
        paymentMethod: 'card'
    },
    {
        pickup: 'Aeropuerto Jorge Chávez',
        dropoff: 'Parque Kennedy, Miraflores',
        date: '2023-10-25T18:00:00Z',
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
        date: '2023-10-24T20:00:00Z',
        fare: 18.00,
        driverName: 'Juan Perez',
        passengerEmail: 'lucia.f@example.com',
        status: 'completed',
        serviceType: 'economy',
        paymentMethod: 'cash',
        assignmentTimestamp: '2023-10-24T19:58:00Z',
        peakTime: true,
    },
     {
        pickup: 'Plaza de Armas de Barranco',
        dropoff: 'CC Jockey Plaza',
        date: '2023-10-23T11:00:00Z',
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
        date: '2023-10-22T15:00:00Z',
        fare: 22.00,
        driverName: 'Maria Rodriguez',
        passengerEmail: 'miguel.c@example.com',
        status: 'cancelled',
        cancellationReason: { code: 'DRIVER_LATE', reason: 'El conductor se demora mucho en llegar' },
        cancelledBy: 'passenger',
        serviceType: 'comfort',
        paymentMethod: 'card'
    }
];

// ================================================================= //
//                             CLAIMS                                //
// ================================================================= //
export const claims: (Omit<Claim, 'id' | 'claimant'> & { rideId: string, claimantEmail: string })[] = [
    {
        rideId: 'ride-2', 
        claimantEmail: 'miguel.c@example.com',
        date: '2023-10-25T19:00:00Z',
        reason: 'Objeto Olvidado',
        details: 'Olvidé mi billetera en el asiento trasero del vehículo.',
        status: 'open',
    },
    {
        rideId: 'ride-1', 
        claimantEmail: 'lucia.f@example.com',
        date: '2023-10-26T15:00:00Z',
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
        date: '2023-10-24T20:15:00Z',
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
        date: '2023-10-20T10:00:00Z',
        target: 'all-passengers',
        status: 'sent',
    },
    {
        title: 'Actualización de App para Conductores',
        message: 'Hemos lanzado una nueva versión con mejoras de rendimiento. Por favor, actualiza tu aplicación.',
        date: '2023-10-18T15:00:00Z',
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
        expiryDate: new Date('2023-03-31').toISOString(),
        status: 'expired',
        minSpend: 0,
        usageLimit: 500,
        timesUsed: 500,
    }
];


// =.================================================================ //
//                         SERVICE TYPES                             //
// ================================================================= //
export const serviceTypes: ServiceTypeConfig[] = [
  { id: 'economy', name: 'Económico', description: 'Vehículos estándar para el día a día', multiplier: 1 },
  { id: 'comfort', name: 'Confort', description: 'Vehículos más nuevos y espaciosos', multiplier: 1.5 },
  { id: 'exclusive', name: 'Exclusivo', description: 'La mejor flota y los mejores conductores', multiplier: 2 },
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
export const settings: Omit<Settings, 'serviceTypes' | 'cancellationReasons' | 'specialFareRules' | 'peakTimeRules'> = {
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
};
