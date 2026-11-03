import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Home as HomeIcon,
  Search,
  User,
} from "lucide-react-native";
import { MapContainer } from "@/components/MapContainer";
import { SwipeableSheet } from "@/components/SwipeableSheet";
import {
  Card,
  Divider,
  ListRow,
  NavIconButton,
  SegmentedControl,
} from "@/components/ui";
import { ThemeIconButton } from "@/components/ThemeIconButton";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  SERVICE_TIER_LABELS,
  SavedPlace,
  ServiceTier,
  formatScheduledTime,
} from "@/constants/mockData";
import { withoutCountry } from "@/lib/formatters";
import {
  ThemeColors,
  borderRadius,
  spacing,
  typography,
} from "@/constants/theme";
import { haptics } from "@/lib/haptics";

/** Account / theme buttons floating over the map. */
const MAP_HEADER_HEIGHT = 52;

const TIER_OPTIONS = (["black", "public"] as ServiceTier[]).map((value) => ({
  value,
  label: SERVICE_TIER_LABELS[value],
}));

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    passengerName,
    isAuthenticated,
    serviceTier,
    setServiceTier,
    booking,
    paymentMethods,
    savedPlaces,
    setDropoff,
  } = useApp();
  const insets = useSafeAreaInsets();
  const [sheetHeight, setSheetHeight] = useState(0);

  const openSavedPlace = (place: SavedPlace) => {
    if (!place.location) {
      router.push({ pathname: "/(app)/edit-place", params: { id: place.id } });
      return;
    }
    haptics.select();
    setDropoff(place.location);
    router.push("/(app)/ride-selection");
  };
  const isScheduled = booking.orderDetails.scheduleType === "later";
  const scheduleLabel = isScheduled
    ? formatScheduledTime(booking.orderDetails.scheduledFor)
    : "Now";
  const defaultPayment =
    paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0];

  const openWhereTo = () => router.push("/(app)/where-to");

  const goToStart = () => {
    haptics.tap();
    if (router.canGoBack()) router.dismissTo("/");
    else router.replace("/");
  };

  return (
    <View style={styles.root}>
      <View style={styles.mapLayer}>
        <MapContainer
          pickup={booking.pickup}
          dropoff={null}
          fullBleed
          hideControls
          obscured={{ top: insets.top + MAP_HEADER_HEIGHT, bottom: sheetHeight }}
        />

        <SafeAreaView
          style={styles.mapOverlay}
          edges={["top"]}
          pointerEvents="box-none"
        >
          <View style={styles.mapOverlayRow} pointerEvents="box-none">
            <NavIconButton
              label="Back to start"
              onPress={goToStart}
              icon={<ChevronLeft size={22} color={colors.text} />}
            />
            <View style={styles.overlayActions} pointerEvents="box-none">
              <ThemeIconButton />
              <NavIconButton
                label="Account"
                onPress={() =>
                  router.push(
                    isAuthenticated
                      ? "/(app)/account"
                      : {
                          pathname: "/(auth)/login",
                          params: { returnTo: "/(app)/home" },
                        }
                  )
                }
                icon={<User size={20} color={colors.text} />}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <SwipeableSheet
        initialSnap="half"
        onHeightChange={setSheetHeight}
        header={
          <View style={styles.headerBlock}>
            <Text style={styles.greeting}>
              {greetingForNow()}
              {isAuthenticated ? `, ${passengerName}` : ""}
            </Text>

            <View style={styles.searchRow}>
              <Pressable
                onPress={() => {
                  haptics.tap();
                  openWhereTo();
                }}
                accessibilityRole="button"
                accessibilityLabel="Choose destination"
                style={styles.searchTouch}
              >
                {({ pressed }) => (
                  <View style={[styles.searchBar, pressed && styles.pressed]}>
                    <View style={styles.searchLeft}>
                      <Search size={20} color={colors.textSecondary} />
                      <Text style={styles.searchText} numberOfLines={1}>
                        Where to?
                      </Text>
                    </View>
                    <ChevronRight
                      size={20}
                      color={colors.textMuted}
                      style={styles.searchChevron}
                    />
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  haptics.tap();
                  router.push({
                    pathname: "/(app)/ride-later",
                    params: { next: "where-to" },
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel="Change pickup time"
                style={styles.scheduleTouch}
              >
                {({ pressed }) => (
                  <View style={[styles.schedulePill, pressed && styles.pressed]}>
                    <Clock size={16} color={colors.text} />
                    <Text style={styles.scheduleText} numberOfLines={1}>
                      {isScheduled ? "Later" : "Now"}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {isScheduled ? (
              <Text style={styles.scheduleNote}>Pickup {scheduleLabel}</Text>
            ) : null}
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
          <Card style={styles.block}>
            {savedPlaces.map((item, index) => (
              <View key={item.id} style={styles.rowWrap}>
                {index > 0 ? <Divider inset={52} /> : null}
                <ListRow
                  icon={item.id === "home" ? HomeIcon : Briefcase}
                  title={item.label}
                  subtitle={
                    item.location
                      ? withoutCountry(item.location.address)
                      : `Add ${item.label.toLowerCase()} address`
                  }
                  onPress={() => openSavedPlace(item)}
                  style={styles.rowInset}
                />
              </View>
            ))}
          </Card>

          <View style={styles.tierBlock}>
            <SegmentedControl
              options={TIER_OPTIONS}
              value={serviceTier}
              onChange={setServiceTier}
            />
            <Text style={styles.tierHint}>
              {serviceTier === "black"
                ? "Premium fleet with our full vehicle lineup."
                : "Standard fares across everyday WHYP vehicles."}
            </Text>
          </View>

          <Card style={styles.block}>
            <ListRow
              icon={CreditCard}
              title={
                defaultPayment
                  ? defaultPayment.label
                  : "Add a payment method"
              }
              subtitle={
                defaultPayment ? "Default payment" : "Required before booking"
              }
              onPress={() => {
                router.push({
                  pathname: isAuthenticated
                    ? "/(auth)/add-payment"
                    : "/(auth)/login",
                  params: { returnTo: "/(app)/home" },
                });
              }}
              style={styles.rowInset}
            />
          </Card>
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
      left: 0,
      right: 0,
    },
    mapOverlayRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.ms,
    },
    overlayActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flexShrink: 0,
    },
    headerBlock: {
      width: "100%",
      gap: spacing.ms,
    },
    greeting: { ...typography.h2, color: colors.text },
    searchRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    searchTouch: {
      flex: 1,
      minWidth: 0,
      alignSelf: "stretch",
    },
    searchBar: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.inputBg,
      borderRadius: borderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      minHeight: 56,
    },
    searchLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.ms,
      minWidth: 0,
    },
    pressed: { opacity: 0.7 },
    searchText: {
      ...typography.bodyLarge,
      color: colors.text,
      flex: 1,
      minWidth: 0,
    },
    searchChevron: { flexShrink: 0, marginLeft: spacing.sm },
    scheduleTouch: {
      flexShrink: 0,
      alignSelf: "stretch",
    },
    schedulePill: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      backgroundColor: colors.inputBg,
      borderRadius: borderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.ms,
      minHeight: 56,
      minWidth: 72,
    },
    scheduleText: { ...typography.bodySmallMedium, color: colors.text },
    scheduleNote: { ...typography.caption, color: colors.textSecondary },
    list: { flex: 1, minHeight: 0 },
    listContent: {
      width: "100%",
      gap: spacing.ms,
      paddingBottom: spacing.sm,
    },
    block: { width: "100%" },
    rowWrap: { width: "100%", alignSelf: "stretch" },
    rowInset: { paddingHorizontal: spacing.md },
    tierBlock: { width: "100%", gap: spacing.sm },
    tierHint: { ...typography.caption, color: colors.textSecondary },
  });
}
