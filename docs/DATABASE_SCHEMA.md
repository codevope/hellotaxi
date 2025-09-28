# 🗄️ Documentación de Base de Datos - HiTaxi

## 📋 Información General

**Proyecto:** HiTaxi - Plataforma de Transporte con Negociación de Tarifas  
**Base de Datos:** Firebase Firestore  
**Proyecto ID:** hellotaxi-pe  
**Tipo:** NoSQL Document Database  
**Fecha de Documentación:** 27 de septiembre de 2025  

---

## 🏗️ Arquitectura General

La base de datos utiliza Firebase Firestore con una arquitectura de documentos distribuida en múltiples colecciones. Implementa referencias entre documentos para mantener la integridad relacional y optimizar las consultas.

### 🔄 Patrón de Diseño
- **Referencias por DocumentReference:** Para relaciones entre entidades
- **Denormalización selectiva:** Para optimizar consultas frecuentes
- **Colecciones planas:** Evitando subcollecciones profundas
- **Indexación automática:** Para consultas eficientes

---

## 📚 Esquema de Colecciones

### 1. 👥 `users` - Gestión de Usuarios

**Descripción:** Almacena información de todos los usuarios del sistema (pasajeros y conductores).

```typescript
interface User {
  id: string;                    // ID único del usuario (Firebase Auth UID)
  name: string;                  // Nombre completo
  email: string;                 // Email (único por usuario)
  avatarUrl: string;             // URL de la foto de perfil
  role: UserRole;                // 'passenger' | 'driver'
  signupDate: string;            // Fecha de registro (ISO string)
  totalRides: number;            // Contador de viajes realizados
  rating: number;                // Calificación promedio (1-5)
  phone?: string;                // Número de teléfono (opcional)
  address?: string;              // Dirección principal (opcional)
  status?: 'active' | 'blocked'; // Estado de la cuenta
  isAdmin?: boolean;             // Permisos administrativos
}
```

**Índices Requeridos:**
- `email` (único)
- `role` + `status`
- `isAdmin`

**Reglas de Seguridad:**
- Los usuarios solo pueden leer/escribir sus propios datos
- Los admins pueden leer/escribir cualquier usuario

---

### 2. 🚗 `drivers` - Perfiles de Conductores

**Descripción:** Información específica de conductores, documentos y vehículos.

```typescript
interface Driver {
  id: string;                    // ID único (coincide con user.id)
  name: string;                  // Nombre del conductor
  avatarUrl: string;             // Foto de perfil
  rating: number;                // Calificación promedio (1-5)
  vehicleBrand: string;          // Marca del vehículo
  vehicleModel: string;          // Modelo del vehículo
  licensePlate: string;          // Placa del vehículo (único)
  status: DriverStatus;          // 'available' | 'unavailable' | 'on-ride'
  documentsStatus: DocumentsStatus; // 'approved' | 'pending' | 'rejected'
  kycVerified: boolean;          // Verificación KYC completada
  licenseExpiry: string;         // Vencimiento de licencia (ISO)
  insuranceExpiry: string;       // Vencimiento de seguro (ISO)
  technicalReviewExpiry: string; // Vencimiento de revisión técnica (ISO)
  backgroundCheckExpiry: string; // Vencimiento de antecedentes (ISO)
  paymentModel: PaymentModel;    // 'commission' | 'membership'
  membershipStatus: MembershipStatus; // 'active' | 'pending' | 'expired'
  serviceType: ServiceType;      // 'economy' | 'comfort' | 'exclusive'
  documentStatus: {              // Estado individual de documentos
    license: DocumentStatus;
    insurance: DocumentStatus;
    technicalReview: DocumentStatus;
    backgroundCheck: DocumentStatus;
  }
}
```

**Índices Requeridos:**
- `licensePlate` (único)
- `status` + `serviceType`
- `documentsStatus`
- `membershipStatus`
- Compound: `status` + `serviceType` + `documentsStatus`

**Validaciones:**
- Solo un conductor por placa
- Fechas de vencimiento no pueden ser pasadas para documentos activos

---

### 3. 🛣️ `rides` - Historial de Viajes

**Descripción:** Registro completo de todos los viajes solicitados, en progreso y completados.

```typescript
interface Ride {
  id: string;                    // ID único del viaje
  pickup: string;                // Dirección de recojo
  dropoff: string;               // Dirección de destino
  date: string;                  // Fecha/hora del viaje (ISO)
  fare: number;                  // Tarifa final acordada
  driver: DocumentReference;     // Referencia al documento driver
  passenger: DocumentReference;  // Referencia al documento user
  status: RideStatus;            // 'completed' | 'in-progress' | 'cancelled'
  serviceType: ServiceType;      // Tipo de servicio solicitado
  paymentMethod: PaymentMethod;  // 'cash' | 'yape' | 'plin'
  cancellationReason?: CancellationReason; // Razón de cancelación
  cancelledBy?: 'passenger' | 'driver';    // Quién canceló
  assignmentTimestamp?: string;  // Cuando se asignó el conductor
  peakTime?: boolean;            // Si fue en hora punta
  couponCode?: string;           // Cupón aplicado
  fareBreakdown?: FareBreakdown; // Desglose detallado de la tarifa
}
```

**Índices Requeridos:**
- `passenger` + `date`
- `driver` + `date`
- `status` + `date`
- `serviceType` + `date`
- Compound: `status` + `serviceType` + `date`

**Subcolecciones:**
- `reviews` - Calificaciones del viaje
- `chatMessages` - Mensajes entre conductor y pasajero

---

### 4. ⚙️ `appSettings` - Configuración Global

**Descripción:** Configuraciones generales de la aplicación, tarifas base y reglas de negocio.

```typescript
interface Settings {
  baseFare: number;              // Tarifa base en soles
  perKmFare: number;             // Tarifa por kilómetro
  perMinuteFare: number;         // Tarifa por minuto
  negotiationRange: number;      // Rango de negociación (%)
  locationUpdateInterval: number; // Intervalo de actualización GPS (seg)
  mapCenterLat: number;          // Latitud del centro del mapa
  mapCenterLng: number;          // Longitud del centro del mapa
  membershipFeeEconomy: number;  // Cuota mensual económico
  membershipFeeComfort: number;  // Cuota mensual confort
  membershipFeeExclusive: number; // Cuota mensual exclusivo
  serviceTypes: ServiceTypeConfig[]; // Configuración de tipos de servicio
  cancellationReasons: CancellationReason[]; // Razones de cancelación
  peakTimeRules: PeakTimeRule[]; // Reglas de hora punta
}
```

**Documento Único:** `main`  
**Actualizaciones:** Solo por administradores  

---

### 5. 💰 `specialFareRules` - Reglas de Tarifas Especiales

**Descripción:** Reglas para aplicar recargos especiales en fechas específicas (feriados, eventos).

```typescript
interface SpecialFareRule {
  id: string;                    // ID único de la regla
  name: string;                  // Nombre descriptivo
  startDate: string;             // Fecha de inicio (ISO)
  endDate: string;               // Fecha de fin (ISO)
  surcharge: number;             // Recargo en porcentaje
}
```

**Ejemplo de Uso:**
```javascript
{
  id: "navidad-2024",
  name: "Recargo Navidad 2024",
  startDate: "2024-12-24T00:00:00Z",
  endDate: "2024-12-25T23:59:59Z",
  surcharge: 50 // 50% de recargo
}
```

---

### 6. 📢 `claims` - Sistema de Reclamos

**Descripción:** Gestión de reclamos y disputas entre usuarios y conductores.

```typescript
interface Claim {
  id: string;                    // ID único del reclamo
  rideId: string;                // ID del viaje relacionado
  claimant: DocumentReference;   // Usuario que hace el reclamo
  date: string;                  // Fecha del reclamo (ISO)
  reason: string;                // Categoría del reclamo
  details: string;               // Descripción detallada
  status: ClaimStatus;           // 'open' | 'in-progress' | 'resolved'
  adminResponse?: string;        // Respuesta del administrador
}
```

**Estados del Reclamo:**
- `open`: Recién creado, pendiente de revisión
- `in-progress`: En proceso de investigación
- `resolved`: Resuelto por administrador

---

### 7. 🚨 `sosAlerts` - Alertas de Pánico

**Descripción:** Sistema de alertas de emergencia durante los viajes.

```typescript
interface SOSAlert {
  id: string;                    // ID único de la alerta
  rideId: string;                // Viaje donde se activó
  passenger: DocumentReference;  // Referencia al pasajero
  driver: DocumentReference;     // Referencia al conductor
  date: string;                  // Timestamp de activación
  status: 'pending' | 'attended'; // Estado de atención
  triggeredBy: 'passenger' | 'driver'; // Quién activó la alerta
  location?: {                   // Ubicación GPS al momento de la alerta
    lat: number;
    lng: number;
  };
  notes?: string;                // Notas del operador de emergencia
}
```

**Protocolo de Emergencia:**
1. Alerta se crea automáticamente
2. Notificación inmediata a central de seguridad
3. Seguimiento GPS activado
4. Contacto con autoridades si es necesario

---

### 8. 🎟️ `coupons` - Sistema de Cupones

**Descripción:** Gestión de cupones de descuento y promociones.

```typescript
interface Coupon {
  id: string;                    // ID único del cupón
  code: string;                  // Código del cupón (único)
  discountType: 'percentage' | 'fixed'; // Tipo de descuento
  value: number;                 // Valor del descuento
  expiryDate: string;            // Fecha de vencimiento
  status: 'active' | 'expired' | 'disabled'; // Estado del cupón
  minSpend?: number;             // Gasto mínimo requerido
  usageLimit?: number;           // Límite de usos total
  timesUsed?: number;            // Veces que se ha usado
  applicableServices?: ServiceType[]; // Servicios aplicables
}
```

**Validaciones:**
- Código único por cupón
- Fecha de vencimiento futura para cupones activos
- `timesUsed` ≤ `usageLimit`

---

### 9. 📱 `notifications` - Sistema de Notificaciones

**Descripción:** Gestión de notificaciones push y mensajes del sistema.

```typescript
interface Notification {
  id: string;                    // ID único de la notificación
  title: string;                 // Título de la notificación
  message: string;               // Contenido del mensaje
  date: string;                  // Fecha de envío
  target: NotificationTarget;    // 'all-passengers' | 'all-drivers' | 'specific-user'
  status: 'sent' | 'failed';     // Estado del envío
  targetUserId?: string;         // ID del usuario específico (si aplica)
  actionUrl?: string;            // URL de acción (opcional)
  priority: 'low' | 'normal' | 'high'; // Prioridad de la notificación
}
```

---

### 10. 📅 `scheduledRides` - Viajes Programados

**Descripción:** Viajes agendados para fechas/horas futuras.

```typescript
interface ScheduledRide {
  id: string;                    // ID único del viaje programado
  pickup: string;                // Dirección de recojo
  dropoff: string;               // Dirección de destino
  scheduledTime: string;         // Fecha/hora programada (ISO)
  passenger: DocumentReference;  // Usuario que agendó
  status: 'pending' | 'confirmed' | 'cancelled'; // Estado
  serviceType: ServiceType;      // Tipo de servicio
  paymentMethod: PaymentMethod;  // Método de pago
  estimatedFare?: number;        // Tarifa estimada
  assignedDriver?: DocumentReference; // Conductor asignado
  createdAt: string;             // Fecha de creación
}
```

---

## 🔐 Reglas de Seguridad de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer/escribir sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        resource.data.isAdmin == true && 
        request.auth.uid in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Conductores pueden actualizar su perfil
    match /drivers/{driverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == driverId;
    }
    
    // Viajes pueden ser leídos por participantes
    match /rides/{rideId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.passenger.id || 
         request.auth.uid == resource.data.driver.id);
      allow create: if request.auth != null && request.auth.uid == resource.data.passenger.id;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.passenger.id || 
         request.auth.uid == resource.data.driver.id);
    }
    
    // Configuraciones solo para admins
    match /appSettings/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

---

## 📊 Datos de Seed Incluidos

### Conductores de Prueba (4)
1. **Juan Perez** - Económico, disponible, documentos aprobados
2. **Maria Rodriguez** - Confort, no disponible, documentos aprobados
3. **Carlos Gomez** - Económico, en viaje, documentos pendientes
4. **Ana Torres** - Exclusivo, disponible, documentos rechazados

### Usuarios de Prueba (3)
- Pasajeros con diferentes historiales de viajes
- Diferentes niveles de calificación
- Admins incluidos para testing

### Viajes de Ejemplo (6)
- Estados variados: completados, en progreso, cancelados
- Diferentes tipos de servicio
- Rangos de tarifas realistas

### Configuración Inicial
- Tarifas base competitivas para el mercado peruano
- Reglas de hora punta configuradas
- Tipos de servicio con multiplicadores adecuados

---

## 🚀 Comandos de Gestión

### Inicializar Base de Datos
```bash
# Ejecutar seed de datos
npm run seed-db

# O desde código
import { seedDatabase } from '@/services/seed-db';
await seedDatabase();
```

### Backup y Restore
```bash
# Exportar colección
firebase firestore:export gs://your-bucket/backup-folder

# Importar colección  
firebase firestore:import gs://your-bucket/backup-folder
```

---

## 📈 Métricas y Monitoreo

### Consultas Críticas a Monitorear
1. Búsqueda de conductores disponibles por zona
2. Historial de viajes por usuario
3. Cálculo de tarifas en tiempo real
4. Validación de cupones y promociones

### Alertas Recomendadas
- Alto número de viajes cancelados
- Conductores con documentos vencidos
- Alertas SOS no atendidas
- Errores en cálculos de tarifas

---

## 🔧 Mantenimiento

### Tareas Periódicas
- Limpieza de notificaciones antigas (>30 días)
- Actualización de estados de cupones vencidos
- Verificación de documentos de conductores próximos a vencer
- Respaldo semanal de datos críticos

### Optimizaciones Futuras
- Implementar cacheo de consultas frecuentes
- Particionado de colección `rides` por fecha
- Índices compuestos adicionales según patrones de uso
- Migración a colecciones separadas por región

---

**Última Actualización:** 27 de septiembre de 2025  
**Versión de la Base de Datos:** 1.0  
**Mantenido por:** Equipo de Desarrollo HiTaxi
