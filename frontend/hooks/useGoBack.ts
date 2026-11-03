import { useCallback } from "react";
import { Href, useRouter } from "expo-router";

/**
 * Back that never dead-ends: screens opened directly (deep link, reload,
 * `router.replace`) have no history, so fall back to a known screen.
 */
export function useGoBack(fallback: Href = "/(app)/home") {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }, [router, fallback]);
}
