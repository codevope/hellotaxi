
'use client';

export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId?: string;
}

export interface GeocodingError {
  status: string;
  message: string;
}

/**
 * Servicio para geocodificación usando Google Maps Geocoding API
 */
export class GeocodingService {
  private static readonly API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  private static readonly BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

  /**
   * Convierte una dirección de texto en coordenadas
   */
  static async geocodeAddress(address: string): Promise<GeocodingResult> {
    if (!this.API_KEY) {
      throw new Error('Google Maps API Key not configured');
    }

    if (!address.trim()) {
      throw new Error('Address cannot be empty');
    }

    try {
      const params = new URLSearchParams({
        address: address.trim(),
        key: this.API_KEY,
        language: 'es', // Español
        region: 'PE',   // Perú
      });

      const response = await fetch(`${this.BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(this.getErrorMessage(data.status));
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('No results found for the provided address');
      }

      const result = data.results[0];
      const location = result.geometry.location;

      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
      };

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during geocoding');
    }
  }

  /**
   * Convierte coordenadas en dirección (geocodificación inversa)
   */
  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!this.API_KEY) {
      throw new Error('Google Maps API Key not configured');
    }

    try {
      const params = new URLSearchParams({
        latlng: `${lat},${lng}`,
        key: this.API_KEY,
        language: 'es',
        region: 'PE',
        result_type: 'street_address|route|neighborhood|locality',
      });

      const response = await fetch(`${this.BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(this.getErrorMessage(data.status));
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('No address found for the provided coordinates');
      }

      // Devolver solo el string de la dirección formateada
      return data.results[0].formatted_address;

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during reverse geocoding');
    }
  }

  /**
   * Obtiene múltiples direcciones en una sola llamada
   */
  static async geocodeMultipleAddresses(addresses: string[]): Promise<(GeocodingResult | null)[]> {
    const promises = addresses.map(async (address) => {
      try {
        return await this.geocodeAddress(address);
      } catch (error) {
        console.error(`Failed to geocode address: ${address}`, error);
        return null;
      }
    });

    return Promise.all(promises);
  }

  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   */
  static calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.degToRad(lat2 - lat1);
    const dLng = this.degToRad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Convierte grados a radianes
   */
  private static degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Obtiene un mensaje de error legible según el status de la API
   */
  private static getErrorMessage(status: string): string {
    switch (status) {
      case 'ZERO_RESULTS':
        return 'No se encontraron resultados para la dirección proporcionada';
      case 'OVER_QUERY_LIMIT':
        return 'Se ha excedido el límite de consultas de la API';
      case 'REQUEST_DENIED':
        return 'Solicitud denegada - verifica la configuración de la API';
      case 'INVALID_REQUEST':
        return 'Solicitud inválida - faltan parámetros requeridos';
      case 'UNKNOWN_ERROR':
        return 'Error desconocido del servidor - intenta de nuevo';
      default:
        return `Error de geocodificación: ${status}`;
    }
  }

  /**
   * Valida si una coordenada está dentro del rango de Perú (aproximado)
   */
  static isValidPeruvianCoordinate(lat: number, lng: number): boolean {
    // Rango aproximado de Perú
    const minLat = -18.4;
    const maxLat = -0.1;
    const minLng = -81.4;
    const maxLng = -68.7;

    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  }

  /**
   * Obtiene el centro aproximado de una ciudad peruana
   */
  static getCityCenter(city: string): { lat: number; lng: number } | null {
    const cityCenters: Record<string, { lat: number; lng: number }> = {
      'lima': { lat: -12.0464, lng: -77.0428 },
      'chiclayo': { lat: -6.7713, lng: -79.8442 },
      'trujillo': { lat: -8.1090, lng: -79.0215 },
      'piura': { lat: -5.1945, lng: -80.6328 },
      'arequipa': { lat: -16.4090, lng: -71.5375 },
      'cusco': { lat: -13.5319, lng: -71.9675 },
      'iquitos': { lat: -3.7437, lng: -73.2516 },
      'huancayo': { lat: -12.0653, lng: -75.2049 },
      'tacna': { lat: -18.0056, lng: -70.2533 },
      'chimbote': { lat: -9.0853, lng: -78.5783 },
    };

    return cityCenters[city.toLowerCase()] || null;
  }
}
