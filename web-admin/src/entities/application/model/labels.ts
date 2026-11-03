import type { BadgeTone } from "@/shared/ui";
import type { Address, ApplicationStatus, DocumentSlot } from "./types";

export const STATUS_META: Record<ApplicationStatus, { label: string; tone: BadgeTone }> = {
  pending_review: { label: "In review", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export const DOCUMENT_LABELS: Record<DocumentSlot, string> = {
  profilePhoto: "Profile photo",
  licensePhoto: "Driver's license",
  registration: "Vehicle registration",
  insurance: "Proof of insurance",
  exteriorFront: "Exterior — front",
  exteriorRear: "Exterior — rear",
  interiorFront: "Interior — front seats",
  interiorRear: "Interior — rear seats",
};

export const DOCUMENT_GROUPS: { title: string; slots: DocumentSlot[] }[] = [
  { title: "Identity", slots: ["profilePhoto", "licensePhoto"] },
  { title: "Vehicle documents", slots: ["registration", "insurance"] },
  {
    title: "Vehicle photos",
    slots: ["exteriorFront", "exteriorRear", "interiorFront", "interiorRear"],
  },
];

export function formatAddress(address: Address) {
  const street = address.unit ? `${address.street}, ${address.unit}` : address.street;
  return `${street}, ${address.city}, ${address.state} ${address.zip}`;
}

/** "04/12/1988" → 38 */
export function ageFromDob(dob: string) {
  const [month, day, year] = dob.split("/").map(Number);
  const birth = new Date(year, month - 1, day);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}
