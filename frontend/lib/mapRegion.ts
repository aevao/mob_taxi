import { CHICAGO_CENTER } from "@/constants/chicago";
import type { Location } from "@/constants/mockData";

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export function regionForLocations(
  pickup?: Location | null,
  dropoff?: Location | null
): MapRegion {
  if (pickup && dropoff) {
    const latitudeDelta =
      Math.abs(pickup.latitude - dropoff.latitude) * 1.8 + 0.06;
    const longitudeDelta =
      Math.abs(pickup.longitude - dropoff.longitude) * 1.8 + 0.06;

    return {
      latitude: (pickup.latitude + dropoff.latitude) / 2,
      longitude: (pickup.longitude + dropoff.longitude) / 2,
      latitudeDelta: Math.max(latitudeDelta, 0.08),
      longitudeDelta: Math.max(longitudeDelta, 0.08),
    };
  }

  if (pickup) {
    return {
      latitude: pickup.latitude,
      longitude: pickup.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }

  return {
    latitude: CHICAGO_CENTER.latitude,
    longitude: CHICAGO_CENTER.longitude,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  };
}
