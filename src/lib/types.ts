

import type { DocumentReference } from 'firebase/firestore';

export type ServiceType = 'economy' | 'comfort' | 'exclusive';
export type PaymentModel = 'commission' | 'membership';
export type MembershipStatus = 'active' | 'pending' | 'expired';
export type PaymentMethod = 'cash' | 'yape' | 'plin';
export type UserRole = 'passenger' | 'driver';

export type DocumentName = 'license' | 'insurance' | 'technicalReview' | 'backgroundCheck' | 'dni' | 'propertyCard';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface Location {
  id?: string; // Hacer opcional para mayor flexibilidad
  lat: number;
  lng: number;
  address?: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  serviceType: ServiceType;
  year: number;
  color: string;
  driverId: string;
  insuranceExpiry: string; // ISO Date string
  technicalReviewExpiry: string; // ISO Date string
  propertyCardRegistrationDate?: string; // ISO Date string
  status: 'active' | 'inactive' | 'in_review';
}

export interface VehicleModel {
    id: string;
    name: string;
    models: string[];
}

export interface Driver {
  id: string;
  name: string;
  avatarUrl: string;
  rating: number;
  status: 'available' | 'unavailable' | 'on-ride';
  documentsStatus: 'approved' | 'pending' | 'rejected';
  kycVerified: boolean;
  licenseExpiry: string; // ISO Date string
  backgroundCheckExpiry: string; // ISO Date string
  dniExpiry: string; // ISO Date string
  paymentModel: PaymentModel;
  membershipStatus: MembershipStatus;
  membershipExpiryDate?: string; // ISO Date string
  documentStatus?: Record<DocumentName, DocumentStatus>;
  totalRides?: number;
  location?: Location;
  vehicle: DocumentReference;
}

// EnrichedDriver has the full vehicle object instead of just a reference
export interface EnrichedDriver extends Omit<Driver, 'vehicle'> {
  vehicle: Vehicle;
}

// DriverWithVehicleInfo extends Driver with vehicle information for UI display
export interface DriverWithVehicleInfo extends Driver {
  vehicleBrand: string;
  vehicleModel: string;
  licensePlate: string;
  vehicleColor?: string;
  vehicleYear?: number;
}

export interface User {
  id: string;
  name:string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  signupDate: string; // ISO Date string
  totalRides: number;
  rating: number; // Passenger rating
  phone?: string;
  address?: string;
  status?: 'active' | 'blocked' | 'incomplete';
  isAdmin?: boolean;
}

export type FareBreakdown = {
  baseFare: number;
  distanceCost: number;
  durationCost: number;
  serviceMultiplier: number;
  serviceCost: number;
  peakSurcharge: number;
  specialDaySurcharge: number;
  couponDiscount: number;
  subtotal: number;
  total: number;
};

export type CancellationReason = {
    code: string;
    reason: string;
};

export type RideStatus = 'searching' | 'accepted' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'counter-offered';

export interface Ride {
  id: string;
  pickup: string;
  dropoff: string;
  pickupLocation?: Location; // Coordenadas del punto de recojo
  dropoffLocation?: Location; // Coordenadas del punto de destino
  date: string;
  fare: number;
  driver: DocumentReference | null;
  passenger: DocumentReference;
  vehicle: DocumentReference | null;
  status: RideStatus;
  serviceType: ServiceType;
  paymentMethod: PaymentMethod;
  cancellationReason?: CancellationReason;
  cancelledBy?: 'passenger' | 'driver' | 'system';
  assignmentTimestamp?: string; // ISO Date string
  peakTime?: boolean;
  couponCode?: string;
  fareBreakdown?: FareBreakdown;
  rejectedBy?: DocumentReference[];
  isRatedByPassenger?: boolean;
  offeredTo?: DocumentReference | null;
}

export interface Review {
    id: string;
    rating: number;
    comment: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    createdAt: string; // ISO Date string;
}


export interface ScheduledRide {
    id: string;
    pickup: string;
    dropoff: string;
    scheduledTime: string; // ISO Date string
    passenger: DocumentReference;
    status: 'pending' | 'confirmed' | 'cancelled';
    serviceType: ServiceType;
    paymentMethod: PaymentMethod;
    createdAt: string;
}

export interface ChatMessage {
  id?: string;
  userId: string;
  text: string;
  timestamp: string; // ISO Date string
}


export interface Claim {
  id: string;
  rideId: string;
  claimant: DocumentReference;
  date: string; // ISO Date string
  reason: string;
  details: string;
  status: 'open' | 'in-progress' | 'resolved';
  adminResponse?: string;
}

export interface SOSAlert {
  id: string;
  rideId: string;
  passenger: DocumentReference;
  driver: DocumentReference;
  date: string; // ISO Date string
  status: 'pending' | 'attended';
  triggeredBy: 'passenger' | 'driver';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string; // ISO Date string
  target: 'all-passengers' | 'all-drivers' | 'specific-user';
  status: 'sent' | 'failed';
}

export interface Coupon {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    value: number;
    expiryDate: string; // ISO Date string
    status: 'active' | 'expired' | 'disabled';
    minSpend?: number;
    usageLimit?: number;
    timesUsed?: number;
}


export type ServiceTypeConfig = {
    id: ServiceType,
    name: string;
    description: string,
    multiplier: number
}

export interface SpecialFareRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  surcharge: number; // Percentage
}

export interface PeakTimeRule {
  id: string;
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  surcharge: number; // Percentage
}

export interface Settings {
    id: string;
    baseFare: number;
    perKmFare: number;
    perMinuteFare: number;
    negotiationRange: number;
    locationUpdateInterval: number;
    mapCenterLat: number;
    mapCenterLng: number;
    membershipFeeEconomy: number;
    membershipFeeComfort: number;
    membershipFeeExclusive: number;
    serviceTypes: ServiceTypeConfig[];
    cancellationReasons: CancellationReason[];
    specialFareRules: SpecialFareRule[];
    peakTimeRules: PeakTimeRule[];
}

export type Passenger = User;

// This represents the raw user object from Firebase Auth
export interface FirebaseUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
    providerData: any[];
    metadata: {
        creationTime?: string;
        lastSignInTime?: string;
    }
}
    
