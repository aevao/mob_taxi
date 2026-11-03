export type ApplicationStatus = "pending_review" | "approved" | "rejected";

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
}

export interface Vehicle {
  make: string;
  model: string;
  year: string;
  color: string;
  plate: string;
}

export type DocumentSlot =
  | "profilePhoto"
  | "licensePhoto"
  | "registration"
  | "insurance"
  | "exteriorFront"
  | "exteriorRear"
  | "interiorFront"
  | "interiorRear";

export interface DriverApplication {
  id: string;
  status: ApplicationStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssnLast4: string;
  address: Address;
  vehicle: Vehicle;
  documents: Partial<Record<DocumentSlot, string>>;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface ApplicationCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface ApplicationList {
  items: DriverApplication[];
  counts: ApplicationCounts;
}
