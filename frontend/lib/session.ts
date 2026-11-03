import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthSession } from "@/lib/authApi";
import type { DriverApplication, SavedPlace } from "@/constants/mockData";

const SESSION_KEY = "whyp.session";
const PHOTOS_KEY = "whyp.profilePhotos";
const SAVED_PLACES_KEY = "whyp.savedPlaces";
const DRIVER_APPLICATION_KEY = "whyp.driverApplication";

export async function loadSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession) {
  return AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  return AsyncStorage.removeItem(SESSION_KEY);
}

/** Profile photos stay on the device until the upload API exists. */
async function loadPhotos(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(PHOTOS_KEY);
  return raw ? (JSON.parse(raw) as Record<string, string>) : {};
}

export async function saveProfilePhoto(email: string, uri: string) {
  const photos = await loadPhotos();
  photos[email] = uri;
  await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
}

export async function profilePhotoFor(email: string): Promise<string | undefined> {
  const photos = await loadPhotos();
  return photos[email];
}

/** Saved places live on the device until the places API exists. */
export async function loadSavedPlaces(): Promise<SavedPlace[] | null> {
  const raw = await AsyncStorage.getItem(SAVED_PLACES_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedPlace[];
  } catch {
    return null;
  }
}

export function persistSavedPlaces(places: SavedPlace[]) {
  return AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(places));
}

export async function loadDriverApplication(): Promise<DriverApplication | null> {
  const raw = await AsyncStorage.getItem(DRIVER_APPLICATION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DriverApplication;
  } catch {
    return null;
  }
}

export function persistDriverApplication(application: DriverApplication) {
  return AsyncStorage.setItem(
    DRIVER_APPLICATION_KEY,
    JSON.stringify(application)
  );
}
