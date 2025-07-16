import { Client } from '@googlemaps/google-maps-services-js';

// Initialize Google Maps client
const googleMapsClient = new Client({});

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  addressComponents: {
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('Google Maps API key not configured. Skipping geocoding.');
      return null;
    }

    const response = await googleMapsClient.geocode({
      params: {
        address: address,
        key: apiKey,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const location = result.geometry.location;

      // Extract address components
      const addressComponents = {
        city: undefined as string | undefined,
        state: undefined as string | undefined,
        country: undefined as string | undefined,
        postalCode: undefined as string | undefined,
      };

      result.address_components.forEach((component) => {
        const types = component.types as string[];
        if (
          types.includes('locality') ||
          types.includes('administrative_area_level_2')
        ) {
          addressComponents.city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          addressComponents.state = component.long_name;
        } else if (types.includes('country')) {
          addressComponents.country = component.long_name;
        } else if (types.includes('postal_code')) {
          addressComponents.postalCode = component.long_name;
        }
      });

      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
        addressComponents,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn(
        'Google Maps API key not configured. Skipping reverse geocoding.'
      );
      return null;
    }

    const response = await googleMapsClient.reverseGeocode({
      params: {
        latlng: { lat: latitude, lng: longitude },
        key: apiKey,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const location = result.geometry.location;

      // Extract address components
      const addressComponents = {
        city: undefined as string | undefined,
        state: undefined as string | undefined,
        country: undefined as string | undefined,
        postalCode: undefined as string | undefined,
      };

      result.address_components.forEach((component) => {
        const types = component.types as string[];
        if (
          types.includes('locality') ||
          types.includes('administrative_area_level_2')
        ) {
          addressComponents.city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          addressComponents.state = component.long_name;
        } else if (types.includes('country')) {
          addressComponents.country = component.long_name;
        } else if (types.includes('postal_code')) {
          addressComponents.postalCode = component.long_name;
        }
      });

      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
        addressComponents,
      };
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
