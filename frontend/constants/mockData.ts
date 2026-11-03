import { CHICAGO_CENTER } from "./chicago";

export const BRAND = {
  name: "WHYP",
  fullName: "WHYP INC.",
  tagline: "Chicago Premium Taxi",
  market: "CHI",
} as const;

export type UserRole = "passenger" | "driver";
export type ServiceTier = "black" | "public";

export type QuickLocationId =
  | "home"
  | "work"
  | "ohare"
  | "midway"
  | "gary";

export interface Location {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  neighborhood?: string;
  subtitle?: string;
}

export interface QuickLocation {
  id: QuickLocationId;
  label: string;
  icon: "home" | "briefcase" | "plane";
  location: Location;
  editable?: boolean;
}

export type SavedPlaceId = "home" | "work";

export interface SavedPlace {
  id: SavedPlaceId;
  label: string;
  /** null until the rider sets an address. */
  location: Location | null;
}

export type VehicleType =
  | "pretorian-sedan"
  | "pretorian-suv"
  | "personal-van"
  | "personal-suv";

export interface VehicleOption {
  id: VehicleType;
  name: string;
  shortName: string;
  description: string;
  capacityMin: number;
  capacityMax: number;
  baseRate: number;
  perMileRate: number;
  perHourRate: number;
  etaMinutes: number;
  icon: "car" | "truck" | "bus";
  tiers: ServiceTier[];
}

export interface RideEstimate {
  distanceMiles: number;
  durationMinutes: number;
  baseFare: number;
  totalFare: number;
  hourlyEstimate: number;
}

export interface BookingState {
  pickup: Location | null;
  dropoff: Location | null;
  selectedVehicle: VehicleOption | null;
  estimate: RideEstimate | null;
  orderDetails: OrderDetails;
  finalTotal: number | null;
  status: "idle" | "selecting" | "matching" | "matched" | "scheduled";
  driverName?: string;
  driverRating?: number;
  driverPlate?: string;
  matchingProgress?: number;
}

export type ScheduleType = "now" | "later";
export type AddonId = "meet-greet" | "airport-arrival" | "private-jet";
export type CarCount = 1 | 2 | 3;
export type PaymentMethodType = "card" | "apple_pay" | "google_pay";

export interface RideAddon {
  id: AddonId;
  label: string;
  price: number;
  description: string;
}

export interface OrderDetails {
  pickupTime: string;
  scheduledFor: string | null;
  scheduleType: ScheduleType;
  stops: string[];
  addons: AddonId[];
  carCount: CarCount;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  last4?: string;
  isDefault: boolean;
}

export interface USAddress {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  /** E.164, e.g. +13125550100 */
  phone: string;
  /** Must match the address the payment processor has on file for the card. */
  billingAddress?: USAddress;
  photoUri?: string;
  emailVerified?: boolean;
}

export type DriverApplicationStatus = "pending_review" | "approved" | "rejected";

export interface DriverApplication {
  id: string;
  status: DriverApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  /** Reviewer's message, shown to the applicant when rejected. */
  reviewNote?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  /** Full SSN goes straight to the background-check provider; the app keeps only the last 4. */
  ssnLast4: string;
  currentAddress: USAddress;
  licensePhotoUri: string;
  profilePhotoUri: string;
  vehicle: {
    make: string;
    model: string;
    year: string;
    color: string;
    plate: string;
    registrationUri: string;
    insuranceUri: string;
    photos: Record<VehiclePhotoSlot, string>;
  };
}

export type VehiclePhotoSlot =
  | "exteriorFront"
  | "exteriorRear"
  | "interiorFront"
  | "interiorRear";

export const VEHICLE_PHOTO_SLOTS: { id: VehiclePhotoSlot; label: string }[] = [
  { id: "exteriorFront", label: "Exterior — front" },
  { id: "exteriorRear", label: "Exterior — rear" },
  { id: "interiorFront", label: "Interior — front seats" },
  { id: "interiorRear", label: "Interior — rear seats" },
];

export function formatAddress(address: USAddress): string {
  const street = address.unit
    ? `${address.street}, ${address.unit}`
    : address.street;
  return `${street}, ${address.city}, ${address.state} ${address.zip}`;
}

export interface OrderTotalBreakdown {
  baseFare: number;
  addonsTotal: number;
  commission: number;
  carMultiplier: number;
  total: number;
}

export const SERVICE_TIER_LABELS: Record<ServiceTier, string> = {
  black: "Black Service",
  public: "Public Service",
};

export const BLACK_SERVICE_MULTIPLIER = 1.45;
export const CLIENT_COMMISSION_USD = 10;

export const VEHICLE_CATALOG: VehicleOption[] = [
  {
    id: "pretorian-sedan",
    name: "My WHYP Pretorian Sedan",
    shortName: "Pretorian Sedan",
    description: "Executive sedan for premium city travel",
    capacityMin: 1,
    capacityMax: 3,
    baseRate: 8.0,
    perMileRate: 2.85,
    perHourRate: 65,
    etaMinutes: 3,
    icon: "car",
    tiers: ["black", "public"],
  },
  {
    id: "pretorian-suv",
    name: "My WHYP Pretorian SUV",
    shortName: "Pretorian SUV",
    description: "Spacious SUV for groups and airport runs",
    capacityMin: 1,
    capacityMax: 6,
    baseRate: 11.0,
    perMileRate: 3.4,
    perHourRate: 85,
    etaMinutes: 5,
    icon: "truck",
    tiers: ["black", "public"],
  },
  {
    id: "personal-van",
    name: "My WHYP Personal Van",
    shortName: "Personal Van",
    description: "Maximum comfort for large parties",
    capacityMin: 1,
    capacityMax: 7,
    baseRate: 14.0,
    perMileRate: 3.95,
    perHourRate: 110,
    etaMinutes: 7,
    icon: "bus",
    tiers: ["black", "public"],
  },
  {
    id: "personal-suv",
    name: "My WHYP Personal SUV",
    shortName: "Personal SUV",
    description: "Luxury SUV with premium amenities",
    capacityMin: 1,
    capacityMax: 7,
    baseRate: 13.0,
    perMileRate: 3.75,
    perHourRate: 100,
    etaMinutes: 6,
    icon: "truck",
    tiers: ["black"],
  },
];

export function getVehiclesForTier(tier: ServiceTier): VehicleOption[] {
  return VEHICLE_CATALOG.filter((v) => v.tiers.includes(tier));
}

export function applyTierPricing(
  vehicle: VehicleOption,
  tier: ServiceTier
): VehicleOption {
  if (tier === "public") return vehicle;
  const m = BLACK_SERVICE_MULTIPLIER;
  return {
    ...vehicle,
    baseRate: Math.round(vehicle.baseRate * m * 100) / 100,
    perMileRate: Math.round(vehicle.perMileRate * m * 100) / 100,
    perHourRate: Math.round(vehicle.perHourRate * m),
  };
}

export const QUICK_LOCATIONS: QuickLocation[] = [
  {
    id: "home",
    label: "Home",
    icon: "home",
    editable: true,
    location: {
      id: "home",
      label: "Home",
      address: "742 N Milwaukee Ave, Chicago, IL 60642",
      latitude: 41.8963,
      longitude: -87.6534,
      neighborhood: "Wicker Park",
    },
  },
  {
    id: "work",
    label: "Work",
    icon: "briefcase",
    editable: true,
    location: {
      id: "work",
      label: "Work",
      address: "233 S Wacker Dr, Chicago, IL 60606",
      latitude: 41.8789,
      longitude: -87.6359,
      neighborhood: "Loop",
    },
  },
  {
    id: "ohare",
    label: "O'Hare",
    icon: "plane",
    location: {
      id: "ohare",
      label: "O'Hare International Airport",
      address: "10000 W O'Hare Ave, Chicago, IL 60666",
      latitude: 41.9742,
      longitude: -87.9073,
      neighborhood: "O'Hare",
      subtitle: "Chicago, IL 60666",
    },
  },
  {
    id: "midway",
    label: "Midway",
    icon: "plane",
    location: {
      id: "midway",
      label: "Midway International Airport",
      address: "5700 S Cicero Ave, Chicago, IL 60638",
      latitude: 41.7868,
      longitude: -87.7522,
      neighborhood: "Midway",
      subtitle: "Chicago, IL 60638",
    },
  },
  {
    id: "gary",
    label: "Gary",
    icon: "plane",
    location: {
      id: "gary",
      label: "Gary Chicago International Airport",
      address: "6001 W Industrial Hwy, Gary, IN 46406",
      latitude: 41.6163,
      longitude: -87.4128,
      neighborhood: "Gary",
      subtitle: "Gary, IN 46406",
    },
  },
];

export const DEFAULT_SAVED_PLACES: SavedPlace[] = (["home", "work"] as const).map(
  (id) => {
    const quick = QUICK_LOCATIONS.find((item) => item.id === id)!;
    return { id, label: quick.label, location: quick.location };
  }
);

export const AIRPORT_DESTINATIONS: Location[] = QUICK_LOCATIONS.filter(
  (q) => q.icon === "plane"
).map((q) => q.location);

export const MOCK_DRIVERS = [
  { name: "Marcus Johnson", rating: 4.92, plate: "WHYP 4821" },
  { name: "Elena Rodriguez", rating: 4.88, plate: "WHYP 7390" },
  { name: "David Kim", rating: 4.95, plate: "WHYP 2156" },
  { name: "Sarah Williams", rating: 4.91, plate: "WHYP 9043" },
];

export const DEFAULT_PICKUP: Location = {
  id: "current",
  label: "Current Location",
  address: "3102 West Grace Street, Chicago, IL 60618",
  latitude: 41.952,
  longitude: -87.694,
  neighborhood: "North Center",
};

export const POPULAR_DESTINATIONS: Location[] = [
  {
    id: "navy-pier",
    label: "Navy Pier",
    address: "600 E Grand Ave, Chicago, IL 60611",
    latitude: 41.8917,
    longitude: -87.6089,
    neighborhood: "Streeterville",
  },
  {
    id: "millennium-park",
    label: "Millennium Park",
    address: "201 E Randolph St, Chicago, IL 60602",
    latitude: 41.8826,
    longitude: -87.6226,
    neighborhood: "Loop",
  },
  {
    id: "wrigley-field",
    label: "Wrigley Field",
    address: "1060 W Addison St, Chicago, IL 60613",
    latitude: 41.9484,
    longitude: -87.6553,
    neighborhood: "Wrigleyville",
  },
  {
    id: "united-center",
    label: "United Center",
    address: "1901 W Madison St, Chicago, IL 60612",
    latitude: 41.8807,
    longitude: -87.6742,
    neighborhood: "Near West Side",
  },
];

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function calculateRideEstimate(
  pickup: Location,
  dropoff: Location,
  vehicle: VehicleOption,
  tier: ServiceTier = "public"
): RideEstimate {
  const priced = applyTierPricing(vehicle, tier);
  const distanceMiles = calculateDistanceMiles(
    pickup.latitude,
    pickup.longitude,
    dropoff.latitude,
    dropoff.longitude
  );
  const durationMinutes = Math.max(5, Math.round(distanceMiles * 3.2));
  const baseFare = priced.baseRate + distanceMiles * priced.perMileRate;
  const totalFare = Math.round(baseFare * 100) / 100;
  const hourlyEstimate =
    Math.round((durationMinutes / 60) * priced.perHourRate * 100) / 100;

  return {
    distanceMiles,
    durationMinutes,
    baseFare,
    totalFare,
    hourlyEstimate,
  };
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatEta(minutes: number): string {
  return `${minutes} min`;
}

export function formatCapacity(vehicle: VehicleOption): string {
  return `${vehicle.capacityMin}–${vehicle.capacityMax} pass`;
}

export const MATCHING_DELAY_MS = 3500;
export const MATCHING_STEPS = [20, 45, 70, 90, 100];

export const RIDE_ADDONS: RideAddon[] = [
  {
    id: "meet-greet",
    label: "Meet and Greet",
    price: 60,
    description: "Driver meets you at arrivals with name sign",
  },
  {
    id: "airport-arrival",
    label: "Airport Arrival",
    price: 0,
    description: "Flight tracking and adjusted pickup time",
  },
  {
    id: "private-jet",
    label: "Private Jet",
    price: 60,
    description: "FBO / private aviation terminal service",
  },
];

export const RIDE_LATER_OPTIONS = [
  { id: "1h", label: "In 1 hour", offsetMinutes: 60 },
  { id: "2h", label: "In 2 hours", offsetMinutes: 120 },
  { id: "tomorrow-am", label: "Tomorrow 9:00 AM", offsetMinutes: 24 * 60 },
  { id: "tomorrow-pm", label: "Tomorrow 5:00 PM", offsetMinutes: 24 * 60 + 8 * 60 },
];

export const DEFAULT_ORDER_DETAILS: OrderDetails = {
  pickupTime: "ASAP",
  scheduledFor: null,
  scheduleType: "now",
  stops: [],
  addons: [],
  carCount: 1,
};

export function isPretorianVehicle(vehicle: VehicleOption | null): boolean {
  if (!vehicle) return false;
  return (
    vehicle.id === "pretorian-sedan" || vehicle.id === "pretorian-suv"
  );
}

export function calculateOrderTotal(
  estimate: RideEstimate | null,
  orderDetails: OrderDetails
): OrderTotalBreakdown {
  const baseFare = estimate?.totalFare ?? 0;
  const carMultiplier = orderDetails.carCount;
  const subtotal = baseFare * carMultiplier;
  const addonsTotal = orderDetails.addons.reduce((sum, id) => {
    const addon = RIDE_ADDONS.find((a) => a.id === id);
    return sum + (addon?.price ?? 0);
  }, 0);
  const commission = CLIENT_COMMISSION_USD;
  const total = Math.round((subtotal + addonsTotal + commission) * 100) / 100;

  return {
    baseFare: Math.round(subtotal * 100) / 100,
    addonsTotal,
    commission,
    carMultiplier,
    total,
  };
}

export function formatScheduledTime(scheduledFor: string | null): string {
  if (!scheduledFor) return "ASAP";
  try {
    return new Date(scheduledFor).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return scheduledFor;
  }
}

/** @deprecated use VEHICLE_CATALOG + getVehiclesForTier */
export const VEHICLE_OPTIONS = VEHICLE_CATALOG;
