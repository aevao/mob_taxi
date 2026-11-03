import type { useRouter } from "expo-router";

type Router = ReturnType<typeof useRouter>;

/**
 * Leaves the auth flow after a successful sign-in. Screens already in history
 * (home, ride selection) are popped back to; auth-only screens such as
 * add-payment are pushed on top of home so Back never returns to sign-in.
 */
export function finishAuth(router: Router, returnTo?: string) {
  const target = returnTo || "/(app)/home";
  if (target.startsWith("/(auth)")) {
    router.dismissTo("/(app)/home");
    router.push(target as never);
    return;
  }
  router.dismissTo(target as never);
}
