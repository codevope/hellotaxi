# ⭐️ Flujo de Datos del Sistema de Calificaciones en Firestore

Este documento detalla cómo actúa el sistema de calificaciones directamente sobre la base de datos de Firestore cuando un usuario califica a otro. El flujo principal es gestionado por la función `processRating` en `src/ai/flows/process-rating.ts`.

---

## 🗺️ Diagrama de Flujo de Datos

```mermaid
graph TD
    A[Inicia Calificación en la App] --> B{processRating(input)};
    B --> C{¿Hay comentario?};
    C -- Sí --> D[Analizar Sentimiento con IA];
    D --> E[Crear Documento en Subcolección];
    C -- No --> F[Iniciar Transacción];
    E --> F;
    F --> G[Leer Documento del Usuario/Conductor];
    G --> H[Calcular Nuevo Promedio de Rating];
    H --> I[Actualizar Campo 'rating' del Documento Principal];
    I --> J[Finalizar Transacción];
    J --> K[Retornar Nuevo Promedio a la App];
```

---

## 📝 Pasos Detallados en la Base de Datos

Imaginemos que un pasajero califica a un conductor con ID `juan-perez`.

### Paso 1: Identificar la Colección y el Documento

- El sistema determina la colección a usar. En este caso, `drivers`.
- Se crea una referencia al documento del conductor: `doc(db, 'drivers', 'juan-perez')`.

### Paso 2: Almacenar la Reseña (si hay comentario)

Esta es una parte clave: **el comentario no se guarda en el documento principal del conductor.**

1.  **Navegación a Subcolección:** El sistema accede a una subcolección llamada `reviews` que está anidada dentro del documento del conductor.
    - **Ruta en Firestore:** `drivers/juan-perez/reviews/`

2.  **Creación de Nuevo Documento:** Se utiliza `addDoc` para crear un documento nuevo con un ID autogenerado dentro de esa subcolección.
    - **Ruta del nuevo documento:** `drivers/juan-perez/reviews/{newReviewId}`
    - **Contenido del Documento de Reseña:**
      ```json
      {
        "rating": 4,
        "comment": "El conductor fue muy amable y conocía la ruta.",
        "sentiment": "positive", // Resultado del análisis de IA
        "createdAt": "2025-10-28T10:00:00Z"
      }
      ```

Este diseño evita que el documento del conductor se vuelva demasiado grande, lo cual es una buena práctica en Firestore.

### Paso 3: Actualizar la Calificación Promedio (Transacción Atómica)

Esta operación se realiza dentro de un `runTransaction` para garantizar la integridad de los datos, especialmente si varios usuarios califican al mismo conductor simultáneamente.

1.  **Lectura Segura (GET):** La transacción primero lee (`transaction.get()`) el estado actual del documento del conductor.
    - **Ruta:** `drivers/juan-perez`
    - **Datos leídos:**
      ```json
      {
        "name": "Juan Perez",
        "rating": 4.7,
        "totalRides": 100,
        // ...otros campos
      }
      ```

2.  **Cálculo en Memoria:** Con los datos leídos y la nueva calificación (ej: `4`), se calcula el nuevo promedio.
    - `currentRating = 4.7`
    - `totalRatings = 100` (se usa `totalRides` como proxy)
    - `newRating = 4`
    - **Fórmula:** `(4.7 * 100 + 4) / (100 + 1) = 4.693`

3.  **Escritura Segura (UPDATE):** La transacción actualiza (`transaction.update()`) únicamente el campo `rating` en el documento principal del conductor.
    - **Ruta:** `drivers/juan-perez`
    - **Cambio realizado:**
      ```json
      {
        "rating": 4.693 // El valor antiguo (4.7) es sobrescrito
      }
      ```

La transacción asegura que entre la lectura (paso 3.1) y la escritura (paso 3.3), ningún otro proceso pueda modificar el campo `rating` de ese documento. Si detecta un conflicto, la transacción reintenta automáticamente.

---

## ✅ Resumen de la Actuación en la BD

- **1 Escritura de Documento Nuevo:** En la subcolección `reviews/{reviewId}` (solo si hay comentario).
- **1 Actualización de Campo:** En el documento `drivers/{driverId}` para el campo `rating`.

Este sistema es eficiente, escalable y seguro gracias al uso de subcolecciones y transacciones.