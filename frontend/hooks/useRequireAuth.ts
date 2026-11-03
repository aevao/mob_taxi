import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";

type ReturnRoute =
  | "/(app)/ride-selection"
  | "/(app)/pretorian-order"
  | "/(app)/home"
  | "/(auth)/add-payment";

export function useRequireAuth(returnTo: ReturnRoute = "/(app)/home") {
  const router = useRouter();
  const { isAuthenticated } = useApp();

  const requireAuth = (): boolean => {
    if (isAuthenticated) return true;
    router.push({
      pathname: "/(auth)/login",
      params: { returnTo },
    });
    return false;
  };

  return { requireAuth, isAuthenticated };
}

export function useRequirePayment(returnTo: ReturnRoute = "/(app)/ride-selection") {
  const router = useRouter();
  const { paymentMethods, isAuthenticated } = useApp();

  const requirePayment = (): boolean => {
    if (!isAuthenticated) {
      router.push({
        pathname: "/(auth)/login",
        params: { returnTo: "/(auth)/add-payment" },
      });
      return false;
    }
    if (paymentMethods.length === 0) {
      router.push({
        pathname: "/(auth)/add-payment",
        params: { returnTo },
      });
      return false;
    }
    return true;
  };

  return { requirePayment, hasPayment: paymentMethods.length > 0 };
}
