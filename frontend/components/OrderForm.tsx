import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Check,
  Handshake,
  LucideIcon,
  PlaneLanding,
  PlaneTakeoff,
} from "lucide-react-native";
import { Card, Divider } from "@/components/ui";
import { AddonId, RideAddon, formatPrice } from "@/constants/mockData";
import { useTheme } from "@/context/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  ThemeColors,
  borderRadius,
  spacing,
  typography,
} from "@/constants/theme";
import { haptics } from "@/lib/haptics";

const ADDON_ICONS: Record<AddonId, LucideIcon> = {
  "meet-greet": Handshake,
  "airport-arrival": PlaneLanding,
  "private-jet": PlaneTakeoff,
};

interface AddonListProps {
  addons: RideAddon[];
  selected: AddonId[];
  onToggle: (id: AddonId) => void;
}

export function AddonList({ addons, selected, onToggle }: AddonListProps) {
  return (
    <Card>
      {addons.map((addon, index) => (
        <View key={addon.id}>
          {index > 0 ? <Divider inset={68} /> : null}
          <AddonToggle
            addon={addon}
            selected={selected.includes(addon.id)}
            onToggle={() => onToggle(addon.id)}
          />
        </View>
      ))}
    </Card>
  );
}

interface AddonToggleProps {
  addon: RideAddon;
  selected: boolean;
  onToggle: () => void;
}

function AddonToggle({ addon, selected, onToggle }: AddonToggleProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const Icon = ADDON_ICONS[addon.id];
  const priceLabel = addon.price > 0 ? `+${formatPrice(addon.price)}` : "Free";

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onToggle();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${addon.label}, ${priceLabel}`}
      accessibilityHint={addon.description}
      style={styles.addonPressable}
    >
      {({ pressed }) => (
        <View style={[styles.addonRow, pressed && styles.addonRowPressed]}>
          <View style={[styles.addonIcon, selected && styles.addonIconSelected]}>
            <Icon
              size={20}
              strokeWidth={1.75}
              color={selected ? colors.brand : colors.textSecondary}
            />
          </View>

          <View style={styles.addonInfo}>
            <Text style={styles.addonLabel} numberOfLines={1}>
              {addon.label}
            </Text>
            <Text style={styles.addonDescription} numberOfLines={2}>
              {addon.description}
            </Text>
          </View>

          <Text
            style={[styles.addonPrice, selected && styles.addonPriceSelected]}
          >
            {priceLabel}
          </Text>

          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected ? (
              <Check size={14} color={colors.onBrand} strokeWidth={3} />
            ) : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

interface OrderSummaryProps {
  baseFare: number;
  addonsTotal: number;
  commission: number;
  carMultiplier: number;
  total: number;
}

export function OrderSummary({
  baseFare,
  addonsTotal,
  commission,
  carMultiplier,
  total,
}: OrderSummaryProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.summary}>
      <SummaryRow
        label={carMultiplier > 1 ? `Ride fare (×${carMultiplier} cars)` : "Ride fare"}
        value={formatPrice(baseFare)}
      />
      {addonsTotal > 0 ? (
        <SummaryRow label="Add-ons" value={formatPrice(addonsTotal)} />
      ) : null}
      <SummaryRow label="Service fee" value={formatPrice(commission)} />
      <View style={styles.summaryDivider} />
      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    addonPressable: { width: "100%", alignSelf: "stretch" },
    addonRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.ms,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.ms,
      minHeight: 68,
    },
    addonRowPressed: { backgroundColor: colors.cardHover },
    addonIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    addonIconSelected: { backgroundColor: colors.brandMuted },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: borderRadius.xs,
      borderWidth: 2,
      borderColor: colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    checkboxSelected: {
      backgroundColor: colors.brand,
      borderColor: colors.brand,
    },
    addonInfo: { flex: 1, minWidth: 0 },
    addonLabel: { ...typography.bodySmallMedium, color: colors.text },
    addonDescription: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 1,
    },
    addonPrice: {
      ...typography.bodySmallMedium,
      color: colors.textSecondary,
      flexShrink: 0,
    },
    addonPriceSelected: { color: colors.brand },
    summary: {
      width: "100%",
      backgroundColor: colors.surfaceAlt,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    summaryRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    summaryLabel: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      flex: 1,
      minWidth: 0,
    },
    summaryValue: { ...typography.bodySmallMedium, color: colors.text },
    summaryDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderLight,
      marginVertical: spacing.xxs,
    },
    totalLabel: { ...typography.bodyMedium, color: colors.text },
    totalValue: { ...typography.h3, color: colors.brand },
  });
}
