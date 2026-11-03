import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { http, useBlobUrl } from "@/shared/api";
import type {
  ApplicationList,
  ApplicationStatus,
  DocumentSlot,
  DriverApplication,
} from "../model/types";

export interface ApplicationFilters {
  status?: ApplicationStatus;
  q?: string;
}

export const applicationKeys = {
  all: ["applications"] as const,
  list: (filters: ApplicationFilters) => ["applications", "list", filters] as const,
  detail: (id: string) => ["applications", "detail", id] as const,
};

export const applicationApi = {
  list: (filters: ApplicationFilters) =>
    http<ApplicationList>("/admin/applications", {
      query: { status: filters.status, q: filters.q },
    }),
  get: (id: string) =>
    http<{ application: DriverApplication }>(
      `/admin/applications/${encodeURIComponent(id)}`
    ).then((res) => res.application),
  approve: (id: string, note?: string) =>
    http<{ application: DriverApplication }>(
      `/admin/applications/${encodeURIComponent(id)}/approve`,
      { method: "POST", body: { note } }
    ).then((res) => res.application),
  reject: (id: string, note: string) =>
    http<{ application: DriverApplication }>(
      `/admin/applications/${encodeURIComponent(id)}/reject`,
      { method: "POST", body: { note } }
    ).then((res) => res.application),
};

export function documentPath(id: string, slot: DocumentSlot) {
  return `/admin/applications/${encodeURIComponent(id)}/documents/${slot}`;
}

export function useApplications(filters: ApplicationFilters) {
  return useQuery({
    queryKey: applicationKeys.list(filters),
    queryFn: () => applicationApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applicationApi.get(id),
  });
}

export function useApplicationDocument(application: DriverApplication, slot: DocumentSlot) {
  return useBlobUrl(application.documents[slot] ? documentPath(application.id, slot) : null);
}
