import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError } from "@/lib/api";
import { ApiUser, AuthSession, authApi } from "@/lib/authApi";
import { ApplicationDraft, driverApi } from "@/lib/driverApi";
import {
  clearSession,
  loadDriverApplication,
  loadSavedPlaces,
  loadSession,
  persistDriverApplication,
  persistSavedPlaces,
  profilePhotoFor,
  saveSession,
} from "@/lib/session";
import {
  BookingState,
  DEFAULT_ORDER_DETAILS,
  DEFAULT_PICKUP,
  DEFAULT_SAVED_PLACES,
  SavedPlace,
  SavedPlaceId,
  DriverApplication,
  Location,
  MOCK_DRIVERS,
  OrderDetails,
  PaymentMethod,
  ServiceTier,
  UserProfile,
  UserRole,
  VehicleOption,
  calculateOrderTotal,
  calculateRideEstimate,
  getVehiclesForTier,
} from "@/constants/mockData";

interface AppContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  serviceTier: ServiceTier;
  setServiceTier: (tier: ServiceTier) => void;
  user: UserProfile | null;
  isAuthenticated: boolean;
  /** False until the saved session has been restored on launch. */
  authReady: boolean;
  passengerName: string;
  paymentMethods: PaymentMethod[];
  booking: BookingState;
  driverApplication: DriverApplication | null;
  savedPlaces: SavedPlace[];
  updateSavedPlace: (id: SavedPlaceId, location: Location | null) => void;
  completeSignIn: (session: AuthSession) => Promise<void>;
  /** Uploads the application; throws ApiError so the form can show it. */
  submitDriverApplication: (draft: ApplicationDraft) => Promise<void>;
  refreshDriverApplication: () => Promise<void>;
  logout: () => Promise<void>;
  addPaymentMethod: (method: Omit<PaymentMethod, "id">) => void;
  setPickup: (location: Location) => void;
  setDropoff: (location: Location) => void;
  selectVehicle: (vehicle: VehicleOption) => void;
  updateOrderDetails: (patch: Partial<OrderDetails>) => void;
  refreshFinalTotal: () => void;
  startMatching: () => void;
  scheduleRide: () => void;
  resetBooking: () => void;
}

const initialBooking: BookingState = {
  pickup: DEFAULT_PICKUP,
  dropoff: null,
  selectedVehicle: null,
  estimate: null,
  orderDetails: { ...DEFAULT_ORDER_DETAILS },
  finalTotal: null,
  status: "idle",
};

const AppContext = createContext<AppContextValue | null>(null);

async function toProfile(user: ApiUser): Promise<UserProfile> {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    phone: user.phone,
    billingAddress: user.billingAddress,
    emailVerified: user.emailVerified,
    photoUri: await profilePhotoFor(user.email),
  };
}

function recalcBooking(
  prev: BookingState,
  tier: ServiceTier
): BookingState {
  const estimate =
    prev.pickup && prev.dropoff && prev.selectedVehicle
      ? calculateRideEstimate(
          prev.pickup,
          prev.dropoff,
          prev.selectedVehicle,
          tier
        )
      : prev.estimate;
  const breakdown = calculateOrderTotal(estimate, prev.orderDetails);
  return {
    ...prev,
    estimate,
    finalTotal: estimate ? breakdown.total : null,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("passenger");
  const [serviceTier, setServiceTierState] = useState<ServiceTier>("black");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [booking, setBooking] = useState<BookingState>(initialBooking);
  const [driverApplication, setDriverApplication] =
    useState<DriverApplication | null>(null);
  const [savedPlaces, setSavedPlaces] =
    useState<SavedPlace[]>(DEFAULT_SAVED_PLACES);

  useEffect(() => {
    loadSavedPlaces().then((stored) => {
      if (stored) setSavedPlaces(stored);
    });
    loadDriverApplication().then((stored) => {
      if (stored) setDriverApplication(stored);
    });
  }, []);

  const updateSavedPlace = useCallback(
    (id: SavedPlaceId, location: Location | null) => {
      setSavedPlaces((prev) => {
        const next = prev.map((place) =>
          place.id === id
            ? {
                ...place,
                location: location ? { ...location, id: `saved-${id}` } : null,
              }
            : place
        );
        void persistSavedPlaces(next);
        return next;
      });
    },
    []
  );

  const passengerName = user?.firstName ?? "Guest";
  const isAuthenticated = user !== null;

  const setServiceTier = useCallback((tier: ServiceTier) => {
    setServiceTierState(tier);
    setBooking((prev) => {
      const vehicles = getVehiclesForTier(tier);
      const stillValid =
        prev.selectedVehicle &&
        vehicles.some((v) => v.id === prev.selectedVehicle!.id);
      const selected = stillValid
        ? prev.selectedVehicle!
        : vehicles[0] ?? null;
      const next = {
        ...prev,
        selectedVehicle: selected,
      };
      return recalcBooking(next, tier);
    });
  }, []);

  const setPickup = useCallback(
    (location: Location) => {
      setBooking((prev) =>
        recalcBooking({ ...prev, pickup: location }, serviceTier)
      );
    },
    [serviceTier]
  );

  const setDropoff = useCallback(
    (location: Location) => {
      setBooking((prev) =>
        recalcBooking(
          { ...prev, dropoff: location, status: "selecting" },
          serviceTier
        )
      );
    },
    [serviceTier]
  );

  const selectVehicle = useCallback(
    (vehicle: VehicleOption) => {
      setBooking((prev) => {
        if (!prev.pickup || !prev.dropoff) return prev;
        return recalcBooking({ ...prev, selectedVehicle: vehicle }, serviceTier);
      });
    },
    [serviceTier]
  );

  const updateOrderDetails = useCallback(
    (patch: Partial<OrderDetails>) => {
      setBooking((prev) => {
        const orderDetails = { ...prev.orderDetails, ...patch };
        const next = { ...prev, orderDetails };
        return recalcBooking(next, serviceTier);
      });
    },
    [serviceTier]
  );

  const refreshFinalTotal = useCallback(() => {
    setBooking((prev) => recalcBooking(prev, serviceTier));
  }, [serviceTier]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const saved = await loadSession();
      if (!saved) {
        setAuthReady(true);
        return;
      }

      const cached = await toProfile(saved.user);
      if (cancelled) return;
      setAuthToken(saved.token);
      setUser(cached);
      setAuthReady(true);

      try {
        const { user: fresh } = await authApi.me(saved.token);
        if (cancelled) return;
        await saveSession({ token: saved.token, user: fresh });
        setUser(await toProfile(fresh));
      } catch (error) {
        if (!cancelled && error instanceof ApiError && error.status === 401) {
          await clearSession();
          setAuthToken(null);
          setUser(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const completeSignIn = useCallback(async (session: AuthSession) => {
    await saveSession(session);
    setAuthToken(session.token);
    setUser(await toProfile(session.user));
  }, []);

  const submitDriverApplication = useCallback(
    async (draft: ApplicationDraft) => {
      const { application } = await driverApi.submit(draft);
      const next: DriverApplication = { ...draft, ...application };
      setDriverApplication(next);
      await persistDriverApplication(next);
      setRole("driver");
    },
    []
  );

  const refreshDriverApplication = useCallback(async () => {
    if (!driverApplication) return;
    const { application } = await driverApi.status(driverApplication.id);
    const next: DriverApplication = { ...driverApplication, ...application };
    setDriverApplication(next);
    await persistDriverApplication(next);
  }, [driverApplication]);

  const logout = useCallback(async () => {
    const token = authToken;
    setUser(null);
    setAuthToken(null);
    setPaymentMethods([]);
    await clearSession();
    if (token) {
      authApi.logout(token).catch(() => undefined);
    }
  }, [authToken]);

  const addPaymentMethod = useCallback(
    (method: Omit<PaymentMethod, "id">) => {
      setPaymentMethods((prev) => {
        const id = `pm-${Date.now()}`;
        const next = method.isDefault
          ? prev.map((m) => ({ ...m, isDefault: false }))
          : prev;
        return [...next, { ...method, id }];
      });
    },
    []
  );

  const startMatching = useCallback(() => {
    const driver =
      MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
    setBooking((prev) => ({
      ...prev,
      status: "matching",
      matchingProgress: 0,
      driverName: driver.name,
      driverRating: driver.rating,
      driverPlate: driver.plate,
    }));
  }, []);

  const scheduleRide = useCallback(() => {
    setBooking((prev) => ({
      ...prev,
      status: "scheduled",
    }));
  }, []);

  const resetBooking = useCallback(() => {
    setBooking(initialBooking);
  }, []);

  const value = useMemo(
    () => ({
      role,
      setRole,
      serviceTier,
      setServiceTier,
      user,
      isAuthenticated,
      authReady,
      passengerName,
      paymentMethods,
      booking,
      driverApplication,
      savedPlaces,
      updateSavedPlace,
      completeSignIn,
      submitDriverApplication,
      refreshDriverApplication,
      logout,
      addPaymentMethod,
      setPickup,
      setDropoff,
      selectVehicle,
      updateOrderDetails,
      refreshFinalTotal,
      startMatching,
      scheduleRide,
      resetBooking,
    }),
    [
      role,
      serviceTier,
      user,
      isAuthenticated,
      authReady,
      passengerName,
      paymentMethods,
      booking,
      driverApplication,
      savedPlaces,
      updateSavedPlace,
      completeSignIn,
      submitDriverApplication,
      refreshDriverApplication,
      logout,
      addPaymentMethod,
      setPickup,
      setDropoff,
      selectVehicle,
      updateOrderDetails,
      refreshFinalTotal,
      startMatching,
      scheduleRide,
      resetBooking,
      setServiceTier,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

export function useOrderBreakdown() {
  const { booking } = useApp();
  return calculateOrderTotal(booking.estimate, booking.orderDetails);
}
