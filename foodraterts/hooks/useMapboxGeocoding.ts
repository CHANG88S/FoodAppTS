import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

/**
 * Hook for geocoding restaurant addresses using Mapbox
 * Provides functions to geocode single restaurants or handle geocoding errors
 */
export function useMapboxGeocoding() {
  const updateCoordinates = useMutation(api.geocoding.updateRestaurantCoordinates);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  /**
   * Geocode a restaurant and update its coordinates
   * @param restaurantId - The ID of the restaurant to geocode
   * @param mapboxToken - Your Mapbox access token
   */
  const geocodeRestaurant = async (
    restaurantId: string,
    mapboxToken: string
  ) => {
    setIsGeocoding(true);
    setGeocodingError(null);

    try {
      // TODO: Implement geocodeAndUpdateRestaurant action in convex/geocoding.ts
      // For now, this is a placeholder for the geocoding functionality
      setGeocodingError('Geocoding not yet implemented');
      return { success: false, error: 'Geocoding not yet implemented' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGeocodingError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsGeocoding(false);
    }
  };

  /**
   * Manually set coordinates for a restaurant
   * @param restaurantId - The ID of the restaurant
   * @param lat - Latitude
   * @param lng - Longitude
   */
  const setManualCoordinates = async (
    restaurantId: string,
    lat: number,
    lng: number
  ) => {
    try {
      await updateCoordinates({
        restaurantId: restaurantId as any,
        lat,
        lng,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  };

  return {
    geocodeRestaurant,
    setManualCoordinates,
    isGeocoding,
    geocodingError,
  };
}