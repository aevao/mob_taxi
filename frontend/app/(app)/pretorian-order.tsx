import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useGoBack } from "@/hooks/useGoBack";
import { Clock, Plus, X } from "lucide-react-native";
import { AddonList, OrderSummary } from "@/components/OrderForm";
import {
  Badge,
  Button,
  Card,
  NavBar,
  SectionHeader,
  Stepper,
} from "@/components/ui";
import { useApp, useOrderBreakdown } from "@/context/AppContext";
import { useRequireAuth, useRequirePayment } from "@/hooks/useRequireAuth";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  AddonId,
  CarCount,
  RIDE_ADDONS,
  formatScheduledTime,
} from "@/constants/mockData";
import {
  ThemeColors,
  borderRadius,
  spacing,
  typography,
} from "@/constants/theme";
import { haptics } from "@/lib/haptics";

export default function PretorianOrderScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { booking, updateOrderDetails, startMatching, scheduleRide } = useApp();
  const breakdown = useOrderBreakdown();
  const { requireAuth } = useRequireAuth("/(app)/pretorian-order");
  const { requirePayment } = useRequirePayment("/(app)/pretorian-order");

  const { orderDetails } = booking;
  const [stopInput, setStopInput] = useState("");
  const vehicleName = booking.selectedVehicle?.shortName ?? "Pretorian Sedan";
  const isScheduled = orderDetails.scheduleType === "later";

  const toggleAddon = (id: AddonId) => {
    const addons = orderDetails.addons.includes(id)
      ? orderDetails.addons.filter((addon) => addon !== id)
      : [...orderDetails.addons, id];
    updateOrderDetails({ addons });
  };

  const addStop = () => {
    const value = stopInput.trim();
    if (!value) return;
    haptics.tap();
    updateOrderDetails({ stops: [...orderDetails.stops, value] });
    setStopInput("");
  };

  const handleOrder = () => {
    if (!requireAuth()) return;
    if (!requirePayment()) return;

    if (isScheduled) {
      scheduleRide();
      haptics.success();
      Alert.alert(
        "Ride scheduled",
        `Your ${vehicleName} is booked for ${formatScheduledTime(
          orderDetails.scheduledFor
        )}.`,
        [{ text: "Done", onPress: () => router.replace("/(app)/home") }]
      );
      return;
    }

    haptics.success();
    startMatching();
    router.push("/(app)/matching");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <NavBar
        title={vehicleName}
        subtitle="Pretorian order"
        onBack={() => goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.block}>
            <SectionHeader title="Trip" />
            <Card padded style={styles.tripCard}>
              <Pressable
                onPress={() => {
                  haptics.tap();
                  router.push("/(app)/ride-later");
                }}
                accessibilityRole="button"
                style={styles.timeRow}
              >
                <Clock size={18} color={colors.textSecondary} />
                <Text style={styles.timeText} numberOfLines={1}>
                  {isScheduled
                    ? formatScheduledTime(orderDetails.scheduledFor)
                    : "Pick up now"}
                </Text>
                <Text style={styles.changeLink}>Change</Text>
              </Pressable>

              <View style={styles.tripDivider} />

              <View style={styles.legRow}>
                <View style={styles.dotPickup} />
                <Text style={styles.legText} numberOfLines={2}>
                  {booking.pickup?.address ?? "Pickup location"}
                </Text>
              </View>

              {orderDetails.stops.map((stop, index) => (
                <View key={`${stop}-${index}`} style={styles.legRow}>
                  <View style={styles.dotStop} />
                  <Text style={styles.legText} numberOfLines={1}>
                    {stop}
                  </Text>
                  <Pressable
                    onPress={() => {
                      haptics.tap();
                      updateOrderDetails({
                        stops: orderDetails.stops.filter((_, i) => i !== index),
                      });
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove stop ${index + 1}`}
                  >
                    <X size={16} color={colors.textMuted} />
                  </Pressable>
                </View>
              ))}

              <View style={styles.legRow}>
                <View style={styles.dotDropoff} />
                <Text style={styles.legText} numberOfLines={2}>
                  {booking.dropoff?.address ?? "Destination"}
                </Text>
              </View>
            </Card>
          </View>

          <View style={styles.block}>
            <SectionHeader title="Add a stop" />
            <View style={styles.stopRow}>
              <TextInput
                style={styles.stopInput}
                value={stopInput}
                onChangeText={setStopInput}
                placeholder="Intermediate address"
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.brand}
                returnKeyType="done"
                onSubmitEditing={addStop}
                accessibilityLabel="Intermediate stop address"
              />
              <Pressable
                onPress={addStop}
                accessibilityRole="button"
                accessibilityLabel="Add stop"
                style={styles.addStopPressable}
              >
                {({ pressed }) => (
                  <View
                    style={[
                      styles.addStopButton,
                      pressed && styles.addStopPressed,
                    ]}
                  >
                    <Plus size={20} color={colors.onBrand} />
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.block}>
            <SectionHeader title="Premium add-ons" />
            <AddonList
              addons={RIDE_ADDONS}
              selected={orderDetails.addons}
              onToggle={toggleAddon}
            />
          </View>

          <View style={styles.block}>
            <SectionHeader title="Number of cars" />
            <Card padded>
              <View style={styles.carsRow}>
                <View style={styles.carsInfo}>
                  <Text style={styles.carsLabel}>Vehicles in convoy</Text>
                  <Text style={styles.carsHint}>Fare multiplies per car</Text>
                </View>
                <Stepper
                  value={orderDetails.carCount}
                  min={1}
                  max={3}
                  onChange={(carCount) =>
                    updateOrderDetails({ carCount: carCount as CarCount })
                  }
                />
              </View>
            </Card>
          </View>

          <View style={styles.block}>
            <SectionHeader title="Price breakdown" />
            <OrderSummary {...breakdown} />
          </View>

          {isScheduled ? (
            <Badge
              tone="brand"
              label={`Scheduled · ${formatScheduledTime(orderDetails.scheduledFor)}`}
            />
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={isScheduled ? "Schedule ride" : "Place order"}
            size="lg"
            onPress={handleOrder}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    block: { width: "100%" },
    tripCard: { gap: spacing.ms },
    timeRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    timeText: { ...typography.bodyMedium, color: colors.text, flex: 1 },
    changeLink: { ...typography.label, color: colors.brand },
    tripDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    legRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.ms,
    },
    dotPickup: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.pinPickup,
      flexShrink: 0,
    },
    dotStop: {
      width: 9,
      height: 9,
      borderRadius: 2,
      backgroundColor: colors.textMuted,
      flexShrink: 0,
    },
    dotDropoff: {
      width: 9,
      height: 9,
      borderRadius: 2,
      backgroundColor: colors.pinDropoff,
      flexShrink: 0,
    },
    legText: { ...typography.bodySmall, color: colors.text, flex: 1 },
    stopRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    stopInput: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.inputBg,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      minHeight: 52,
      ...typography.body,
      color: colors.text,
    },
    addStopPressable: { flexShrink: 0 },
    addStopButton: {
      width: 52,
      height: 52,
      borderRadius: borderRadius.md,
      backgroundColor: colors.brand,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    addStopPressed: { opacity: 0.85 },
    carsRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.ms,
    },
    carsInfo: { flex: 1, minWidth: 0 },
    carsLabel: { ...typography.bodyMedium, color: colors.text },
    carsHint: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 1,
    },
    footer: {
      width: "100%",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.ms,
      paddingBottom: spacing.ms,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  });
}
