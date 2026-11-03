import { apiRequest } from "@/lib/api";
import type {
  DriverApplication,
  DriverApplicationStatus,
  VehiclePhotoSlot,
} from "@/constants/mockData";

export interface ApplicationStatusView {
  id: string;
  status: DriverApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export type ApplicationDraft = Omit<
  DriverApplication,
  "id" | "status" | "submittedAt" | "reviewedAt" | "reviewNote"
>;

type DocumentSlot =
  | "profilePhoto"
  | "licensePhoto"
  | "registration"
  | "insurance"
  | VehiclePhotoSlot;

function documentUris(draft: ApplicationDraft): Record<DocumentSlot, string> {
  return {
    profilePhoto: draft.profilePhotoUri,
    licensePhoto: draft.licensePhotoUri,
    registration: draft.vehicle.registrationUri,
    insurance: draft.vehicle.insuranceUri,
    ...draft.vehicle.photos,
  };
}

function mimeFor(uri: string): string {
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export const driverApi = {
  submit(draft: ApplicationDraft) {
    const form = new FormData();
    form.append(
      "data",
      JSON.stringify({
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
        phone: draft.phone,
        dateOfBirth: draft.dateOfBirth,
        ssnLast4: draft.ssnLast4,
        address: draft.currentAddress,
        vehicle: {
          make: draft.vehicle.make,
          model: draft.vehicle.model,
          year: draft.vehicle.year,
          color: draft.vehicle.color,
          plate: draft.vehicle.plate,
        },
      })
    );

    for (const [slot, uri] of Object.entries(documentUris(draft))) {
      const type = mimeFor(uri);
      // React Native's FormData takes a { uri, name, type } descriptor instead of a Blob.
      form.append(slot, {
        uri,
        name: `${slot}.${type.split("/")[1]}`,
        type,
      } as unknown as Blob);
    }

    return apiRequest<{ application: ApplicationStatusView }>(
      "/driver/applications",
      { form }
    );
  },

  status(id: string) {
    return apiRequest<{ application: ApplicationStatusView }>(
      `/driver/applications/${encodeURIComponent(id)}`
    );
  },
};
