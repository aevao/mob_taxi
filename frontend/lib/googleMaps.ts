import { CHICAGO_CENTER } from "@/constants/chicago";

/** REST calls (Places, Geocoding, Directions) — must NOT use iOS/Android app restrictions. */
const REST_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const REST_KEY_HINT =
  "Create a separate API key: Application restrictions → None, API restrictions → Places + Geocoding + Directions. iOS/Android keys only work for native MapView.";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface PlaceSuggestion {
  placeId: string;
  label: string;
  address: string;
}

export interface DirectionsResult {
  coordinates: LatLng[];
  distanceMiles: number;
  durationMinutes: number;
}

function hasApiKey(): boolean {
  return Boolean(REST_API_KEY && REST_API_KEY.length > 10);
}

async function googleGet<T>(
  path: string,
  params: Record<string, string>
): Promise<T | null> {
  if (!hasApiKey()) return null;

  const query = new URLSearchParams({
    language: "en",
    ...params,
    key: REST_API_KEY!,
  });
  const url = `https://maps.googleapis.com/maps/api/${path}?${query}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.warn(`Google Maps ${path}:`, data.status, data.error_message);
      if (data.status === "REQUEST_DENIED") {
        console.warn(REST_KEY_HINT);
      }
      return null;
    }
    return data as T;
  } catch (error) {
    console.warn(`Google Maps ${path} failed`, error);
    return null;
  }
}

export function decodePolyline(encoded: string): LatLng[] {
  const coordinates: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (!query.trim() || !hasApiKey()) return [];

  const data = await googleGet<{
    predictions: {
      place_id: string;
      description: string;
      structured_formatting: { main_text: string };
    }[];
  }>("place/autocomplete/json", {
    input: query.trim(),
    location: `${CHICAGO_CENTER.latitude},${CHICAGO_CENTER.longitude}`,
    radius: "80000",
    components: "country:us",
  });

  if (!data?.predictions?.length) return [];

  return data.predictions.map((item) => ({
    placeId: item.place_id,
    label: item.structured_formatting.main_text,
    address: item.description,
  }));
}

export async function resolvePlace(placeId: string): Promise<{
  latitude: number;
  longitude: number;
  address: string;
  label: string;
} | null> {
  const data = await googleGet<{
    result: {
      formatted_address: string;
      name: string;
      geometry: { location: { lat: number; lng: number } };
    };
  }>("place/details/json", {
    place_id: placeId,
    fields: "geometry,formatted_address,name",
  });

  if (!data?.result) return null;

  return {
    latitude: data.result.geometry.location.lat,
    longitude: data.result.geometry.location.lng,
    address: data.result.formatted_address,
    label: data.result.name,
  };
}

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  if (!address.trim() || !hasApiKey()) return null;

  const data = await googleGet<{
    results: { geometry: { location: { lat: number; lng: number } } }[];
  }>("geocode/json", {
    address: address.trim(),
    bounds: "41.644,-87.94|42.023,-87.524",
  });

  const location = data?.results?.[0]?.geometry?.location;
  if (!location) return null;

  return { latitude: location.lat, longitude: location.lng };
}

export interface ReverseGeocodeResult {
  label: string;
  address: string;
  neighborhood: string | null;
}

export async function reverseGeocode(
  point: LatLng
): Promise<ReverseGeocodeResult | null> {
  const data = await googleGet<{
    results: {
      formatted_address: string;
      types: string[];
      address_components: { long_name: string; types: string[] }[];
    }[];
  }>("geocode/json", {
    latlng: `${point.latitude},${point.longitude}`,
  });

  const result = data?.results?.find((item) => !item.types.includes("plus_code"));
  if (!result) return null;

  const component = (type: string) =>
    result.address_components.find((item) => item.types.includes(type))
      ?.long_name;

  const street = [component("street_number"), component("route")]
    .filter(Boolean)
    .join(" ");
  const address = result.formatted_address.replace(/, USA$/, "");

  return {
    label: street || address.split(",")[0] || address,
    address,
    neighborhood: component("neighborhood") ?? component("locality") ?? null,
  };
}

export async function fetchDirections(
  origin: LatLng,
  destination: LatLng
): Promise<DirectionsResult | null> {
  const data = await googleGet<{
    routes: {
      overview_polyline: { points: string };
      legs: {
        distance: { value: number };
        duration: { value: number };
      }[];
    }[];
  }>("directions/json", {
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    mode: "driving",
  });

  const route = data?.routes?.[0];
  const leg = route?.legs?.[0];
  if (!route?.overview_polyline?.points || !leg) return null;

  return {
    coordinates: decodePolyline(route.overview_polyline.points),
    distanceMiles: Math.round((leg.distance.value / 1609.34) * 10) / 10,
    durationMinutes: Math.max(1, Math.round(leg.duration.value / 60)),
  };
}

export function isGoogleMapsConfigured(): boolean {
  return hasApiKey();
}
