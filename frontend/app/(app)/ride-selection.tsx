import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useGoBack } from "@/hooks/useGoBack";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Route,
} from "lucide-react-native";
import { MapContainer } from "@/components/MapContainer";
import { SwipeableSheet } from "@/components/SwipeableSheet";
import { VehicleCard } from "@/components/VehicleCard";
import { Button, NavIconButton, SegmentedControl } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useRequireAuth, useRequirePayment } from "@/hooks/useRequireAuth";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  CLIENT_COMMISSION_USD,
  RideEstimate,
  SERVICE_TIER_LABELS,
  ServiceTier,
  VehicleOption,
  calculateOrderTotal,
  calculateRideEstimate,
  formatEta,
  formatPrice,
  formatScheduledTime,
  getVehiclesForTier,
  isPretorianVehicle,
} from "@/constants/mockData";
import {
  ThemeColors,
  borderRadius,
  spacing,
  typography,
} from "@/constants/theme";
import { withoutCountry } from "@/lib/formatters";
import { haptics } from "@/lib/haptics";

/** Back button row floating over the map. */
const MAP_HEADER_HEIGHT = 48;

const TIER_OPTIONS = (["black", "public"] as ServiceTier[]).map((value) => ({
  value,
  label: SERVICE_TIER_LABELS[value],
}));

export default function RideSelectionScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    booking,
    serviceTier,
    setServiceTier,
    selectVehicle,
    startMatching,
    updateOrderDetails,
    paymentMethods,
  } = useApp();
  const { requireAuth } = useRequireAuth("/(app)/ride-selection");
  const { requirePayment } = useRequirePayment("/(app)/ride-selection");
  const insets = useSafeAreaInsets();
  const [sheetHeight, setSheetHeight] = useState(0);

  const vehicles = getVehiclesForTier(serviceTier);
  const [localVehicle, setLocalVehicle] = useState<VehicleOption | null>(
    booking.selectedVehicle ?? vehicles[0] ?? null
  );

  const { pickup, dropoff } = booking;
  const estimates = useMemo(() => {
    const byId: Record<string, RideEstimate> = {};
    if (!pickup || !dropoff) return byId;
    for (const vehicle of getVehiclesForTier(serviceTier)) {
      byId[vehicle.id] = calculateRideEstimate(
        pickup,
        dropoff,
        vehicle,
        serviceTier
      );
    }
    return byId;
  }, [pickup, dropoff, serviceTier]);

  useEffect(() => {
    const tierVehicles = getVehiclesForTier(serviceTier);
    const stillValid = tierVehicles.find((v) => v.id === localVehicle?.id);
    const next = stillValid ?? tierVehicles[0];
    if (next && next.id !== localVehicle?.id) {
      setLocalVehicle(next);
    }
  }, [serviceTier]);

  useEffect(() => {
    if (booking.pickup && booking.dropoff && localVehicle) {
      selectVehicle(localVehicle);
    }
  }, [localVehicle, serviceTier]);

  const estimate =
    (localVehicle && estimates[localVehicle.id]) ?? booking.estimate;
  const total = estimate
    ? calculateOrderTotal(estimate, booking.orderDetails).total
    : null;
  const isScheduled = booking.orderDetails.scheduleType === "later";
  const defaultPayment =
    paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0];

  const handleRequest = () => {
    if (!localVehicle) return;
    selectVehicle(localVehicle);
    if (!requireAuth()) return;
    if (!requirePayment()) return;

    if (isPretorianVehicle(localVehicle)) {
      router.push("/(app)/pretorian-order");
      return;
    }

    haptics.success();
    startMatching();
    router.push("/(app)/matching");
  };

  const pickupAddress = booking.pickup
    ? withoutCountry(booking.pickup.address)
    : "Pickup location";
  const dropoffAddress = booking.dropoff
    ? withoutCountry(booking.dropoff.address)
    : "Destination";

  const ctaLabel = localVehicle
    ? `Request ${localVehicle.shortName}`
    : "Request taxi";

  return (
    <View style={styles.root}>
      <View style={styles.mapLayer}>
        <MapContainer
          pickup={booking.pickup}
          dropoff={booking.dropoff}
          showRoute
          fullBleed
          obscured={{ top: insets.top + MAP_HEADER_HEIGHT, bottom: sheetHeight }}
        />

        <SafeAreaView style={styles.mapOverlay} edges={["top"]} pointerEvents="box-none">
          <NavIconButton
            label="Go back"
            onPress={() => goBack()}
            icon={<ArrowLeft size={20} color={colors.text} />}
          />
        </SafeAreaView>
      </View>

      <SwipeableSheet
        initialSnap="half"
        onHeightChange={setSheetHeight}
        header={
          <View style={styles.header}>
            <View
              style={styles.route}
              accessible
              accessibilityLabel={`From ${pickupAddress} to ${dropoffAddress}`}
            >
              <View style={styles.rail}>
                <View style={styles.dotPickup} />
                <View style={styles.connector} />
                <View style={styles.dotDropoff} />
              </View>
              <View style={styles.addresses}>
                <Text style={styles.address} numberOfLines={1}>
                  {pickupAddress}
                </Text>
                <Text style={styles.address} numberOfLines={1}>
                  {dropoffAddress}
                </Text>
              </View>
            </View>
            {estimate ? (
              <View style={styles.tripMeta}>
                <Route size={14} color={colors.textSecondary} />
                <Text style={styles.tripMetaText}>
                  {estimate.distanceMiles} mi ·{" "}
                  {formatEta(estimate.durationMinutes)}
                </Text>
              </View>
            ) : null}
            <View style={styles.tierWrap}>
              <SegmentedControl
                options={TIER_OPTIONS}
                value={serviceTier}
                onChange={setServiceTier}
              />
            </View>
          </View>
        }
        footer={
          <View style={styles.footerBlock}>
            <View style={styles.optionsRow}>
              <Pressable
                onPress={() => {
                  haptics.tap();
                  if (!requireAuth()) return;
                  router.push({
                    pathname: "/(auth)/add-payment",
                    params: { returnTo: "/(app)/ride-selection" },
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  defaultPayment ? defaultPayment.label : "Add payment"
                }
                style={({ pressed }) => [
                  styles.optionPressable,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.optionRow}>
                  <View style={styles.optionIcon}>
                    <CreditCard size={18} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.optionText} numberOfLines={1}>
                    {defaultPayment ? defaultPayment.label : "Add payment"}
                  </Text>
                  <View style={styles.optionChevron}>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </View>
                </View>
              </Pressable>

              <View style={styles.optionDivider} />

              <Pressable
                onPress={() => {
                  haptics.tap();
                  updateOrderDetails({ scheduleType: "later" });
                  router.push("/(app)/ride-later");
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  isScheduled
                    ? formatScheduledTime(booking.orderDetails.scheduledFor)
                    : "Ride now"
                }
                style={({ pressed }) => [
                  styles.optionPressable,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.optionRow}>
                  <View style={styles.optionIcon}>
                    <Clock size={18} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.optionText} numberOfLines={1}>
                    {isScheduled
                      ? formatScheduledTime(booking.orderDetails.scheduledFor)
                      : "Ride now"}
                  </Text>
                  <View style={styles.optionChevron}>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </View>
                </View>
              </Pressable>
            </View>

            <Button
              title={ctaLabel}
              size="lg"
              onPress={handleRequest}
              disabled={!localVehicle}
            />
            <Text style={styles.feeHint}>
              {total !== null ? `${formatPrice(total)} total · ` : ""}
              includes {formatPrice(CLIENT_COMMISSION_USD)} service fee
            </Text>
          </View>
        }
      >
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          bounces
          nestedScrollEnabled
        >
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              estimate={estimates[vehicle.id] ?? null}
              tier={serviceTier}
              selected={localVehicle?.id === vehicle.id}
              onSelect={() => setLocalVehicle(vehicle)}
            />
          ))}
        </ScrollView>
      </SwipeableSheet>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    mapLayer: { ...StyleSheet.absoluteFillObject },
    mapOverlay: {
      position: "absolute",
      top: 0,
      left: spacing.md,
      right: spacing.md,
    },
    header: { width: "100%", gap: spacing.ms, marginBottom: spacing.xs },
    route: {
      width: "100%",
      flexDirection: "row",
      alignItems: "stretch",
      gap: spacing.ms,
      flexShrink: 0,
    },
    rail: {
      width: 10,
      alignItems: "center",
      paddingVertical: 7,
      flexShrink: 0,
    },
    dotPickup: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.pinPickup,
    },
    connector: {
      flex: 1,
      width: 1.5,
      minHeight: 10,
      backgroundColor: colors.borderLight,
      marginVertical: 3,
    },
    dotDropoff: {
      width: 9,
      height: 9,
      borderRadius: 2,
      backgroundColor: colors.pinDropoff,
    },
    addresses: { flex: 1, minWidth: 0, gap: spacing.sm },
    address: { ...typography.bodyMedium, color: colors.text },
    tripMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: -spacing.xs,
      paddingLeft: 10 + spacing.ms,
      flexShrink: 0,
    },
    tripMetaText: { ...typography.caption, color: colors.textSecondary },
    tierWrap: { flexShrink: 0 },
    list: { flex: 1, minHeight: 0 },
    listContent: { paddingBottom: spacing.xs },
    footerBlock: { width: "100%", gap: spacing.sm },
    optionsRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceAlt,
      borderRadius: borderRadius.md,
      overflow: "hidden",
    },
    optionPressable: {
      flex: 1,
      alignSelf: "stretch",
      minWidth: 0,
    },
    optionRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      paddingHorizontal: spacing.ms,
      paddingVertical: spacing.ms,
      minHeight: 48,
    },
    optionIcon: { flexShrink: 0 },
    optionChevron: { flexShrink: 0 },
    pressed: { opacity: 0.6 },
    optionText: {
      ...typography.caption,
      color: colors.text,
      flex: 1,
      minWidth: 0,
    },
    optionDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: "stretch",
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
    },
    feeHint: {
      ...typography.micro,
      color: colors.textMuted,
      textAlign: "center",
      fontWeight: "400",
    },
  });
}
