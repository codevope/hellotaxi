import type { ServiceType, ServiceTypeConfig } from '@/lib/types';

// This file now only contains the static configuration of the service types.
// The example data has been moved to seed-data.ts and is loaded from there.

export const serviceTypes: ServiceTypeConfig[] = [
  { id: 'economy', name: 'Económico', description: 'Vehículos estándar para el día a día', multiplier: 1.0 },
  { id: 'comfort', name: 'Confort', description: 'Vehículos más nuevos y espaciosos', multiplier: 1.3 },
  { id: 'exclusive', name: 'Exclusivo', description: 'La mejor flota y los mejores conductores', multiplier: 1.8 },
];
