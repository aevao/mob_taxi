import { API_URL } from "@/shared/config";
import { tokenStorage } from "./token";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type Query = Record<string, string | undefined>;

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  query?: Query;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

async function send(path: string, { method = "GET", body, query }: RequestOptions) {
  const token = tokenStorage.get();
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "network",
      `Can't reach the API at ${API_URL}. Is the Go server running?`
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    if (response.status === 401) tokenStorage.clear();
    throw new ApiError(
      response.status,
      data?.error?.code ?? "unknown",
      data?.error?.message ?? "Something went wrong. Try again."
    );
  }
  return response;
}

export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function httpBlob(path: string): Promise<Blob> {
  const response = await send(path, {});
  return response.blob();
}
