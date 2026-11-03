import { useEffect, useState } from "react";
import { searchPlaces, type PlaceSuggestion } from "@/lib/googleMaps";

const DEBOUNCE_MS = 350;

export function usePlacesSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const places = await searchPlaces(trimmed);
      setResults(places);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, enabled]);

  return { results, loading };
}
