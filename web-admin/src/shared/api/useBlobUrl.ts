import { useQuery } from "@tanstack/react-query";
import { httpBlob } from "./http";

/**
 * Protected files need the bearer header, so <img src> can't load them
 * directly — fetch as a blob and hand back an object URL.
 */
export function useBlobUrl(path: string | null) {
  return useQuery({
    queryKey: ["blob", path],
    queryFn: async () => URL.createObjectURL(await httpBlob(path as string)),
    enabled: path !== null,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  });
}
