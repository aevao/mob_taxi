import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthToken } from "@/entities/session";

/** Any 401 clears the token, which re-renders this guard and sends the admin to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthToken();
  const location = useLocation();

  if (!token) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
    );
  }
  return children;
}
