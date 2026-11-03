import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGoBack } from "@/hooks/useGoBack";
import * as ExpoLocation from "expo-location";
import { ArrowLeft, LocateFixed, MapPin } from "lucide-react-native";
import {
  PinPickerMap,
  type PinPickerMapHandle,
} from "@/components/PinPickerMap";
import { Button, NavIconButton } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { LatLng, reverseGeocode } from "@/lib/googleMaps";
import { haptics } from "@/lib/haptics";
import { CHICAGO_CENTER } from "@/constants/chicago";
import { Location } from "@/constants/mockData";
import {
  ThemeColors,
  borderRadius,
  elevation,
  spacing,
  typography,
} from "@/constants/theme";

const PIN_HEAD = 24;
const PIN_STEM = 16;
const PIN_HEIGHT = PIN_HEAD + PIN_STEM;
const PIN_LIFT = 10;

function coordinateLabel({ latitude, longitude }: LatLng) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export default function MapPickerScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { booking, setDropoff, savedPlaces, updateSavedPlace } = useApp();
  const params = useLocalSearchParams<{ savedPlace?: string }>();
  const savedPlace = savedPlaces.find((item) => item.id === params.savedPlace);

  const mapRef = useRef<PinPickerMapHandle>(null);
  const requestId = useRef(0);
  const lift = useRef(new Animated.Value(0)).current;

  const initialCenter = useRef<LatLng>(
    savedPlace
      ? savedPlace.location ?? booking.pickup ?? CHICAGO_CENTER
      : booking.dropoff ?? booking.pickup ?? CHICAGO_CENTER
  ).current;

  const noun = savedPlace?.label.toLowerCase();
  const title = savedPlace ? `Set ${noun} address` : "Set your destination";
  const ctaLabel = savedPlace ? `Save ${noun}` : "Confirm destination";

  const [center, setCenter] = useState<LatLng | null>(null);
  const [place, setPlace] = useState<Location | null>(null);
  const [moving, setMoving] = useState(false);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    Animated.spring(lift, {
      toValue: moving ? -PIN_LIFT : 0,
      useNativeDriver: true,
      speed: 24,
      bounciness: moving ? 0 : 8,
    }).start();
  }, [moving]);

  const handleMoveStart = () => {
    setMoving(true);
    setResolving(true);
  };

  const handleMoveEnd = async (point: LatLng) => {
    setMoving(false);
    setCenter(point);
    setResolving(true);

    const id = ++requestId.current;
    const result = await reverseGeocode(point);
    if (id !== requestId.current) return;

    const fallback = coordinateLabel(point);
    setPlace({
      id: `pin-${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`,
      label: result?.label ?? "Pinned location",
      address: result?.address ?? fallback,
      latitude: point.latitude,
      longitude: point.longitude,
      neighborhood: result?.neighborhood ?? "Chicago, IL",
    });
    setResolving(false);
  };

  const handleLocateMe = async () => {
    haptics.tap();
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      haptics.warning();
      Alert.alert(
        "Location is off",
        "Allow location access in Settings to jump to where you are.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    const position = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });
    mapRef.current?.moveTo({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  };

  const handleConfirm = () => {
    if (!place || resolving) return;
    haptics.success();

    if (savedPlace) {
      updateSavedPlace(savedPlace.id, place);
      // Pops both the picker and the edit screen that opened it.
      if (router.canDismiss()) router.dismiss(2);
      else goBack();
      return;
    }

    setDropoff(place);
    router.replace("/(app)/ride-selection");
  };

  const busy = moving || resolving || !center;

  return (
    <View style={styles.root}>
      <View style={styles.mapLayer}>
        <PinPickerMap
          ref={mapRef}
          initialCenter={initialCenter}
          onMoveStart={handleMoveStart}
          onMoveEnd={handleMoveEnd}
        />

        <View style={styles.pinLayer} pointerEvents="none">
          <View style={styles.pinFrame}>
            <View style={styles.pinShadow} />
            <Animated.View
              style={[styles.pin, { transform: [{ translateY: lift }] }]}
            >
              <View style={styles.pinHead}>
                <View style={styles.pinHeadDot} />
              </View>
              <View style={styles.pinStem} />
            </Animated.View>
          </View>
        </View>

        <SafeAreaView
          style={styles.mapOverlay}
          edges={["top"]}
          pointerEvents="box-none"
        >
          <NavIconButton
            label="Go back"
            onPress={() => goBack()}
            icon={<ArrowLeft size={20} color={colors.text} />}
          />
          <NavIconButton
            label="Go to my location"
            onPress={handleLocateMe}
            icon={<LocateFixed size={20} color={colors.text} />}
          />
        </SafeAreaView>
      </View>

      <SafeAreaView style={styles.sheet} edges={["bottom"]}>
        <View style={styles.sheetContent}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Drag the map to move the pin</Text>
          </View>

          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <MapPin size={20} color={colors.textSecondary} strokeWidth={1.75} />
            </View>
            <View style={styles.addressText}>
              {busy || !place ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                  <Text style={styles.addressLabel} numberOfLines={1}>
                    {moving ? "Moving pin…" : "Finding address…"}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.addressLabel} numberOfLines={1}>
                    {place.label}
                  </Text>
                  <Text style={styles.addressLine} numberOfLines={1}>
                    {place.address}
                  </Text>
                </>
              )}
            </View>
          </View>

          <Button
            title={ctaLabel}
            size="lg"
            onPress={handleConfirm}
            disabled={busy || !place}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    mapLayer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.mapGrid,
    },
    mapOverlay: {
      position: "absolute",
      top: 0,
      left: spacing.md,
      right: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pinLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    pinFrame: {
      width: PIN_HEAD,
      height: PIN_HEIGHT * 2,
      alignItems: "center",
    },
    pin: { alignItems: "center" },
    pinHead: {
      width: PIN_HEAD,
      height: PIN_HEAD,
      borderRadius: borderRadius.xs,
      backgroundColor: colors.pinDropoff,
      alignItems: "center",
      justifyContent: "center",
      ...elevation(colors, "md"),
    },
    pinHeadDot: {
      width: 8,
      height: 8,
      borderRadius: 2,
      backgroundColor: colors.background,
    },
    pinStem: {
      width: 3,
      height: PIN_STEM,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
      backgroundColor: colors.pinDropoff,
    },
    pinShadow: {
      position: "absolute",
      top: PIN_HEIGHT - 3,
      width: 10,
      height: 6,
      borderRadius: 5,
      backgroundColor: colors.scrim,
    },
    sheet: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.xxl,
      borderTopRightRadius: borderRadius.xxl,
      ...elevation(colors, "lg"),
    },
    sheetContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.ms,
      gap: spacing.md,
    },
    titleBlock: { gap: 2 },
    title: { ...typography.h2, color: colors.text },
    subtitle: { ...typography.caption, color: colors.textSecondary },
    addressRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.ms,
      padding: spacing.ms,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceAlt,
      minHeight: 64,
    },
    addressIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    addressText: { flex: 1, minWidth: 0, gap: 2 },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    addressLabel: { ...typography.bodyMedium, color: colors.text, flexShrink: 1 },
    addressLine: { ...typography.caption, color: colors.textSecondary },
  });
}
