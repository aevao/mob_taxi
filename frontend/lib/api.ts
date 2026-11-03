import { Platform } from "react-native";
import Constants from "expo-constants";

const REQUEST_TIMEOUT_MS = 15_000;
const API_PORT = 8080;

/**
 * EXPO_PUBLIC_API_URL wins. Otherwise reuse the Metro host so a phone on the
 * same Wi-Fi reaches the Go server on the developer's machine.
 */
function resolveBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
  }

  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return `http://${host || "localhost"}:${API_PORT}`;
}

export const API_URL = resolveBaseUrl();

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const UPLOAD_TIMEOUT_MS = 120_000;

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** Sent as multipart/form-data; fetch sets the boundary header itself. */
  form?: FormData;
  token?: string | null;
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, form, token }: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    form ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS
  );

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: form ? "POST" : method,
      headers: {
        ...(form ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(
      0,
      "network",
      `Can't reach the server at ${API_URL}. Make sure the backend is running.`
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data?.error;
    throw new ApiError(
      response.status,
      error?.code ?? "unknown",
      error?.message ?? "Something went wrong. Try again.",
      error?.retryAfter
    );
  }
  return data as T;
}
