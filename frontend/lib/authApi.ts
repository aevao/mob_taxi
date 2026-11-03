import { apiRequest } from "@/lib/api";
import type { USAddress } from "@/constants/mockData";

export type CodePurpose = "verify_email" | "reset_password";

export interface ApiUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  billingAddress: USAddress;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: ApiUser;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  billingAddress: USAddress;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiRequest<{ email: string }>("/auth/register", {
      method: "POST",
      body: payload,
    }),

  verifyEmail: (email: string, code: string) =>
    apiRequest<AuthSession>("/auth/verify-email", {
      method: "POST",
      body: { email, code },
    }),

  resendCode: (email: string, purpose: CodePurpose) =>
    apiRequest<{ sent: boolean }>("/auth/resend-code", {
      method: "POST",
      body: { email, purpose },
    }),

  login: (email: string, password: string) =>
    apiRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  forgotPassword: (email: string) =>
    apiRequest<{ sent: boolean }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (email: string, code: string, password: string) =>
    apiRequest<AuthSession>("/auth/reset-password", {
      method: "POST",
      body: { email, code, password },
    }),

  me: (token: string) => apiRequest<{ user: ApiUser }>("/me", { token }),

  logout: (token: string) =>
    apiRequest<void>("/auth/logout", { method: "POST", token }),
};
