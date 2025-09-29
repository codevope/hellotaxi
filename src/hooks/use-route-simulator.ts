
'use client';

import { useState, useCallback, useRef } from 'react';
import type { Location } from '@/lib/types';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { decode } from '@googlemaps/polyline-codec';

const SIMULATION_INTERVAL = 2000; // Update location every 2 seconds

export function useRouteSimulator() {
  const [simulatedLocation, setSimulatedLocation] = useState<Location | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const routesLibrary = useMapsLibrary('routes');

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulating(false);
    // Do not clear the simulatedLocation here, so the marker stays at the last point
  }, []);

  const startSimulation = useCallback(
    async (origin: Location, destination: Location) => {
      if (!routesLibrary || isSimulating) {
        return;
      }
      
      stopSimulation(); // Stop any previous simulation
      setIsSimulating(true);

      try {
        const directionsService = new routesLibrary.DirectionsService();
        const request: google.maps.DirectionsRequest = {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: google.maps.TravelMode.DRIVING,
        };

        const response = await directionsService.route(request);
        const route = response.routes[0];
        if (!route || !route.overview_polyline) {
          throw new Error('No route found');
        }

        const decodedPath: [number, number][] = decode(route.overview_polyline, 5);
        const path = decodedPath.map(([lat, lng]) => ({ lat, lng }));

        let step = 0;
        setSimulatedLocation(path[0]); // Start at the origin

        intervalRef.current = setInterval(() => {
          step++;
          const nextLocation = path[Math.min(step, path.length - 1)];
          setSimulatedLocation(nextLocation);

          if (step >= path.length -1) {
            stopSimulation();
          }
        }, SIMULATION_INTERVAL);

      } catch (error) {
        console.error('Route simulation failed:', error);
        stopSimulation();
      }
    },
    [routesLibrary, isSimulating, stopSimulation]
  );

  return { simulatedLocation, startSimulation, stopSimulation, isSimulating };
}
