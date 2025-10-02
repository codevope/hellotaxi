"use client";

import { useEffect } from 'react';

export default function ServiceWorkerProvider() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado exitosamente:', registration);
        })
        .catch((error) => {
          console.log('Error al registrar el Service Worker:', error);
        });
    }
  }, []);

  return null;
}