# 🚀 Referencia Rápida - Base de Datos HiTaxi

## 📋 Colecciones y IDs

| Colección | Descripción | ID Pattern | Índices Principales |
|-----------|-------------|------------|-------------------|
| `users` | Usuarios del sistema | Firebase UID | `email`, `role`, `isAdmin` |
| `drivers` | Perfiles de conductores | Igual a user ID | `status`, `paymentModel`, `membershipStatus` |
| `vehicles`| Información de vehículos | Auto-generado | `licensePlate` (único), `serviceType` |
| `rides` | Historial de viajes | Auto-generado | `passenger`, `driver`, `date`, `status` |
| `appSettings` | Configuración global | `main` | N/A |
| `specialFareRules` | Reglas de tarifas | Auto-generado | `startDate`, `endDate` |
| `claims` | Sistema de reclamos | Auto-generado | `rideId`, `status`, `date` |
| `sosAlerts` | Alertas de pánico | Auto-generado | `rideId`, `status`, `date` |
| `coupons` | Cupones y promociones | Auto-generado | `code`, `status`, `expiryDate` |
| `notifications` | Sistema de mensajería | Auto-generado | `target`, `date`, `status` |
| `scheduledRides` | Viajes programados | Auto-generado | `scheduledTime`, `passenger`, `status` |

## 🔗 Referencias Entre Documentos

```typescript
// Conductor → Vehículo
driver.vehicle -> vehicles/{vehicleId}

// Viaje → Usuario, Conductor y Vehículo
ride.passenger → users/{userId}
ride.driver → drivers/{driverId}
ride.vehicle -> vehicles/{vehicleId}

// Reclamo → Usuario
claim.claimant → users/{userId}

// Alerta SOS → Usuario y Conductor  
sosAlert.passenger → users/{userId}
sosAlert.driver → drivers/{driverId}

// Viaje Programado → Usuario
scheduledRide.passenger → users/{userId}
```

## 📊 Consultas Comunes

### Obtener Conductores Disponibles
```typescript
const availableDrivers = await getDocs(
  query(
    collection(db, 'drivers'),
    where('status', '==', 'available'),
    where('documentsStatus', '==', 'approved'),
  )
);
// Luego, para cada conductor, obtener los detalles de su vehículo
const vehicleRef = driver.vehicle;
const vehicleSnap = await getDoc(vehicleRef);
const vehicleData = vehicleSnap.data();
// Filtrar por serviceType si es necesario
```

### Historial de Viajes de Usuario
```typescript
const userRides = await getDocs(
  query(
    collection(db, 'rides'),
    where('passenger', '==', doc(db, 'users', userId)),
    orderBy('date', 'desc'),
    limit(20)
  )
);
```

### Configuración de la App
```typescript
const settings = await getDoc(doc(db, 'appSettings', 'main'));
const settingsData = settings.data() as Settings;
```

### Viajes Activos de Conductor
```typescript
const activeRides = await getDocs(
  query(
    collection(db, 'rides'),
    where('driver', '==', doc(db, 'drivers', driverId)),
    where('status', '==', 'in-progress')
  )
);
```

### Cupones Válidos
```typescript
const validCoupons = await getDocs(
  query(
    collection(db, 'coupons'),
    where('status', '==', 'active'),
    where('expiryDate', '>', new Date().toISOString())
  )
);
```

## ⚡ Operaciones Batch

### Completar Viaje
```typescript
const batch = writeBatch(db);

// Actualizar viaje
batch.update(doc(db, 'rides', rideId), {
  status: 'completed',
  fare: finalFare,
  fareBreakdown: breakdown
});

// Actualizar conductor (disponible)
batch.update(doc(db, 'drivers', driverId), {
  status: 'available'
});

// Incrementar contador de viajes del pasajero
batch.update(doc(db, 'users', passengerId), {
  totalRides: increment(1)
});

await batch.commit();
```

### Crear Viaje con Referencias
```typescript
// Crear referencias
const passengerRef = doc(db, 'users', passengerId);
const driverRef = doc(db, 'drivers', driverId);
const vehicleRef = doc(db, 'vehicles', vehicleId);


// Crear viaje
const rideData: Omit<Ride, 'id'> = {
  pickup: pickupAddress,
  dropoff: dropoffAddress,
  date: new Date().toISOString(),
  fare: agreedFare,
  driver: driverRef,
  passenger: passengerRef,
  vehicle: vehicleRef, // Referencia al vehículo
  status: 'in-progress',
  serviceType: 'economy',
  paymentMethod: 'cash'
};

const rideRef = await addDoc(collection(db, 'rides'), rideData);
```

## 🎯 Tipos de Enums

```typescript
// Estados y tipos principales
type ServiceType = 'economy' | 'comfort' | 'exclusive';
type PaymentMethod = 'cash' | 'yape' | 'plin';
type RideStatus = 'completed' | 'in-progress' | 'cancelled';
type DriverStatus = 'available' | 'unavailable' | 'on-ride';
type DocumentStatus = 'pending' | 'approved' | 'rejected';
type ClaimStatus = 'open' | 'in-progress' | 'resolved';
type UserRole = 'passenger' | 'driver';
type PaymentModel = 'commission' | 'membership';
type MembershipStatus = 'active' | 'pending' | 'expired';
```

## 🔧 Utilitarios de Conversión

### DocumentReference a ID
```typescript
const getUserIdFromRef = (userRef: DocumentReference): string => {
  return userRef.id;
};
```

### Crear Referencias
```typescript
const createUserRef = (userId: string): DocumentReference => {
  return doc(db, 'users', userId);
};

const createDriverRef = (driverId: string): DocumentReference => {
  return doc(db, 'drivers', driverId);
};
```

### Validar Documento Existente
```typescript
const doesDocumentExist = async (path: string, id: string): Promise<boolean> => {
  const docRef = doc(db, path, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};
```

## 📅 Datos de Fecha

### Formato de Fechas
- **Almacenamiento:** ISO 8601 strings (`2024-12-25T10:30:00Z`)
- **Consultas:** Usar `new Date().toISOString()` para comparaciones
- **Display:** Convertir con `new Date(isoString)` y formatear según necesidad

### Manejo de Zonas Horarias
```typescript
// Para crear timestamp actual
const now = new Date().toISOString();

// Para fecha específica
const specificDate = new Date('2024-12-25T10:30:00').toISOString();

// Para consultas de rango
const startOfDay = new Date().setHours(0,0,0,0);
const endOfDay = new Date().setHours(23,59,59,999);
```

## 🚨 Mejores Prácticas

### ✅ Hacer
- Usar batch writes para operaciones relacionadas
- Validar datos antes de escribir a Firestore
- Usar referencias de documento para relaciones
- Implementar manejo de errores robusto
- Paginar resultados de consultas grandes

### ❌ Evitar  
- Consultas sin límites en colecciones grandes
- Writes individuales para operaciones relacionadas
- Almacenar datos duplicados innecesariamente
- Consultas complejas en el cliente
- Referencias circulares entre documentos

## 🔍 Debugging

### Verificar Conexión
```typescript
import { connectFirestoreEmulator } from 'firebase/firestore';

// En desarrollo
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

### Logging de Consultas
```typescript
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Para debugging de performance
console.time('query');
const result = await getDocs(query);
console.timeEnd('query');
console.log(`Returned ${result.docs.length} documents`);
```

---

**Tip:** Guarda este archivo como referencia rápida durante el desarrollo. Para la documentación completa, consulta `DATABASE_SCHEMA.md`.
