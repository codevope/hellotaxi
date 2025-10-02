# 📄 Índices de Firestore Requeridos

Este documento contiene una lista de los índices compuestos necesarios para que las consultas de la aplicación HiTaxi funcionen correctamente.

## ¿Por qué son necesarios los índices?

Firebase Firestore crea automáticamente índices para consultas simples (ej: `where('status', '==', 'completed')`). Sin embargo, para consultas más complejas que filtran por múltiples campos o combinan filtros de rango (como `>`, `not-in`) con filtros de igualdad, es necesario crear un **índice compuesto** manually.

Si no se crea el índice, la consulta fallará y la aplicación arrojará un error en la consola, a menudo con un enlace para crear el índice faltante.

## Cómo Crear un Índice

1.  Abre la consola de Firebase de tu proyecto.
2.  Ve a la sección **Firestore Database** -> **Índices**.
3.  Haz clic en **"Crear índice"**.
4.  Rellena los campos según la tabla de abajo, o simplemente haz clic en el enlace de auto-creación si se proporciona.

---

## Tabla de Índices

| Colección | Campos del Índice                               | Tipo de Consulta       | Enlace de Creación Automática                                                                                                                                                                                                                                                                  |
|-----------|-------------------------------------------------|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `rides`   | 1. `passenger` (Ascendente) <br> 2. `status` (Ascendente) | Igualdad y Desigualdad | [Crear este índice](https://console.firebase.google.com/v1/r/project/studio-6584656938-85cfb/firestore/indexes?create_composite=Ejpwcm9qZWN0cy9zdHVkaW8tNjU4NDY1NjkyOC04NWNmYi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcmlkZXMvaW5kZXhlcy9fEAEaDQoJcGFzc2VuZ2VyEAEaCgoGc3RhdHVzEAEaDAoIX19uYW1lX18QAQ) |
| `rides`   | 1. `status` (Ascendente) <br> 2. `date` (Ascendente) | Igualdad y Desigualdad | [Crear este índice](https://console.firebase.google.com/v1/r/project/studio-6584656938-85cfb/firestore/indexes?create_composite=ClVwcm9qZWN0cy9zdHVkaW8tNjU4NDY1NjkzOC04NWNmYi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcmlkZXMvaW5kZXhlcy9fEAEaCgoGc3RhdHVzEAEaCAoEZGF0ZRABGgwKCF9fbmFtZV9fEAE) |
| ...       | ...                                             | ...                    | ...                                                                                                                                                                                                                                                                                            |