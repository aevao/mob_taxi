import { useEffect, useMemo, useState } from "react";
import type { LatLng } from "@/lib/googleMaps";
import { fetchDirections } from "@/lib/googleMaps";

export function useRoutePolyline(
  origin: LatLng | null | undefined,
  destination: LatLng | null | undefined,
  enabled: boolean
) {
  const [coordinates, setCoordinates] = useState<LatLng[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !origin || !destination) {
      setCoordinates(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchDirections(origin, destination).then((result) => {
      if (cancelled) return;
      setCoordinates(result?.coordinates ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
  ]);

  const fallback = useMemo(
    () =>
      origin && destination
        ? [
            { latitude: origin.latitude, longitude: origin.longitude },
            { latitude: destination.latitude, longitude: destination.longitude },
          ]
        : null,
    [origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]
  );

  return {
    coordinates: coordinates ?? fallback,
    loading,
    isDirections: coordinates !== null && coordinates.length > 2,
  };
}
