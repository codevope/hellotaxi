# Componentes Reutilizables - HelloTaxi

Este documento describe los componentes pequeños y reutilizables creados para mantener consistencia en el diseño y mejorar la mantenibilidad del código.

## 🎯 Componentes Disponibles

### 1. **RideStatusBadge**

Badge que muestra el estado de un viaje con colores y etiquetas específicas.

**Ubicación:** `src/components/ride-status-badge.tsx`

**Props:**
- `status` (string): Estado del viaje (pending, accepted, arrived, in-progress, completed, cancelled)

**Ejemplo de uso:**
```tsx
import { RideStatusBadge } from '@/components/ride-status-badge';

<RideStatusBadge status="in-progress" />
```

**Estados soportados:**
- `pending` → "Buscando conductor" (amarillo)
- `accepted` → "Conductor aceptado" (azul)
- `arrived` → "Conductor en origen" (verde)
- `in-progress` → "En camino" (púrpura)
- `completed` → "Completado" (esmeralda)
- `cancelled` → "Cancelado" (rojo)

---

### 2. **DriverRating**

Componente para mostrar la calificación de un conductor con estrella y número.

**Ubicación:** `src/components/driver-rating.tsx`

**Props:**
- `rating` (number): Calificación del conductor (0-5)
- `totalRides?` (number): Número total de viajes (opcional)
- `size?` ("sm" | "md" | "lg"): Tamaño del componente (default: "md")
- `showLabel?` (boolean): Mostrar etiqueta con número de viajes (default: true)

**Ejemplo de uso:**
```tsx
import { DriverRating } from '@/components/driver-rating';

// Con label
<DriverRating rating={4.8} totalRides={245} size="md" />

// Sin label (solo estrella y número)
<DriverRating rating={4.8} size="sm" showLabel={false} />
```

**Colores por calificación:**
- ≥ 4.5 → Amarillo brillante (excelente)
- ≥ 4.0 → Amarillo suave (muy bueno)
- ≥ 3.5 → Naranja suave (bueno)
- < 3.5 → Naranja (regular)

---

### 3. **PriceDisplay**

Componente para mostrar precios con formato consistente y múltiples variantes visuales.

**Ubicación:** `src/components/price-display.tsx`

**Props:**
- `amount` (number): Monto a mostrar
- `label?` (string): Etiqueta descriptiva (opcional)
- `size?` ("sm" | "md" | "lg" | "xl"): Tamaño del texto (default: "md")
- `variant?` ("default" | "gradient" | "highlight" | "muted"): Estilo visual (default: "default")
- `showCurrency?` (boolean): Mostrar símbolo de moneda (default: true)

**Ejemplo de uso:**
```tsx
import { PriceDisplay } from '@/components/price-display';

// Precio con label
<PriceDisplay 
  amount={25.50} 
  label="Tarifa Estimada"
  size="lg"
  variant="highlight"
/>

// Precio grande con gradiente
<PriceDisplay 
  amount={30.00} 
  size="xl"
  variant="gradient"
/>

// Precio pequeño sin moneda
<PriceDisplay 
  amount={15.00} 
  size="sm"
  showCurrency={false}
/>
```

**Variantes:**
- `default`: Texto negro estándar
- `gradient`: Gradiente con colores del logo (#2E4CA6 → #0477BF)
- `highlight`: Color azul del logo (#0477BF)
- `muted`: Texto gris suave

---

## 🎨 Sistema de Diseño

Todos los componentes siguen la paleta de colores del logo de HelloTaxi:

- **Azul Oscuro:** `#2E4CA6`
- **Azul Medio:** `#0477BF`
- **Azul Claro:** `#049DD9`
- **Azul Brillante:** `#05C7F2`
- **Gris Claro:** `#F2F2F2`

---

## 📦 Componentes que Usan estos Elementos

### En `ride/` (Pasajero):
- **SearchingRideStatus:** Usa `PriceDisplay` para tarifa estimada
- **AssignedDriverCard:** Usa `DriverRating` y `PriceDisplay` para info del conductor
- **CounterOfferCard:** Usa `PriceDisplay` para mostrar contraoferta

### En `driver/` (Conductor):
- Por implementar próximamente

---

## 🚀 Beneficios

✅ **Consistencia:** Todos los precios, ratings y estados se ven iguales en toda la app  
✅ **Mantenibilidad:** Un solo lugar para cambiar el formato  
✅ **Reutilización:** Reduce duplicación de código  
✅ **Tipado:** TypeScript garantiza uso correcto  
✅ **Accesibilidad:** Colores y tamaños accesibles  

---

## 📝 Próximos Componentes Sugeridos

- `LocationPin` - Indicador de origen/destino
- `VehicleInfo` - Info del vehículo (placa, marca, modelo)
- `TripTimeline` - Línea de tiempo visual del viaje
- `CancelButton` - Botón de cancelación con confirmación
- `LoadingSpinner` - Spinner de carga consistente

---

**Última actualización:** 2 de octubre de 2025
