import { http } from "@/shared/api";

export interface AdminSession {
  token: string;
  email: string;
}

export const sessionApi = {
  login: (email: string, password: string) =>
    http<AdminSession>("/admin/login", { method: "POST", body: { email, password } }),
  logout: () => http<void>("/admin/logout", { method: "POST" }),
  me: () => http<{ email: string }>("/admin/me"),
};
