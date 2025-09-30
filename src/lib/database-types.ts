/**
 * @fileoverview Tipos específicos para operaciones de base de datos
 * Este archivo contiene tipos auxiliares para trabajar con Firestore
 */

import type { DocumentReference, Timestamp } from 'firebase/firestore';
import type { 
  User, 
  Driver, 
  Ride, 
  Settings, 
  Claim, 
  SOSAlert, 
  Notification, 
  Coupon, 
  ScheduledRide,
  SpecialFareRule,
  ServiceType 
} from './types';

// ================================================================
// TIPOS DE DOCUMENTOS CON REFERENCIAS
// ================================================================

/**
 * Versión de Ride con referencias de Firestore resueltas
 */
export interface RideWithRefs extends Omit<Ride, 'driver' | 'passenger'> {
  driver: Driver;
  passenger: User;
}

/**
 * Versión de Claim con referencias resueltas
 */
export interface ClaimWithRefs extends Omit<Claim, 'claimant'> {
  claimant: User;
  ride?: Ride; // Opcionalmente incluir datos del viaje
}

/**
 * Versión de SOSAlert con referencias resueltas
 */
export interface SOSAlertWithRefs extends Omit<SOSAlert, 'driver' | 'passenger'> {
  driver: Driver;
  passenger: User;
  ride?: Ride;
}

/**
 * Versión de ScheduledRide con referencias resueltas
 */
export interface ScheduledRideWithRefs extends Omit<ScheduledRide, 'passenger'> {
  passenger: User;
  assignedDriver?: Driver;
}

// ================================================================
// TIPOS PARA SEED DATA Y CREACIÓN
// ================================================================

/**
 * Datos para crear un viaje (sin ID y con nombres/emails en lugar de referencias)
 */
export interface CreateRideData extends Omit<Ride, 'id' | 'driver' | 'passenger'> {
  driverName: string;      // Buscar driver por nombre
  passengerEmail: string;  // Buscar passenger por email
}

/**
 * Datos para crear un reclamo (sin ID y con email en lugar de referencia)
 */
export interface CreateClaimData extends Omit<Claim, 'id' | 'claimant'> {
  claimantEmail: string;   // Buscar usuario por email
}

/**
 * Datos para crear alerta SOS (sin ID y con nombres/emails)
 */
export interface CreateSOSAlertData extends Omit<SOSAlert, 'id' | 'driver' | 'passenger'> {
  driverName: string;
  passengerEmail: string;
}

// ================================================================
// TIPOS DE CONSULTA Y FILTROS
// ================================================================

/**
 * Filtros para buscar conductores
 */
export interface DriverSearchFilters {
  status?: Driver['status'];
  serviceType?: ServiceType; // Filtrar por tipo de servicio
  documentsStatus?: Driver['documentsStatus'];
  paymentModel?: Driver['paymentModel'];
  membershipStatus?: Driver['membershipStatus'];
  minRating?: number;
  location?: {
    lat: number;
    lng: number;
    radius: number; // en kilómetros
  };
}

/**
 * Filtros para buscar viajes
 */
export interface RideSearchFilters {
  passengerId?: string;
  driverId?: string;
  status?: Ride['status'];
  serviceType?: Ride['serviceType'];
  paymentMethod?: Ride['paymentMethod'];
  dateFrom?: string; // ISO string
  dateTo?: string;   // ISO string
  minFare?: number;
  maxFare?: number;
}

/**
 * Filtros para reclamos
 */
export interface ClaimSearchFilters {
  status?: Claim['status'];
  dateFrom?: string;
  dateTo?: string;
  claimantId?: string;
  rideId?: string;
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  limit: number;
  startAfter?: any; // DocumentSnapshot
  orderBy: string;
  direction: 'asc' | 'desc';
}

// ================================================================
// TIPOS DE RESPUESTA DE API
// ================================================================

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  lastDocument?: any; // Para paginación
}

/**
 * Respuesta de búsqueda de conductores
 */
export interface DriversSearchResponse extends PaginatedResponse<Driver> {
  nearbyCount?: number; // Conductores cercanos dentro del radio
}

/**
 * Respuesta de historial de viajes
 */
export interface RideHistoryResponse extends PaginatedResponse<RideWithRefs> {
  totalSpent?: number;
  avgRating?: number;
  favoriteServiceType?: string;
}

/**
 * Estadísticas de usuario
 */
export interface UserStats {
  totalRides: number;
  totalSpent: number;
  avgRating: number;
  favoritePaymentMethod: Ride['paymentMethod'];
  favoriteServiceType: Ride['serviceType'];
  cancellationRate: number;
  lastRideDate?: string;
}

/**
 * Estadísticas de conductor
 */
export interface DriverStats {
  totalRides: number;
  totalEarnings: number;
  avgRating: number;
  acceptanceRate: number;
  cancellationRate: number;
  onlineHours: number;
  documentsExpiringCount: number;
  lastRideDate?: string;
}

// ================================================================
// TIPOS DE CONFIGURACIÓN Y VALIDACIÓN
// ================================================================

/**
 * Configuración de validación para documentos de conductor
 */
export interface DocumentValidationConfig {
  license: {
    required: boolean;
    maxDaysToExpiry: number;
  };
  insurance: {
    required: boolean;
    maxDaysToExpiry: number;
  };
  technicalReview: {
    required: boolean;
    maxDaysToExpiry: number;
  };
  backgroundCheck: {
    required: boolean;
    maxDaysToExpiry: number;
  };
}

/**
 * Configuración de tarifas por zona
 */
export interface ZoneFareConfig {
  zoneId: string;
  zoneName: string;
  boundaries: {
    lat: number;
    lng: number;
  }[];
  fareMultiplier: number; // Multiplicador sobre tarifa base
  minimumFare: number;
}

/**
 * Configuración de notificaciones push
 */
export interface PushNotificationConfig {
  title: string;
  body: string;
  data?: Record<string, string>;
  priority: 'normal' | 'high';
  timeToLive?: number; // seconds
}

// ================================================================
// TIPOS DE ERROR Y VALIDACIÓN
// ================================================================

/**
 * Códigos de error específicos de la aplicación
 */
export enum AppErrorCode {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  DRIVER_NOT_FOUND = 'DRIVER_NOT_FOUND',
  RIDE_NOT_FOUND = 'RIDE_NOT_FOUND',
  INVALID_FARE = 'INVALID_FARE',
  DRIVER_UNAVAILABLE = 'DRIVER_UNAVAILABLE',
  DOCUMENTS_EXPIRED = 'DOCUMENTS_EXPIRED',
  INVALID_COUPON = 'INVALID_COUPON',
  RIDE_ALREADY_COMPLETED = 'RIDE_ALREADY_COMPLETED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS'
}

/**
 * Error de aplicación con código específico
 */
export interface AppError {
  code: AppErrorCode;
  message: string;
  details?: Record<string, any>;
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ================================================================
// TIPOS DE EVENTOS Y WEBHOOKS
// ================================================================

/**
 * Tipos de eventos del sistema
 */
export enum SystemEvent {
  RIDE_CREATED = 'RIDE_CREATED',
  RIDE_STARTED = 'RIDE_STARTED',
  RIDE_COMPLETED = 'RIDE_COMPLETED',
  RIDE_CANCELLED = 'RIDE_CANCELLED',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  SOS_TRIGGERED = 'SOS_TRIGGERED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',
  USER_REGISTERED = 'USER_REGISTERED',
  DRIVER_APPROVED = 'DRIVER_APPROVED'
}

/**
 * Payload de evento del sistema
 */
export interface SystemEventPayload {
  eventType: SystemEvent;
  timestamp: string;
  entityId: string;
  entityType: 'user' | 'driver' | 'ride' | 'claim';
  data: Record<string, any>;
  triggeredBy?: string; // User ID
}

// ================================================================
// UTILIDADES DE TIPOS
// ================================================================

/**
 * Convierte un tipo con DocumentReference a uno con IDs de string
 */
export type WithStringIds<T> = {
  [K in keyof T]: T[K] extends DocumentReference ? string : T[K];
};

/**
 * Hace opcionales las propiedades especificadas
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Excluye propiedades de timestamp automático
 */
export type WithoutTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>;

/**
 * Para crear documentos nuevos (sin ID)
 */
export type CreateInput<T> = Omit<T, 'id'>;

/**
 * Para actualizar documentos (propiedades opcionales excepto ID)
 */
export type UpdateInput<T> = Partial<Omit<T, 'id'>> & { id: string };