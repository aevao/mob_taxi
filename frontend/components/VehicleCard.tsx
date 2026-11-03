import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bus, Car, Check, Truck } from "lucide-react-native";
import {
  RideEstimate,
  ServiceTier,
  VehicleOption,
  applyTierPricing,
  formatCapacity,
  formatPrice,
} from "@/constants/mockData";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  ThemeColors,
  borderRadius,
  spacing,
  typography,
} from "@/constants/theme";
import { haptics } from "@/lib/haptics";

interface VehicleCardProps {
  vehicle: VehicleOption;
  estimate: RideEstimate | null;
  tier: ServiceTier;
  selected: boolean;
  onSelect: () => void;
}

const VEHICLE_ICONS = { car: Car, truck: Truck, bus: Bus };

export function VehicleCard({
  vehicle,
  estimate,
  tier,
  selected,
  onSelect,
}: VehicleCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const Icon = VEHICLE_ICONS[vehicle.icon];
  const price = estimate?.totalFare ?? applyTierPricing(vehicle, tier).baseRate;
  const priceLabel = estimate
    ? formatPrice(price)
    : `from ${formatPrice(price)}`;

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onSelect();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${vehicle.shortName}, ${priceLabel}`}
      style={({ pressed }) => [
        styles.pressable,
        selected && styles.pressableSelected,
        pressed && !selected && styles.pressablePressed,
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
          <Icon
            size={26}
            strokeWidth={1.5}
            color={selected ? colors.onBrand : colors.text}
          />
        </View>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {vehicle.shortName}
            </Text>
            {selected ? (
              <View style={styles.check}>
                <Check size={11} color={colors.onBrand} strokeWidth={3.5} />
              </View>
            ) : null}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {vehicle.etaMinutes} min away · {formatCapacity(vehicle)}
          </Text>
        </View>

        <Text style={[styles.price, selected && styles.priceSelected]}>
          {priceLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressable: {
      width: "100%",
      alignSelf: "stretch",
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: "transparent",
      marginBottom: spacing.sm,
    },
    pressableSelected: {
      borderColor: colors.brand,
      backgroundColor: colors.brandMuted,
    },
    pressablePressed: { backgroundColor: colors.cardHover },
    row: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.ms,
      paddingVertical: spacing.ms,
      paddingHorizontal: spacing.ms,
      minHeight: 76,
    },
    iconBox: {
      width: 52,
      height: 52,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    iconBoxSelected: { backgroundColor: colors.brand },
    info: { flex: 1, minWidth: 0 },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    name: { ...typography.bodyMedium, color: colors.text, flexShrink: 1 },
    check: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.brand,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    meta: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    price: {
      ...typography.h3,
      color: colors.text,
      flexShrink: 0,
    },
    priceSelected: { color: colors.brand },
  });
}
