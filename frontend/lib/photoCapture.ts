import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";

export interface CapturedPhoto {
  uri: string;
  capturedAt: string;
  /** Live photos must be "camera"; "library" is only allowed for documents or dev simulators. */
  source: "camera" | "library";
}

export type CaptureMode = "live" | "document";

interface CaptureOptions {
  mode: CaptureMode;
  /** Selfies open the front camera. */
  selfie?: boolean;
}

const QUALITY = 0.7;

function toPhoto(
  result: ImagePicker.ImagePickerResult,
  source: CapturedPhoto["source"]
): CapturedPhoto | null {
  if (result.canceled || !result.assets?.[0]) return null;
  return {
    uri: result.assets[0].uri,
    capturedAt: new Date().toISOString(),
    source,
  };
}

function showPermissionAlert(kind: "camera" | "photos") {
  Alert.alert(
    kind === "camera" ? "Camera access needed" : "Photo access needed",
    kind === "camera"
      ? "Allow camera access in Settings to take a live photo."
      : "Allow photo access in Settings to upload a document.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => Linking.openSettings() },
    ]
  );
}

async function fromCamera(selfie: boolean): Promise<CapturedPhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    showPermissionAlert("camera");
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: QUALITY,
    allowsEditing: false,
    cameraType: selfie
      ? ImagePicker.CameraType.front
      : ImagePicker.CameraType.back,
  });
  return toPhoto(result, "camera");
}

async function fromLibrary(): Promise<CapturedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    showPermissionAlert("photos");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: QUALITY,
    allowsEditing: false,
  });
  return toPhoto(result, "library");
}

function askDocumentSource(): Promise<"camera" | "library" | null> {
  return new Promise((resolve) => {
    Alert.alert("Add document", undefined, [
      { text: "Take photo", onPress: () => resolve("camera") },
      { text: "Choose from library", onPress: () => resolve("library") },
      { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
    ]);
  });
}

function askSimulatorFallback(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      "Camera unavailable",
      "This device has no camera (simulator). Pick a library photo for testing — release builds accept live photos only.",
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Use library", onPress: () => resolve(true) },
      ]
    );
  });
}

/**
 * Live mode opens the camera only — gallery uploads are blocked so profile,
 * license and vehicle photos are taken in real time.
 */
export async function capturePhoto({
  mode,
  selfie = false,
}: CaptureOptions): Promise<CapturedPhoto | null> {
  if (mode === "document") {
    const source = await askDocumentSource();
    if (!source) return null;
    return source === "camera" ? fromCamera(false) : fromLibrary();
  }

  try {
    return await fromCamera(selfie);
  } catch (error) {
    if (__DEV__ && (await askSimulatorFallback())) {
      return fromLibrary();
    }
    Alert.alert(
      "Camera error",
      error instanceof Error ? error.message : "Could not open the camera."
    );
    return null;
  }
}
